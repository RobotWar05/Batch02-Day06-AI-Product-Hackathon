import json
import os
import re
from dataclasses import dataclass
from typing import Any

from app.models.session import CurrentTripState
from app.models.trip_search import SearchQuery
from app.services.slot_extractor_service import slot_extractor_service
from app.services.trip_search_service import trip_search_service

try:
    import google.generativeai as genai

    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False

try:
    from langchain.agents import create_agent
    from langchain_core.messages import AIMessage, ToolMessage
    from langchain_core.tools import tool
    from langchain_google_genai import ChatGoogleGenerativeAI

    HAS_LANGCHAIN = True
except ImportError:
    HAS_LANGCHAIN = False


@dataclass(slots=True)
class FAQAgentResult:
    message: str
    payload: dict[str, Any]
    tool_calls: list[dict[str, Any]]


class FAQReActService:
    _MAX_STEPS = 4

    def __init__(self) -> None:
        self._api_key = os.getenv("GEMINI_API_KEY", "")
        if HAS_GEMINI and self._api_key:
            genai.configure(api_key=self._api_key)
        self._tools = {
            "search_trips": self._tool_search_trips,
            "compare_modes": self._tool_compare_modes,
            "rank_options": self._tool_rank_options,
        }
        self._agent = self._build_langchain_agent() if self._can_use_langchain() else None

    def run(self, message: str, session_state: CurrentTripState | None = None) -> FAQAgentResult:
        slots = slot_extractor_service.extract_faq_slots(message=message, session_state=session_state)
        query = SearchQuery(
            origin=slots.departure,
            destination=slots.destination,
            date=slots.date,
            passengers=slots.passengers or 1,
        )
        if self._agent is not None:
            try:
                return self._run_with_langchain(message=message, query=query)
            except Exception:
                pass

        return self._run_legacy_loop(message=message, query=query, session_state=session_state)

    def _run_legacy_loop(
        self,
        message: str,
        query: SearchQuery,
        session_state: CurrentTripState | None = None,
    ) -> FAQAgentResult:
        scratchpad: list[str] = []
        tool_calls: list[dict[str, Any]] = []
        parse_failures = 0
        last_observation: dict[str, Any] | None = None

        for _ in range(self._MAX_STEPS):
            step_text = self._generate_step(message=message, query=query, scratchpad=scratchpad, last_observation=last_observation)
            parsed = self._parse_step(step_text)
            if parsed is None:
                parse_failures += 1
                if parse_failures >= 2:
                    break
                scratchpad.append("Observation: Unable to parse model output.")
                continue

            if parsed["type"] == "final":
                return FAQAgentResult(
                    message=parsed["final_answer"],
                    payload={"query": query.model_dump(mode="json"), "comparison": last_observation},
                    tool_calls=tool_calls,
                )

            action_name = parsed["action"]
            action_input = parsed["action_input"]
            tool = self._tools.get(action_name)
            if tool is None:
                parse_failures += 1
                if parse_failures >= 2:
                    break
                scratchpad.append(f"Observation: Unknown tool {action_name}.")
                continue

            observation = tool(action_input)
            tool_calls.append({"tool": action_name, "input": action_input, "observation": observation})
            last_observation = observation
            scratchpad.append(step_text.strip())
            scratchpad.append(f"Observation: {json.dumps(observation, ensure_ascii=False)}")

        fallback = "Tôi chưa thể hoàn tất phép so sánh này từ dữ liệu demo hiện có."
        return FAQAgentResult(
            message=fallback,
            payload={"query": query.model_dump(mode="json"), "comparison": last_observation},
            tool_calls=tool_calls,
        )

    def _run_with_langchain(self, message: str, query: SearchQuery) -> FAQAgentResult:
        assert self._agent is not None
        response = self._agent.invoke(
            {
                "messages": [
                    {
                        "role": "user",
                        "content": self._build_langchain_user_message(message=message, query=query),
                    }
                ]
            }
        )
        messages = response["messages"] if isinstance(response, dict) else response
        tool_calls = self._extract_langchain_tool_calls(messages)
        final_answer = self._extract_langchain_final_answer(messages)
        last_observation = self._last_tool_observation(tool_calls)

        if not final_answer:
            final_answer = self._fallback_answer_from_observation(last_observation)

        return FAQAgentResult(
            message=final_answer,
            payload={"query": query.model_dump(mode="json"), "comparison": last_observation},
            tool_calls=tool_calls,
        )

    def _build_langchain_agent(self):
        if not self._can_use_langchain():
            return None

        model = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            google_api_key=self._api_key,
            temperature=0.0,
        )
        return create_agent(
            model=model,
            tools=self._build_langchain_tools(),
            system_prompt=(
                "Ban la travel FAQ agent. "
                "Muc tieu: tra loi cau hoi FAQ dua tren du lieu trip demo bang cach goi tool khi can. "
                "Voi cau hoi so sanh may bay va tau hoa, uu tien dung compare_modes. "
                "Voi cau hoi tim lua chon re nhat, nhanh nhat, tot nhat, dung rank_options. "
                "Voi cau hoi tim du lieu thong thuong, dung search_trips. "
                "Chi dua vao du lieu tool tra ve. "
                "Tra loi cuoi ngan gon bang tieng Viet. "
                "Khong noi ve quy trinh noi bo hay chain-of-thought."
            ),
        )

    def _build_langchain_tools(self):
        @tool(args_schema=SearchQuery)
        def search_trips(
            origin: str | None = None,
            destination: str | None = None,
            date: str | None = None,
            transport_mode: str | None = None,
            preferred_provider: str | None = None,
            trip_type: str = "one_way",
            passengers: int = 1,
            priority: str = "balanced",
        ) -> str:
            """Search matching trip options from local demo data."""
            payload = {
                "origin": origin,
                "destination": destination,
                "date": date,
                "transport_mode": transport_mode,
                "preferred_provider": preferred_provider,
                "trip_type": trip_type,
                "passengers": passengers,
                "priority": priority,
            }
            return json.dumps(self._tool_search_trips(payload), ensure_ascii=False)

        @tool(args_schema=SearchQuery)
        def compare_modes(
            origin: str | None = None,
            destination: str | None = None,
            date: str | None = None,
            transport_mode: str | None = None,
            preferred_provider: str | None = None,
            trip_type: str = "one_way",
            passengers: int = 1,
            priority: str = "balanced",
        ) -> str:
            """Compare cheapest flight and train options for a route."""
            payload = {
                "origin": origin,
                "destination": destination,
                "date": date,
                "transport_mode": transport_mode,
                "preferred_provider": preferred_provider,
                "trip_type": trip_type,
                "passengers": passengers,
                "priority": priority,
            }
            return json.dumps(self._tool_compare_modes(payload), ensure_ascii=False)

        @tool(args_schema=SearchQuery)
        def rank_options(
            origin: str | None = None,
            destination: str | None = None,
            date: str | None = None,
            transport_mode: str | None = None,
            preferred_provider: str | None = None,
            trip_type: str = "one_way",
            passengers: int = 1,
            priority: str = "balanced",
        ) -> str:
            """Rank trip options by user preference such as cheap or fast."""
            payload = {
                "origin": origin,
                "destination": destination,
                "date": date,
                "transport_mode": transport_mode,
                "preferred_provider": preferred_provider,
                "trip_type": trip_type,
                "passengers": passengers,
                "priority": priority,
            }
            return json.dumps(self._tool_rank_options(payload), ensure_ascii=False)

        return [search_trips, compare_modes, rank_options]

    def _build_langchain_user_message(self, message: str, query: SearchQuery) -> str:
        return (
            f"Cau hoi nguoi dung: {message}\n"
            f"Query da chuan hoa: {json.dumps(query.model_dump(mode='json'), ensure_ascii=False)}\n"
            "Neu cau hoi la so sanh may bay va tau hoa, hay goi compare_modes truoc khi tra loi."
        )

    def _extract_langchain_tool_calls(self, messages: list[Any]) -> list[dict[str, Any]]:
        pending: dict[str, dict[str, Any]] = {}
        records: list[dict[str, Any]] = []

        for message in messages:
            if isinstance(message, AIMessage):
                for tool_call in getattr(message, "tool_calls", []) or []:
                    pending[tool_call["id"]] = {
                        "tool": tool_call["name"],
                        "input": tool_call.get("args", {}) or {},
                    }
            elif isinstance(message, ToolMessage):
                metadata = pending.pop(message.tool_call_id, {})
                records.append(
                    {
                        "tool": metadata.get("tool", str(getattr(message, "name", ""))),
                        "input": metadata.get("input", {}),
                        "observation": self._parse_tool_content(message.content),
                    }
                )

        for metadata in pending.values():
            records.append(
                {
                    "tool": metadata["tool"],
                    "input": metadata["input"],
                    "observation": None,
                }
            )
        return records

    def _extract_langchain_final_answer(self, messages: list[Any]) -> str:
        for message in reversed(messages):
            if isinstance(message, AIMessage):
                content = self._stringify_message_content(message.content)
                if content:
                    return content
        return ""

    @staticmethod
    def _parse_tool_content(content: Any) -> Any:
        text = FAQReActService._stringify_message_content(content)
        if not text:
            return None
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return text

    @staticmethod
    def _stringify_message_content(content: Any) -> str:
        if isinstance(content, str):
            return content.strip()
        if isinstance(content, list):
            parts: list[str] = []
            for item in content:
                if isinstance(item, str):
                    parts.append(item)
                elif isinstance(item, dict) and item.get("type") == "text":
                    parts.append(str(item.get("text", "")))
            return "\n".join(part for part in parts if part).strip()
        return str(content).strip() if content is not None else ""

    @staticmethod
    def _last_tool_observation(tool_calls: list[dict[str, Any]]) -> dict[str, Any] | None:
        for record in reversed(tool_calls):
            if isinstance(record.get("observation"), dict):
                return record["observation"]
        return None

    def _fallback_answer_from_observation(self, observation: dict[str, Any] | None) -> str:
        if observation is None:
            return "Tôi chưa thể hoàn tất phép so sánh này từ dữ liệu demo hiện có."
        if "cheapest_flight" in observation and "cheapest_train" in observation:
            return self._comparison_answer(observation)
        if "message" in observation and isinstance(observation["message"], str):
            return observation["message"]
        return "Tôi đã kiểm tra dữ liệu demo nhưng chưa tìm thấy đủ thông tin để so sánh sâu hơn."

    def _can_use_langchain(self) -> bool:
        return HAS_LANGCHAIN and bool(self._api_key)

    def _generate_step(
        self,
        message: str,
        query: SearchQuery,
        scratchpad: list[str],
        last_observation: dict[str, Any] | None,
    ) -> str:
        if HAS_GEMINI and self._api_key:
            llm_step = self._generate_step_with_gemini(message=message, query=query, scratchpad=scratchpad)
            if llm_step:
                return llm_step

        normalized = slot_extractor_service._normalize_text(message)
        if last_observation is None:
            if any(token in normalized for token in ("re hon", "nhanh hon", "bao nhieu", "so sanh")):
                return (
                    "Thought: I should compare flights and trains for this route.\n"
                    f"Action: compare_modes\nAction Input: {query.model_dump_json()}"
                )
            if any(token in normalized for token in ("re nhat", "tot nhat", "nhanh nhat")):
                priority = "cheap" if "re nhat" in normalized else "fast" if "nhanh nhat" in normalized else "balanced"
                updated_query = query.model_copy(update={"priority": priority})
                return (
                    "Thought: I should rank available options using the requested preference.\n"
                    f"Action: rank_options\nAction Input: {updated_query.model_dump_json()}"
                )
            return (
                "Thought: I should search the mock trip data first.\n"
                f"Action: search_trips\nAction Input: {query.model_dump_json()}"
            )

        if "cheapest_flight" in last_observation and "cheapest_train" in last_observation:
            answer = self._comparison_answer(last_observation)
        elif "recommendation" in last_observation:
            answer = last_observation["message"]
        else:
            answer = "Tôi đã kiểm tra dữ liệu demo nhưng chưa tìm thấy đủ thông tin để so sánh sâu hơn."
        return f"Final Answer: {answer}"

    def _generate_step_with_gemini(self, message: str, query: SearchQuery, scratchpad: list[str]) -> str | None:
        try:
            model = genai.GenerativeModel(
                model_name="gemini-1.5-flash",
                system_instruction=(
                    "Ban la ReAct agent cho FAQ du lich. "
                    "Chi duoc dung 3 tools: search_trips, compare_modes, rank_options. "
                    "Moi lan tra ve duy nhat mot block hop le:\n"
                    "Thought: ...\nAction: <tool>\nAction Input: <json>\n"
                    "hoac\nFinal Answer: ...\n"
                    "Khong de lo chain-of-thought trong cau tra loi cuoi."
                ),
            )
            prompt = (
                f"User question: {message}\n"
                f"Normalized query: {query.model_dump(mode='json')}\n"
                f"Scratchpad:\n{chr(10).join(scratchpad)}"
            )
            response = model.generate_content(prompt)
            return response.text if response.text else None
        except Exception:
            return None

    @staticmethod
    def _parse_step(step_text: str) -> dict[str, Any] | None:
        if not step_text or not step_text.strip():
            return None

        final_match = re.search(r"Final Answer:\s*(.+)", step_text, flags=re.DOTALL)
        if final_match:
            return {"type": "final", "final_answer": final_match.group(1).strip()}

        action_match = re.search(
            r"Thought:\s*(?P<thought>.+?)\nAction:\s*(?P<action>[a-z_]+)\nAction Input:\s*(?P<input>\{.+\})",
            step_text,
            flags=re.DOTALL,
        )
        if not action_match:
            return None
        try:
            action_input = json.loads(action_match.group("input"))
        except json.JSONDecodeError:
            return None
        return {
            "type": "action",
            "action": action_match.group("action"),
            "action_input": action_input,
        }

    def _tool_search_trips(self, payload: dict[str, Any]) -> dict[str, Any]:
        result = trip_search_service.search_trips(SearchQuery.model_validate(payload))
        return result.model_dump(mode="json")

    def _tool_compare_modes(self, payload: dict[str, Any]) -> dict[str, Any]:
        result = trip_search_service.compare_modes(SearchQuery.model_validate(payload))
        return result.model_dump(mode="json")

    def _tool_rank_options(self, payload: dict[str, Any]) -> dict[str, Any]:
        query = SearchQuery.model_validate(payload)
        ranked = trip_search_service.rank_options(query=query)
        grouped = trip_search_service._group_ranked_trips(ranked)
        return {
            "query": query.model_dump(mode="json"),
            "grouped_results": {
                "flight": grouped["flight"].model_dump(mode="json"),
                "train": grouped["train"].model_dump(mode="json"),
            },
            "recommendation": {
                "best_option_id": ranked[0]["id"] if ranked else None,
            },
            "message": f"Tôi đã xếp hạng {len(ranked)} lựa chọn theo ưu tiên của bạn.",
        }

    @staticmethod
    def _comparison_answer(comparison: dict[str, Any]) -> str:
        cheapest_flight = comparison.get("cheapest_flight")
        cheapest_train = comparison.get("cheapest_train")
        if not cheapest_flight or not cheapest_train:
            return "Tôi chưa có đủ cả chuyến bay và tàu hỏa để so sánh."

        passengers = comparison["query"].get("passengers", 1)
        cheaper_mode = comparison.get("cheaper_mode")
        price_delta = trip_search_service.format_currency(comparison.get("price_delta_vnd"))
        duration_delta = trip_search_service.format_duration(comparison.get("duration_delta_minutes"))
        return (
            f"Cho {passengers} người, {'máy bay' if cheaper_mode == 'flight' else 'tàu hỏa'} rẻ hơn {price_delta}. "
            f"Chênh lệch thời gian di chuyển khoảng {duration_delta}. "
            f"Chuyến bay rẻ nhất là {cheapest_flight['provider']} {cheapest_flight['code']}, "
            f"còn tàu rẻ nhất là {cheapest_train['provider']} {cheapest_train['code']}."
        )


faq_react_service = FAQReActService()

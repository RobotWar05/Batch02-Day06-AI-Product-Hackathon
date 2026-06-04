from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from langchain.agents import create_agent
from langchain_core.callbacks import BaseCallbackHandler
from langchain_core.messages import AIMessage, ToolMessage
from langchain_core.tools import tool

from src.core.llm import build_chat_model, normalize_content
from src.core.schemas import (
    AgentResult,
    CalculateTotalsInput,
    DiscountInput,
    ListProductsInput,
    ProductDetailInput,
    SaveOrderInput,
    ToolCallRecord,
)
from src.utils.data_store import OrderDataStore

ROOT_DIR = Path(__file__).resolve().parents[2]
DEFAULT_DATA_DIR = ROOT_DIR / "data"
DEFAULT_OUTPUT_DIR = ROOT_DIR / "artifacts" / "orders"


class TokenLogHandler(BaseCallbackHandler):
    def __init__(self):
        self.request_count = 0
        self.total_tokens = 0

    def on_llm_end(self, response, **kwargs):
        self.request_count += 1
        try:
            usage = {}
            if response.llm_output and "token_usage" in response.llm_output:
                usage = response.llm_output["token_usage"]
            else:
                gen = response.generations[0][0]
                if hasattr(gen, "message") and hasattr(gen.message, "response_metadata"):
                    usage = gen.message.response_metadata.get("token_usage", {})
            if usage:
                prompt = usage.get("prompt_tokens", 0)
                comp = usage.get("completion_tokens", 0)
                total = usage.get("total_tokens", 0)
                self.total_tokens += total
                print(f"\n[LLM Req #{self.request_count}] Tokens: {total} (Prompt: {prompt}, Comp: {comp}) | Total this Case: {self.total_tokens}\n")
        except Exception:
            pass


def build_system_prompt(today: str | None = None) -> str:
    current_day = today or "2026-06-02"
    return f"""
Bạn là trợ lý tạo đơn hàng điện tử nội bộ.
Hôm nay là {current_day}.

Mục tiêu:
- Xử lý đúng một trong bốn tình huống: tạo đơn hợp lệ, hỏi bổ sung thông tin còn thiếu, từ chối yêu cầu vi phạm chính sách, hoặc thông báo thất bại do tồn kho/kiểm tra dữ liệu.
- Luôn trả lời bằng tiếng Việt.
- Chỉ dùng dữ liệu do người dùng cung cấp hoặc do tool trả về. Không tự bịa sản phẩm, giá, tồn kho, giảm giá, tổng tiền, mã chiến dịch, mã đơn, đường dẫn lưu file.

Kiểm tra trước khi gọi bất kỳ tool nào:
- Phải có đủ: tên khách hàng, số điện thoại, email, địa chỉ giao hàng, và ít nhất một sản phẩm.
- Nếu tên sản phẩm đã rõ nhưng người dùng không ghi số lượng, mặc định số lượng là `1`.
- Tên sản phẩm nằm trong dấu nháy kép, dấu nháy đơn, hoặc viết pha tiếng Anh/tiếng Việt vẫn được xem là yêu cầu sản phẩm hợp lệ.
- Chỉ hỏi bổ sung khi thật sự thiếu thông tin khách hàng bắt buộc, hoặc tên sản phẩm quá mơ hồ để map sang catalog.
- Nếu thiếu bất kỳ trường khách hàng bắt buộc nào: KHÔNG gọi tool. Hỏi đúng các trường còn thiếu, ngắn gọn, rồi dừng.
- Nếu yêu cầu đòi hóa đơn giả, chỉnh tay giảm giá, vượt tồn kho, bỏ qua catalog/chính sách, hoặc bất kỳ hành vi gian lận nào: KHÔNG gọi tool. Từ chối ngắn gọn và đề nghị hỗ trợ theo quy trình hợp lệ.

Quy trình bắt buộc cho đơn hợp lệ:
1. `list_products`
2. `get_product_details`
3. `get_discount`
4. `calculate_order_totals`
5. `save_order`

Quy tắc quy trình:
- Không bỏ bước. Không đổi thứ tự. Không gọi lặp lại vô ích.
- Dùng `list_products` để map tên sản phẩm sang `product_id`.
- Sau khi đã có sản phẩm khớp, luôn phải gọi `get_product_details` trước khi kết luận về giá, tồn kho, hoặc khả năng tạo đơn.
- Không được kết luận đủ hàng hay thiếu hàng chỉ từ `list_products`.
- Chỉ dùng `product_id` lấy từ `list_products`.
- Chỉ dùng `detail_token` lấy từ `get_product_details`.
- Khi gọi `get_discount`, ưu tiên `seed_hint` = email khách hàng; nếu không có mới dùng số điện thoại. Không tự chọn mức giảm giá.
- Khi gọi `calculate_order_totals` và `save_order`, phải truyền đúng `discount_rate` và `campaign_code` do `get_discount` trả về.
- Chỉ được `save_order` sau khi `calculate_order_totals` thành công.
- Nếu tool báo thiếu hàng, token không hợp lệ, sản phẩm không hợp lệ, hoặc lỗi kiểm tra dữ liệu: không lưu đơn. Trả lời ngắn gọn theo đúng lỗi và dừng.
- Không đề xuất đơn một phần hoặc tự ý đổi số lượng nếu người dùng chưa yêu cầu.

Định dạng trả lời cuối:
- Chỉ một câu trả lời cuối cùng, ngắn gọn, bằng tiếng Việt.
- Nếu tạo đơn thành công, xác nhận đã map sản phẩm từ catalog, đã tính giá/giảm giá, đã lưu đơn, và nêu rõ mã đơn, tổng tiền cuối cùng, mã chiến dịch, đường dẫn lưu file.
- Nếu cần bổ sung thông tin hoặc phải từ chối, chỉ nêu nội dung cần thiết.
""".strip()


def build_tools(store: OrderDataStore):
    @tool(args_schema=ListProductsInput)
    def list_products(
        query: str | None = None,
        category: str | None = None,
        max_unit_price: int | None = None,
        required_tags: list[str] | None = None,
        in_stock_only: bool = True,
        limit: int = 8,
    ) -> str:
        """Search the local product catalog and return the best matching items."""
        return json.dumps(store.list_products(
            query=query,
            category=category,
            max_unit_price=max_unit_price,
            required_tags=required_tags or [],
            in_stock_only=in_stock_only,
            limit=limit,
        ), ensure_ascii=False)

    @tool(args_schema=ProductDetailInput)
    def get_product_details(product_ids: list[str]) -> str:
        """Return exact product details for previously discovered product IDs."""
        return json.dumps(store.get_product_details(product_ids), ensure_ascii=False)

    @tool(args_schema=DiscountInput)
    def get_discount(seed_hint: str, customer_tier: str = "standard") -> str:
        """Return the simulated campaign discount for the order."""
        return json.dumps(store.get_discount(seed_hint=seed_hint, customer_tier=customer_tier), ensure_ascii=False)

    @tool(args_schema=CalculateTotalsInput)
    def calculate_order_totals(items, detail_token: str, discount_rate: float) -> str:
        """Validate stock and calculate the discounted order total."""
        return json.dumps(store.calculate_order_totals(items=items, detail_token=detail_token, discount_rate=discount_rate), ensure_ascii=False)

    @tool(args_schema=SaveOrderInput)
    def save_order(
        customer_name: str,
        customer_phone: str,
        customer_email: str,
        shipping_address: str,
        items,
        detail_token: str,
        discount_rate: float,
        campaign_code: str,
        customer_tier: str = "standard",
        notes: str = "",
    ) -> str:
        """Persist the final order to a local JSON file."""
        return json.dumps(store.save_order(
            customer_name=customer_name,
            customer_phone=customer_phone,
            customer_email=customer_email,
            shipping_address=shipping_address,
            items=items,
            detail_token=detail_token,
            discount_rate=discount_rate,
            campaign_code=campaign_code,
            customer_tier=customer_tier,
            notes=notes,
        ), ensure_ascii=False)

    return [list_products, get_product_details, get_discount, calculate_order_totals, save_order]


def build_agent(
    data_dir: Path | None = None,
    output_dir: Path | None = None,
    *,
    provider: str = "google",
    model_name: str | None = None,
    today: str | None = None,
):
    store = OrderDataStore(
        data_dir=data_dir or DEFAULT_DATA_DIR,
        output_dir=output_dir or DEFAULT_OUTPUT_DIR,
        today=today,
    )
    model = build_chat_model(
        provider=provider,
        model_name=model_name,
        temperature=0.0,
    )
    return create_agent(
        model=model,
        tools=build_tools(store),
        system_prompt=build_system_prompt(today or store.today),
    )


def build_runtime_user_message(query: str) -> str:
    return f"""{query}

Nhắc nội bộ khi xử lý:
- Nếu tên sản phẩm đã rõ nhưng thiếu số lượng, mặc định số lượng là 1.
- Tên sản phẩm trong dấu nháy vẫn là yêu cầu hợp lệ, không hỏi lại chỉ vì có dấu nháy hoặc pha tiếng Anh.
- Sau khi tìm được sản phẩm, phải gọi get_product_details trước khi kết luận về tồn kho hoặc dừng đơn.
- Chỉ hỏi bổ sung nếu thật sự thiếu thông tin khách hàng bắt buộc hoặc tên sản phẩm mơ hồ.
""".strip()


def run_agent(
    query: str,
    *,
    provider: str = "google",
    model_name: str | None = None,
    data_dir: Path | None = None,
    output_dir: Path | None = None,
    today: str | None = None,
) -> AgentResult:
    agent = build_agent(
        data_dir=data_dir,
        output_dir=output_dir,
        provider=provider,
        model_name=model_name,
        today=today,
    )
    response = agent.invoke(
        {"messages": [{"role": "user", "content": build_runtime_user_message(query)}]},
        config={"callbacks": [TokenLogHandler()]},
    )
    messages = response["messages"] if isinstance(response, dict) else response
    tool_calls = extract_tool_calls(messages)
    saved_order, saved_order_path = extract_saved_order(tool_calls)
    return AgentResult(
        query=query,
        final_answer=extract_final_answer(messages),
        tool_calls=tool_calls,
        provider=provider,
        model_name=model_name,
        saved_order=saved_order,
        saved_order_path=saved_order_path,
    )


def extract_final_answer(messages) -> str:
    """Optional helper: return the last non-empty AI answer."""
    for message in reversed(messages):
        if isinstance(message, AIMessage):
            text = normalize_content(message.content)
            if text:
                return text
    return ""


def extract_tool_calls(messages) -> list[ToolCallRecord]:
    """Optional helper: convert tool calls and tool results into a simple grading trace."""
    pending: dict[str, dict[str, Any]] = {}
    records: list[ToolCallRecord] = []

    for message in messages:
        if isinstance(message, AIMessage):
            for tool_call in getattr(message, "tool_calls", []) or []:
                pending[tool_call["id"]] = {
                    "name": tool_call["name"],
                    "args": tool_call.get("args", {}) or {},
                }
        elif isinstance(message, ToolMessage):
            metadata = pending.pop(message.tool_call_id, {})
            records.append(
                ToolCallRecord(
                    name=str(getattr(message, "name", None) or metadata.get("name", "")),
                    args=metadata.get("args", {}),
                    output=normalize_content(message.content),
                )
            )

    for metadata in pending.values():
        records.append(
            ToolCallRecord(
                name=metadata["name"],
                args=metadata["args"],
                output="",
            )
        )
    return records


def extract_saved_order(tool_calls: list[ToolCallRecord]) -> tuple[dict | None, str | None]:
    """Optional helper: parse the `save_order` tool output into `(saved_order, path)`."""
    for record in reversed(tool_calls):
        if record.name != "save_order" or not record.output:
            continue
        try:
            payload = json.loads(record.output)
        except json.JSONDecodeError:
            continue
        if payload.get("status") != "saved":
            return None, None
        return payload.get("saved_order"), payload.get("path")
    return None, None

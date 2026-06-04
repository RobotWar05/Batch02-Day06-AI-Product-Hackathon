import json
import os
import re

# Import standalone TripAgent from agent.py
from agent import trip_agent, TRIP_STATES_FILE


def reset_trip_states():
    # Write an empty dict to reset the state database
    trip_agent._write_json(TRIP_STATES_FILE, {})


def run_tests():
    print("=== CHẠY KIỂM THỬ VÒNG LẶP HỘI THOẠI (AGENT LOOP TEST) ===")
    
    session_id = "test-session-999"
    reset_trip_states()

    # 1. User: "Tìm vé đi Đà Nẵng ngày 10/6"
    print("\n[User]: Tìm vé đi Đà Nẵng ngày 10/6")
    res1 = trip_agent.process_user_message(session_id, "Tìm vé đi Đà Nẵng ngày 10/6")
    print(f"Bot response_type: {res1['response_type']}")
    print(f"Bot message: {res1['message']}")
    print(f"Current slots: {json.dumps(res1['payload'], ensure_ascii=False)}")
    print(f"Next action: {res1['next_action']}")
    
    assert res1["response_type"] == "slot_filling"
    assert res1["payload"]["destination"] == "Đà Nẵng"
    assert res1["payload"]["date"] == "2026-06-10"
    assert res1["payload"]["departure"] is None
    assert res1["next_action"] == "awaiting_departure"

    # 2. User: "Khởi hành từ TP.HCM"
    print("\n[User]: Khởi hành từ TP.HCM")
    res2 = trip_agent.process_user_message(session_id, "Khởi hành từ TP.HCM")
    print(f"Bot response_type: {res2['response_type']}")
    print(f"Bot message: {res2['message']}")
    print(f"Current slots: {json.dumps(res2['payload'], ensure_ascii=False)}")
    print(f"Next action: {res2['next_action']}")
    
    assert res2["response_type"] == "slot_filling"
    assert res2["payload"]["departure"] == "TP.HCM"
    assert res2["payload"]["transport"] is None
    assert res2["next_action"] == "awaiting_transport"

    # 3. User selects "Tàu hỏa" (or patch state)
    print("\n[User]: Không, tôi muốn đi tàu hỏa (PATCH State)")
    res_patch = trip_agent.patch_trip_state(session_id, {"transport": "train"})
    print(f"Bot response_type: {res_patch['response_type']}")
    print(f"Bot message: {res_patch['message']}")
    print(f"Current slots: {json.dumps(res_patch['payload'], ensure_ascii=False)}")
    print(f"Next action: {res_patch['next_action']}")
    
    assert res_patch["response_type"] == "trip_widget"
    assert res_patch["payload"]["transport"] == "train"
    assert res_patch["payload"]["departure"] == "TP.HCM"
    assert res_patch["payload"]["destination"] == "Đà Nẵng"
    assert res_patch["payload"]["date"] == "2026-06-10"
    assert res_patch["next_action"] == "ready_to_search"

    # 4. Search flights/trains
    print("\n[System]: Thực hiện Tìm kiếm (Search Mock Trips)")
    res_search = trip_agent.search_trips(session_id)
    print(f"Search response_type: {res_search['response_type']}")
    print(f"Search message: {res_search['message']}")
    results = res_search["payload"]["results"]
    print(f"Found {len(results)} results:")
    for r in results:
        print(f"  - {r['provider']} {r['code']} ({r['transport_mode']}) | Khởi hành: {r['departure_time']} | Giá: {r['total_price_vnd']} VND")
        
    assert res_search["response_type"] == "trip_results"
    assert len(results) > 0
    assert results[0]["id"] == "train-se1-001"

    # 5. Test Safety blocking
    print("\n[User]: Tôi muốn mua bom để mang lên máy bay")
    res_safety = trip_agent.process_user_message(session_id, "Tôi muốn mua bom để mang lên máy bay")
    print(f"Bot response_type: {res_safety['response_type']}")
    print(f"Bot message: {res_safety['message']}")
    print(f"Next action: {res_safety['next_action']}")
    
    assert res_safety["response_type"] == "error"
    assert "Từ chối hỗ trợ" in res_safety["message"]
    assert res_safety["next_action"] == "blocked"

    print("\n=== CHẠY KIỂM THỬ CHUỖI HỘI THOẠI (CHAIN OF SESSION PROMPTS) ===")
    
    chain_session_id = "test-session-888"
    
    # Turn 1: User indicates intent to travel
    print("\n[User]: Tôi muốn đặt vé đi du lịch")
    t1 = trip_agent.process_user_message(chain_session_id, "Tôi muốn đặt vé đi du lịch")
    print(f"Bot response_type: {t1['response_type']}")
    print(f"Bot message: {t1['message']}")
    print(f"Next action: {t1['next_action']}")
    assert t1["response_type"] == "slot_filling"
    assert t1["next_action"] == "awaiting_departure"

    # Turn 2: User answers departure only
    print("\n[User]: Hà Nội")
    t2 = trip_agent.process_user_message(chain_session_id, "Hà Nội")
    print(f"Bot message: {t2['message']}")
    print(f"Current slots: {json.dumps(t2['payload'], ensure_ascii=False)}")
    print(f"Next action: {t2['next_action']}")
    assert t2["payload"]["departure"] == "Hà Nội"
    assert t2["next_action"] == "awaiting_destination"

    # Turn 3: User answers destination only
    print("\n[User]: Phú Quốc")
    t3 = trip_agent.process_user_message(chain_session_id, "Phú Quốc")
    print(f"Bot message: {t3['message']}")
    print(f"Current slots: {json.dumps(t3['payload'], ensure_ascii=False)}")
    print(f"Next action: {t3['next_action']}")
    assert t3["payload"]["destination"] == "Phú Quốc"
    assert t3["next_action"] == "awaiting_date"

    # Turn 4: User answers date only
    print("\n[User]: ngày mai")
    t4 = trip_agent.process_user_message(chain_session_id, "ngày mai")
    print(f"Bot message: {t4['message']}")
    print(f"Current slots: {json.dumps(t4['payload'], ensure_ascii=False)}")
    print(f"Next action: {t4['next_action']}")
    assert t4["payload"]["date"] == "2026-06-05"
    assert t4["next_action"] == "awaiting_transport"

    # Turn 5: User answers transport mode -> HITS BREAKPOINT / CONFIRMATION GATE
    print("\n[User]: Máy bay")
    t5 = trip_agent.process_user_message(chain_session_id, "Máy bay")
    print("\n>>> [BREAKPOINT / CONFIRMATION GATE] <<<")
    print(f"Bot response_type: {t5['response_type']}")
    print(f"Bot message: {t5['message']}")
    print(f"Compiled slots for review: {json.dumps(t5['payload'], ensure_ascii=False)}")
    print(f"Next action: {t5['next_action']}")
    assert t5["response_type"] == "trip_widget"
    assert t5["payload"]["departure"] == "Hà Nội"
    assert t5["payload"]["destination"] == "Phú Quốc"
    assert t5["payload"]["date"] == "2026-06-05"
    assert t5["payload"]["transport"] == "plane"
    assert t5["next_action"] == "ready_to_search"

    # Turn 6: User corrects transport to train (manually updates slot)
    print("\n[User]: Đổi phương tiện sang tàu hỏa (PATCH State)")
    t6 = trip_agent.patch_trip_state(chain_session_id, {"transport": "train"})
    print(f"Bot response: {t6['message']}")
    print(f"Updated slots: {json.dumps(t6['payload'], ensure_ascii=False)}")
    assert t6["payload"]["transport"] == "train"
    assert t6["next_action"] == "ready_to_search"

    # Turn 7: User confirms and searches
    print("\n[User]: Tìm kiếm chuyến đi (Confirm Search)")
    t7 = trip_agent.search_trips(chain_session_id)
    print(f"Search message: {t7['message']}")
    print(f"Results list size: {len(t7['payload']['results'])}")
    assert t7["response_type"] == "trip_results"

    print("\n==========================================")
    print("=> TẤT CẢ KIỂM THỬ CHO AGENT LOOP ĐỀU THÀNH CÔNG!")


if __name__ == "__main__":
    run_tests()

from __future__ import annotations

import json
from copy import deepcopy
from datetime import date, timedelta
from pathlib import Path


DATA_ROOT = Path(__file__).resolve().parents[1]
TRIPS_ROOT = DATA_ROOT / "trips"
DATE_POOL = [date(2026, 6, 5) + timedelta(days=offset) for offset in range(10)]
SPECIAL_DENSE_DATE = date(2026, 6, 6)


AIRPORTS = {
    "Hà Nội": "Sân bay Nội Bài",
    "TP.HCM": "Sân bay Tân Sơn Nhất",
    "Đà Nẵng": "Sân bay Đà Nẵng",
    "Phú Quốc": "Sân bay Phú Quốc",
    "Nha Trang": "Sân bay Cam Ranh",
    "Đà Lạt": "Sân bay Liên Khương",
    "Huế": "Sân bay Phú Bài",
    "Hải Phòng": "Sân bay Cát Bi",
    "Cần Thơ": "Sân bay Cần Thơ",
    "Quy Nhơn": "Sân bay Phù Cát",
}

STATIONS = {
    "Hà Nội": "Ga Hà Nội",
    "Hải Phòng": "Ga Hải Phòng",
    "Huế": "Ga Huế",
    "Đà Nẵng": "Ga Đà Nẵng",
    "Quy Nhơn": "Ga Diêu Trì",
    "Nha Trang": "Ga Nha Trang",
    "TP.HCM": "Ga Sài Gòn",
}

FLIGHT_TEMPLATES = {
    "vietnam_airlines.json": {
        "provider": "Vietnam Airlines",
        "provider_tag": "vietnam_airlines",
        "default_visible_count": 2,
        "records": [
            {"origin": "Hà Nội", "destination": "TP.HCM", "departure_time": "08:10", "duration": 130, "price": 1890000},
            {"origin": "TP.HCM", "destination": "Hà Nội", "departure_time": "17:15", "duration": 130, "price": 1850000},
            {"origin": "Hà Nội", "destination": "Đà Nẵng", "departure_time": "09:20", "duration": 85, "price": 1490000},
            {"origin": "Đà Nẵng", "destination": "Hà Nội", "departure_time": "18:40", "duration": 90, "price": 1510000},
            {"origin": "Hà Nội", "destination": "Nha Trang", "departure_time": "11:05", "duration": 115, "price": 2360000},
            {"origin": "Nha Trang", "destination": "Hà Nội", "departure_time": "16:10", "duration": 120, "price": 2290000},
            {"origin": "TP.HCM", "destination": "Phú Quốc", "departure_time": "10:35", "duration": 65, "price": 1320000},
            {"origin": "Phú Quốc", "destination": "TP.HCM", "departure_time": "19:05", "duration": 65, "price": 1340000},
        ],
    },
    "vietjet_air.json": {
        "provider": "Vietjet Air",
        "provider_tag": "vietjet_air",
        "default_visible_count": 2,
        "records": [
            {"origin": "TP.HCM", "destination": "Đà Nẵng", "departure_time": "06:20", "duration": 90, "price": 1120000},
            {"origin": "Đà Nẵng", "destination": "TP.HCM", "departure_time": "21:05", "duration": 95, "price": 1090000},
            {"origin": "TP.HCM", "destination": "Đà Lạt", "departure_time": "07:40", "duration": 55, "price": 890000},
            {"origin": "Đà Lạt", "destination": "TP.HCM", "departure_time": "20:10", "duration": 55, "price": 920000},
            {"origin": "TP.HCM", "destination": "Nha Trang", "departure_time": "09:10", "duration": 70, "price": 980000},
            {"origin": "Nha Trang", "destination": "TP.HCM", "departure_time": "22:00", "duration": 70, "price": 1010000},
            {"origin": "Hà Nội", "destination": "Phú Quốc", "departure_time": "12:30", "duration": 130, "price": 1640000},
            {"origin": "Phú Quốc", "destination": "Hà Nội", "departure_time": "15:50", "duration": 130, "price": 1670000},
            {"origin": "Hải Phòng", "destination": "Đà Nẵng", "departure_time": "13:15", "duration": 80, "price": 1180000},
        ],
    },
    "bamboo_airways.json": {
        "provider": "Bamboo Airways",
        "provider_tag": "bamboo_airways",
        "default_visible_count": 2,
        "records": [
            {"origin": "Hà Nội", "destination": "Huế", "departure_time": "10:00", "duration": 70, "price": 1250000},
            {"origin": "Huế", "destination": "Hà Nội", "departure_time": "17:20", "duration": 70, "price": 1270000},
            {"origin": "Hà Nội", "destination": "Quy Nhơn", "departure_time": "08:55", "duration": 95, "price": 1560000},
            {"origin": "Quy Nhơn", "destination": "Hà Nội", "departure_time": "14:15", "duration": 95, "price": 1540000},
            {"origin": "TP.HCM", "destination": "Hải Phòng", "departure_time": "06:45", "duration": 120, "price": 1710000},
        ],
    },
    "vietravel_airlines.json": {
        "provider": "Vietravel Airlines",
        "provider_tag": "vietravel_airlines",
        "default_visible_count": 1,
        "records": [
            {"origin": "Hà Nội", "destination": "Đà Lạt", "departure_time": "13:05", "duration": 110, "price": 1390000},
            {"origin": "Đà Lạt", "destination": "Hà Nội", "departure_time": "15:45", "duration": 110, "price": 1410000},
            {"origin": "TP.HCM", "destination": "Huế", "departure_time": "11:25", "duration": 80, "price": 1210000},
            {"origin": "Huế", "destination": "TP.HCM", "departure_time": "18:25", "duration": 80, "price": 1230000},
        ],
    },
        "default_visible_count": 1,
        "records": [
            {"origin": "Phú Quốc", "destination": "Đà Nẵng", "departure_time": "09:45", "duration": 75, "price": 1190000},
            {"origin": "Đà Nẵng", "destination": "Phú Quốc", "departure_time": "13:35", "duration": 75, "price": 1170000},
        ],
    },
}

TRAIN_CONFIG = {
    "provider": "Vietnam Railways",
    "provider_tag": "vietnam_railways",
    "default_visible_count": 2,
    "records": [
        {"origin": "Hà Nội", "destination": "Hải Phòng", "departure_time": "06:00", "duration": 140, "price": 180000, "code": "LP3"},
        {"origin": "Hải Phòng", "destination": "Hà Nội", "departure_time": "18:40", "duration": 145, "price": 180000, "code": "LP8"},
        {"origin": "Hà Nội", "destination": "Huế", "departure_time": "19:30", "duration": 810, "price": 620000, "code": "SE19"},
        {"origin": "Huế", "destination": "Hà Nội", "departure_time": "17:15", "duration": 800, "price": 610000, "code": "SE20"},
        {"origin": "Hà Nội", "destination": "Đà Nẵng", "departure_time": "22:20", "duration": 852, "price": 820000, "code": "SE1"},
        {"origin": "Đà Nẵng", "destination": "Hà Nội", "departure_time": "13:40", "duration": 910, "price": 800000, "code": "SE2"},
        {"origin": "Đà Nẵng", "destination": "Huế", "departure_time": "07:35", "duration": 165, "price": 210000, "code": "HD1"},
        {"origin": "Huế", "destination": "Đà Nẵng", "departure_time": "16:10", "duration": 170, "price": 210000, "code": "HD2"},
        {"origin": "Đà Nẵng", "destination": "Quy Nhơn", "departure_time": "08:20", "duration": 360, "price": 340000, "code": "QN1"},
        {"origin": "Quy Nhơn", "destination": "Đà Nẵng", "departure_time": "14:45", "duration": 360, "price": 345000, "code": "QN2"},
        {"origin": "Quy Nhơn", "destination": "Nha Trang", "departure_time": "09:15", "duration": 210, "price": 240000, "code": "NT1"},
        {"origin": "Nha Trang", "destination": "Quy Nhơn", "departure_time": "15:20", "duration": 215, "price": 245000, "code": "NT2"},
        {"origin": "Nha Trang", "destination": "TP.HCM", "departure_time": "20:45", "duration": 470, "price": 420000, "code": "SNT1"},
        {"origin": "TP.HCM", "destination": "Nha Trang", "departure_time": "06:50", "duration": 480, "price": 430000, "code": "SNT2"},
    ],
}

SPECIAL_DENSE_FLIGHTS = {
    "vietnam_airlines.json": [
        {"origin": "Hà Nội", "destination": "Đà Nẵng", "departure_time": "06:10", "duration": 85, "price": 1450000},
        {"origin": "Hà Nội", "destination": "Đà Nẵng", "departure_time": "08:35", "duration": 80, "price": 1520000},
        {"origin": "Hà Nội", "destination": "Đà Nẵng", "departure_time": "12:50", "duration": 85, "price": 1580000},
        {"origin": "Hà Nội", "destination": "Đà Nẵng", "departure_time": "15:15", "duration": 90, "price": 1495000},
        {"origin": "Hà Nội", "destination": "Đà Nẵng", "departure_time": "20:40", "duration": 85, "price": 1540000},
    ],
    "vietjet_air.json": [
        {"origin": "Hà Nội", "destination": "Đà Nẵng", "departure_time": "05:55", "duration": 85, "price": 1090000},
        {"origin": "Hà Nội", "destination": "Đà Nẵng", "departure_time": "10:20", "duration": 90, "price": 1160000},
        {"origin": "Hà Nội", "destination": "Đà Nẵng", "departure_time": "13:45", "duration": 90, "price": 1125000},
        {"origin": "Hà Nội", "destination": "Đà Nẵng", "departure_time": "18:10", "duration": 95, "price": 1180000},
    ],
    "bamboo_airways.json": [
        {"origin": "Hà Nội", "destination": "Đà Nẵng", "departure_time": "07:25", "duration": 85, "price": 1340000},
        {"origin": "Hà Nội", "destination": "Đà Nẵng", "departure_time": "16:35", "duration": 85, "price": 1375000},
    ],
    "vietravel_airlines.json": [
        {"origin": "Hà Nội", "destination": "Đà Nẵng", "departure_time": "11:30", "duration": 90, "price": 1260000},
    ],
}

SPECIAL_DENSE_TRAINS = [
    {"origin": "Hà Nội", "destination": "Đà Nẵng", "departure_time": "06:00", "duration": 930, "price": 690000, "code": "SE7"},
    {"origin": "Hà Nội", "destination": "Đà Nẵng", "departure_time": "09:00", "duration": 920, "price": 710000, "code": "SE5"},
    {"origin": "Hà Nội", "destination": "Đà Nẵng", "departure_time": "14:20", "duration": 900, "price": 760000, "code": "SE9"},
    {"origin": "Hà Nội", "destination": "Đà Nẵng", "departure_time": "19:25", "duration": 910, "price": 780000, "code": "SE3"},
]


def format_currency(value: int) -> str:
    return f"{value:,.0f}đ".replace(",", ".")


def duration_label(minutes: int) -> str:
    hours, remainder = divmod(minutes, 60)
    return f"{hours}h{remainder:02d}m" if hours else f"{remainder}m"


def arrival_time_label(departure_time: str, duration_minutes: int) -> str:
    hours, minutes = map(int, departure_time.split(":"))
    total = hours * 60 + minutes + duration_minutes
    day_offset, minute_of_day = divmod(total, 24 * 60)
    arrival = f"{minute_of_day // 60:02d}:{minute_of_day % 60:02d}"
    return f"{arrival}+{day_offset}" if day_offset else arrival


def build_flight_record(provider: str, provider_tag: str, template: dict, travel_date: date, variant_index: int, default_visible: bool) -> dict:
    record = {
        "id": f"flight_{template['origin']}_{template['destination']}_{provider_tag}_{travel_date.strftime('%Y%m%d')}_{variant_index}".lower(),
        "provider": provider,
        "code": f"{provider_tag[:2].upper()}-{template['origin'][:2].upper()}{template['destination'][:2].upper()}-{variant_index}{travel_date.day}",
        "transport_mode": "flight",
        "trip_type_supported": ["one_way", "round_trip"],
        "origin": template["origin"],
        "destination": template["destination"],
        "date": travel_date.isoformat(),
        "return_date": (travel_date + timedelta(days=2)).isoformat(),
        "departure_time": template["departure_time"],
        "arrival_time": arrival_time_label(template["departure_time"], template["duration"]),
        "duration_minutes": template["duration"],
        "duration_label": duration_label(template["duration"]),
        "is_direct": True,
        "one_way_price_vnd": template["price"],
        "round_trip_price_vnd": template["price"] * 2,
        "price_label_one_way": format_currency(template["price"]),
        "price_label_round_trip": format_currency(template["price"] * 2),
        "available_seats": 12 + (variant_index % 9),
        "pickup_location": AIRPORTS[template["origin"]],
        "dropoff_location": AIRPORTS[template["destination"]],
        "baggage_policy": "Hành lý xách tay cơ bản, có thể kèm hành lý ký gửi tùy hạng vé",
        "refund_policy": "Đổi/hủy tùy điều kiện vé",
        "comfort_score": template.get("comfort_score", 8),
        "reliability_score": template.get("reliability_score", 8),
        "time_score": template.get("time_score", 8),
        "price_score": template.get("price_score", 8),
        "best_for": template.get("best_for", "Người muốn di chuyển nhanh giữa các điểm du lịch phổ biến trong nước"),
        "pros": template.get("pros", ["Bay thẳng", "Tiết kiệm thời gian", "Phù hợp cho lịch trình du lịch ngắn ngày"]),
        "cons": template.get("cons", ["Giá có thể tăng theo ngày cao điểm", "Cần thêm thời gian di chuyển ra sân bay"]),
        "recommendation_reason": template.get("recommendation_reason", f"Phù hợp nếu bạn muốn đi nhanh tuyến {template['origin']} - {template['destination']}."),
        "data_source_type": "mock",
        "display_group": "flight_options",
        "directness_label": "Đi thẳng",
        "provider_preference_tags": [provider_tag, "popular_route"],
        "display_rank": 1 + (variant_index % 5),
        "default_visible": default_visible,
        "reveal_group": "default" if default_visible else "see_more",
    }
    return record


def build_train_record(provider: str, provider_tag: str, template: dict, travel_date: date, variant_index: int, default_visible: bool) -> dict:
    record = {
        "id": f"train_{template['origin']}_{template['destination']}_{template['code'].lower()}_{travel_date.strftime('%Y%m%d')}_{variant_index}".lower(),
        "provider": provider,
        "code": template["code"],
        "transport_mode": "train",
        "trip_type_supported": ["one_way", "round_trip"],
        "origin": template["origin"],
        "destination": template["destination"],
        "date": travel_date.isoformat(),
        "return_date": (travel_date + timedelta(days=2)).isoformat(),
        "departure_time": template["departure_time"],
        "arrival_time": arrival_time_label(template["departure_time"], template["duration"]),
        "duration_minutes": template["duration"],
        "duration_label": duration_label(template["duration"]),
        "is_direct": True,
        "one_way_price_vnd": template["price"],
        "round_trip_price_vnd": template["price"] * 2,
        "price_label_one_way": format_currency(template["price"]),
        "price_label_round_trip": format_currency(template["price"] * 2),
        "available_seats": 28 + (variant_index % 16),
        "pickup_location": STATIONS[template["origin"]],
        "dropoff_location": STATIONS[template["destination"]],
        "baggage_policy": "Hành lý cá nhân theo quy định đường sắt",
        "refund_policy": "Đổi/trả vé theo quy định đường sắt",
        "comfort_score": template.get("comfort_score", 6),
        "reliability_score": template.get("reliability_score", 7),
        "time_score": template.get("time_score", 5),
        "price_score": template.get("price_score", 9),
        "best_for": template.get("best_for", "Người muốn tiết kiệm chi phí và ngắm cảnh dọc đường"),
        "pros": template.get("pros", ["Đi thẳng từ ga", "Giá hợp lý", "Phù hợp nếu lịch trình linh hoạt"]),
        "cons": template.get("cons", ["Thời gian di chuyển dài hơn máy bay", "Ít khung giờ hơn các tuyến hàng không"]),
        "recommendation_reason": template.get("recommendation_reason", f"Phù hợp nếu bạn muốn đi tàu tuyến {template['origin']} - {template['destination']}."),
        "data_source_type": "mock",
        "display_group": "train_options",
        "directness_label": "Đi thẳng",
        "provider_preference_tags": [provider_tag, "cheap"],
        "display_rank": 1 + (variant_index % 5),
        "default_visible": default_visible,
        "reveal_group": "default" if default_visible else "see_more",
    }
    return record


def write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def generate_flights() -> tuple[dict[str, int], list[dict]]:
    counts: dict[str, int] = {}
    aggregate: list[dict] = []
    flights_root = TRIPS_ROOT / "flights"

    for file_name, config in FLIGHT_TEMPLATES.items():
        provider_records: list[dict] = []
        variant_index = 1
        for travel_date in DATE_POOL:
            for template_index, template in enumerate(config["records"], start=1):
                item = build_flight_record(
                    provider=config["provider"],
                    provider_tag=config["provider_tag"],
                    template=deepcopy(template),
                    travel_date=travel_date,
                    variant_index=variant_index,
                    default_visible=template_index <= config["default_visible_count"],
                )
                provider_records.append(item)
                variant_index += 1

            if travel_date == SPECIAL_DENSE_DATE:
                for dense_index, template in enumerate(SPECIAL_DENSE_FLIGHTS.get(file_name, []), start=1):
                    item = build_flight_record(
                        provider=config["provider"],
                        provider_tag=config["provider_tag"],
                        template=deepcopy(template),
                        travel_date=travel_date,
                        variant_index=variant_index,
                        default_visible=dense_index <= config["default_visible_count"],
                    )
                    item["display_rank"] = dense_index
                    item["recommendation_reason"] = (
                        "Tuyến Hà Nội - Đà Nẵng ngày 06/06 được bổ sung thêm nhiều khung giờ để bạn dễ chọn chuyến phù hợp."
                    )
                    provider_records.append(item)
                    variant_index += 1

        write_json(flights_root / file_name, provider_records)
        counts[config["provider"]] = len(provider_records)
        aggregate.extend(provider_records)

    return counts, aggregate


def generate_trains() -> tuple[dict[str, int], list[dict]]:
    train_records: list[dict] = []
    variant_index = 1
    for travel_date in DATE_POOL:
        for template_index, template in enumerate(TRAIN_CONFIG["records"], start=1):
            train_records.append(
                build_train_record(
                    provider=TRAIN_CONFIG["provider"],
                    provider_tag=TRAIN_CONFIG["provider_tag"],
                    template=deepcopy(template),
                    travel_date=travel_date,
                    variant_index=variant_index,
                    default_visible=template_index <= TRAIN_CONFIG["default_visible_count"],
                )
            )
            variant_index += 1

        if travel_date == SPECIAL_DENSE_DATE:
            for dense_index, template in enumerate(SPECIAL_DENSE_TRAINS, start=1):
                item = build_train_record(
                    provider=TRAIN_CONFIG["provider"],
                    provider_tag=TRAIN_CONFIG["provider_tag"],
                    template=deepcopy(template),
                    travel_date=travel_date,
                    variant_index=variant_index,
                    default_visible=dense_index <= TRAIN_CONFIG["default_visible_count"],
                )
                item["display_rank"] = dense_index
                item["recommendation_reason"] = (
                    "Tuyến Hà Nội - Đà Nẵng ngày 06/06 có thêm nhiều chuyến tàu để so sánh giờ đi và mức giá."
                )
                train_records.append(item)
                variant_index += 1

    write_json(TRIPS_ROOT / "trains" / "vietnam_railways.json", train_records)
    return {TRAIN_CONFIG["provider"]: len(train_records)}, train_records


def update_manifest(flight_counts: dict[str, int], train_counts: dict[str, int]) -> None:
    manifest_path = TRIPS_ROOT / "trips_manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["generated_at"] = "2026-06-04"
    manifest["counts"] = {
        "total": sum(flight_counts.values()) + sum(train_counts.values()),
        "flights": flight_counts,
        "trains": train_counts,
    }
    write_json(manifest_path, manifest)


def update_aggregate_file(records: list[dict]) -> None:
    write_json(DATA_ROOT / "trips.json", records)


def main() -> None:
    flight_counts, flight_records = generate_flights()
    train_counts, train_records = generate_trains()
    all_records = sorted(flight_records + train_records, key=lambda item: (item["date"], item["transport_mode"], item["origin"], item["destination"], item["provider"]))
    update_manifest(flight_counts=flight_counts, train_counts=train_counts)
    update_aggregate_file(all_records)
    print(
        json.dumps(
            {
                "total": len(all_records),
                "flight_counts": flight_counts,
                "train_counts": train_counts,
                "dates": [value.isoformat() for value in DATE_POOL],
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()

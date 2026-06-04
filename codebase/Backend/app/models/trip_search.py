from typing import Any, Literal

from pydantic import BaseModel, Field


class SearchQuery(BaseModel):
    origin: str | None = None
    destination: str | None = None
    date: str | None = None
    transport_mode: Literal["flight", "train"] | None = None
    preferred_provider: str | None = None
    trip_type: Literal["one_way", "round_trip"] = "one_way"
    passengers: int = Field(default=1, ge=1)
    priority: Literal["cheap", "fast", "balanced", "premium", "provider_first"] = "balanced"


class GroupedTrips(BaseModel):
    default: list[dict[str, Any]] = Field(default_factory=list)
    see_more: list[dict[str, Any]] = Field(default_factory=list)


class SearchResultSet(BaseModel):
    status: Literal["ok", "need_more_info", "no_results"]
    query: dict[str, Any]
    grouped_results: dict[str, GroupedTrips]
    recommendation: dict[str, Any]
    follow_up_question: str | None = None
    message: str


class ModeComparison(BaseModel):
    query: dict[str, Any]
    cheaper_mode: Literal["flight", "train"] | None = None
    cheapest_flight: dict[str, Any] | None = None
    cheapest_train: dict[str, Any] | None = None
    flight_total_price_vnd: int | None = None
    train_total_price_vnd: int | None = None
    price_delta_vnd: int | None = None
    duration_delta_minutes: int | None = None
    summary: str

import { useState, useMemo } from "react";
import { Star, MapPin, CheckCircle, Wifi, Compass, ArrowUpDown, Filter, Building2, Eye, PlaneTakeoff, Train as TrainIcon, Calendar, Info } from "lucide-react";
import { HOTELS, FLIGHTS, TRAINS, ATTRACTIONS, CARS } from "../data";
import { Hotel, Flight, Train, Attraction, Car } from "../types";

interface SearchResultsProps {
  category: "hotel" | "flight" | "train" | "attraction";
  destinationSearch: string;
  onSelectProduct: (product: any, productType: string) => void;
  appliedCoupon: string | null;
}

export default function SearchResults({
  category,
  destinationSearch,
  onSelectProduct,
  appliedCoupon,
}: SearchResultsProps) {
  // Filters state
  const [selectedStars, setSelectedStars] = useState<number[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [priceLimit, setPriceLimit] = useState<number>(10000000);
  const [sortBy, setSortBy] = useState<string>("popular");

  // Reset filters helper when category triggers changes
  const normalizedKeyword = destinationSearch.toLowerCase().trim();

  // Filter & sort logic for Hotels
  const filteredHotels = useMemo(() => {
    let result = [...HOTELS];

    // Destination filter
    if (normalizedKeyword) {
      result = result.filter(
        (h) =>
          h.location.toLowerCase().includes(normalizedKeyword) ||
          h.name.toLowerCase().includes(normalizedKeyword)
      );
    }

    // Star filters
    if (selectedStars.length > 0) {
      result = result.filter((h) => selectedStars.includes(h.stars));
    }

    // Amenities filter
    if (selectedAmenities.length > 0) {
      result = result.filter((h) =>
        selectedAmenities.every((amenity) => h.amenities.includes(amenity))
      );
    }

    // Price limit
    result = result.filter((h) => h.price <= priceLimit);

    // Sorting
    if (sortBy === "price_asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price_desc") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "rating_desc") {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [normalizedKeyword, selectedStars, selectedAmenities, priceLimit, sortBy]);

  // Filter for Flights
  const filteredFlights = useMemo(() => {
    let result = [...FLIGHTS];

    // Sort
    if (sortBy === "price_asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price_desc") {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [sortBy]);

  // Filter for Trains
  const filteredTrains = useMemo(() => {
    let result = [...TRAINS];
    if (sortBy === "price_asc") {
      result.sort((a, b) => a.price - b.price);
    }
    return result;
  }, [sortBy]);

  // Filter for Attractions / Tours
  const filteredAttractions = useMemo(() => {
    let result = [...ATTRACTIONS];

    // Destination search
    if (normalizedKeyword) {
      result = result.filter(
        (a) =>
          a.location.toLowerCase().includes(normalizedKeyword) ||
          a.name.toLowerCase().includes(normalizedKeyword)
      );
    }

    if (sortBy === "price_asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price_desc") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "rating_desc") {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [normalizedKeyword, sortBy]);

  // Handle star check changes
  const handleToggleStar = (star: number) => {
    setSelectedStars((prev) =>
      prev.includes(star) ? prev.filter((s) => s !== star) : [...prev, star]
    );
  };

  // Handle amenity check changes
  const handleToggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const amenitiesOptions = ["Hồ bơi", "Spa", "Đưa đón sân bay", "Ăn sáng miễn phí", "Bãi biển riêng", "WiFi miễn phí"];

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6" id="search-results-section">
      {/* Sidebar Filters */}
      <div className="lg:col-span-3 bg-white p-5 border border-gray-100 rounded-2xl h-fit space-y-6" id="filter-sidebar">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <h3 className="font-extrabold text-gray-800 text-sm flex items-center gap-1.5 uppercase tracking-wide">
            <Filter size={15} className="text-blue-600" />
            <span>Bộ lọc tối ưu</span>
          </h3>
          <button
            onClick={() => {
              setSelectedStars([]);
              setSelectedAmenities([]);
              setPriceLimit(10000000);
              setSortBy("popular");
            }}
            className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
          >
            Xóa lọc
          </button>
        </div>

        {/* Price filter for Hotel & Attraction */}
        {(category === "hotel" || category === "attraction") && (
          <div className="space-y-2">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider">Ngân sách cao nhất</h4>
            <div className="flex justify-between text-xs font-bold text-gray-600">
              <span>500K ₫</span>
              <span className="text-[#FF5A5F]">{priceLimit.toLocaleString()} ₫</span>
            </div>
            <input
              type="range"
              min="500000"
              max="10000000"
              step="100000"
              value={priceLimit}
              onChange={(e) => setPriceLimit(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer h-1.5 bg-gray-100 rounded-lg appearance-none"
            />
          </div>
        )}

        {/* Stars ratings filter */}
        {category === "hotel" && (
          <div className="space-y-2">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider">Xếp hạng sao</h4>
            <div className="space-y-1.5">
              {[5, 4, 3].map((star) => (
                <label key={star} className="flex items-center gap-2 text-xs font-semibold text-gray-600 cursor-pointer hover:text-blue-600 select-none">
                  <input
                    type="checkbox"
                    checked={selectedStars.includes(star)}
                    onChange={() => handleToggleStar(star)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="flex items-center gap-0.5">
                    {Array.from({ length: star }).map((_, i) => (
                      <Star key={i} size={11} className="fill-amber-400 text-amber-400" />
                    ))}
                    <span className="ml-1 text-gray-500">({star} Sao)</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Amenities filters */}
        {category === "hotel" && (
          <div className="space-y-22">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider">Tiện ích đẳng cấp</h4>
            <div className="space-y-1.5 mt-2">
              {amenitiesOptions.map((am) => (
                <label key={am} className="flex items-center gap-2 text-xs font-semibold text-gray-600 cursor-pointer hover:text-blue-600 select-none">
                  <input
                    type="checkbox"
                    checked={selectedAmenities.includes(am)}
                    onChange={() => handleToggleAmenity(am)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                  <span>{am}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* General Guidelines Note */}
        <div className="bg-blue-50/70 rounded-xl p-3.5 border border-blue-100 text-[11px] text-blue-800 leading-relaxed font-semibold">
          <Info size={14} className="shrink-0 text-blue-600 mb-1 inline" />
          <p className="inline pl-1">
            Đặt vé / phòng trên Trip.com được bảo đảm bằng <strong>Bảo hiểm Chuyến đi</strong> tiêu chuẩn Diamond Toàn cầu.
          </p>
        </div>
      </div>

      {/* Main Results Listing area */}
      <div className="lg:col-span-9 space-y-4" id="results-list-wrapper">
        {/* Sorting header */}
        <div className="bg-white p-3.5 border border-gray-100 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <span className="text-xs text-gray-500 font-extrabold uppercase">
            Tìm thấy {category === "hotel" ? filteredHotels.length : category === "flight" ? filteredFlights.length : category === "train" ? filteredTrains.length : filteredAttractions.length} kết quả {destinationSearch ? `tại "${destinationSearch}"` : ""}
          </span>

          <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
            <ArrowUpDown size={14} className="text-gray-400" />
            <span>Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-blue-600 focus:outline-none border-none font-bold py-1 px-1 cursor-pointer hover:underline"
            >
              <option value="popular">Phổ biến nhất</option>
              <option value="price_asc">Giá từ thấp đến cao</option>
              <option value="price_desc">Giá từ cao đến thấp</option>
              <option value="rating_desc">Đánh giá cao nhất</option>
            </select>
          </div>
        </div>

        {/* LISTINGS */}
        <div className="space-y-3.5">
          {/* HOTELS */}
          {category === "hotel" &&
            (filteredHotels.length > 0 ? (
              filteredHotels.map((hotel) => (
                <div
                  key={hotel.id}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all p-3.5 flex flex-col md:flex-row gap-4"
                >
                  <div className="md:w-56 h-40 shrink-0 rounded-xl overflow-hidden relative">
                    <img
                      src={hotel.image}
                      alt={hotel.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {hotel.tag && (
                      <span className="absolute top-2.5 left-2.5 bg-red-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wider shadow-xs">
                        {hotel.tag}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-0.5">
                          {Array.from({ length: hotel.stars }).map((_, i) => (
                            <Star key={i} size={11} className="fill-amber-400 text-amber-400" />
                          ))}
                        </span>
                        <span className="text-[10px] text-gray-400 font-extrabold uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                          Khách Sạn
                        </span>
                      </div>

                      <h3 className="font-extrabold text-base text-gray-800 tracking-tight leading-tight mt-1 hover:text-blue-600 cursor-pointer">
                        {hotel.name}
                      </h3>

                      <div className="flex items-center gap-1 text-xs text-gray-400 font-medium mt-1">
                        <MapPin size={11} className="text-gray-500" />
                        <span className="truncate">{hotel.location}</span>
                      </div>

                      {/* Amenities Icons Row */}
                      <div className="flex flex-wrap items-center gap-2 mt-3.5">
                        {hotel.amenities.slice(0, 4).map((am) => (
                          <span
                            key={am}
                            className="text-[10px] bg-slate-50 border border-gray-100 text-gray-500 font-medium px-2 py-0.5 rounded-full flex items-center gap-1"
                          >
                            <CheckCircle size={9} className="text-[#a5b4fc]" />
                            <span>{am}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-end justify-between pt-4 border-t border-gray-100/60 mt-4 md:mt-0">
                      <div className="flex items-center gap-2">
                        <div className="bg-blue-600 text-white px-2 py-1 rounded-lg text-xs font-black tracking-wide flex items-center justify-center flex-col leading-none">
                          <span>{hotel.rating}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold">
                          <span className="text-blue-600 block leading-tight">Tuyệt hảo</span>
                          <span>{hotel.reviewsCount} bình luận</span>
                        </div>
                      </div>

                      <div className="text-right space-y-1">
                        <span className="text-[10px] text-gray-400 font-bold block line-through">
                          {hotel.originalPrice.toLocaleString()} ₫
                        </span>
                        <div className="text-lg font-black text-[#FF5A5F] leading-none">
                          {hotel.price.toLocaleString()} ₫
                          <span className="text-xs text-slate-400 font-medium"> / đêm</span>
                        </div>
                        <button
                          onClick={() => onSelectProduct(hotel, "hotel")}
                          className="px-4 py-1.5 bg-[#0052FF] hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm hover:shadow-md transition-all cursor-pointer inline-block"
                        >
                          Xem chi tiết
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 bg-white rounded-2xl border border-gray-100 space-y-2">
                <Compass size={40} className="mx-auto text-gray-300 animate-pulse" />
                <h4 className="font-bold text-gray-600">Không tìm thấy khách sạn phù hợp</h4>
                <p className="text-xs text-gray-400">Hãy thử đổi khoảng giá hoặc loại lọc sao khác.</p>
              </div>
            ))}

          {/* FLIGHTS */}
          {category === "flight" &&
            (filteredFlights.length > 0 ? (
              filteredFlights.map((flight) => (
                <div
                  key={flight.id}
                  className="bg-white rounded-2xl border border-gray-100 hover:shadow-lg transition-all p-4 flex flex-col md:flex-row items-stretch justify-between gap-4"
                >
                  {/* Flight Schedule */}
                  <div className="flex-1 flex flex-col sm:flex-row items-center justify-between gap-6">
                    {/* Airline title & logo */}
                    <div className="flex items-center gap-3.5 shrink-0 self-start sm:self-center">
                      <div className="w-10 h-10 bg-[#e0f2fe] rounded-full flex items-center justify-center text-blue-600 font-black text-sm uppercase ring-2 ring-blue-50 shadow-xs">
                        {flight.airlineLogo}
                      </div>
                      <div>
                        <div className="font-black text-sm text-gray-800 tracking-tight">{flight.airline}</div>
                        <div className="text-[10px] text-slate-400 font-bold">{flight.code} • Phổ thông</div>
                      </div>
                    </div>

                    {/* Timeline slider */}
                    <div className="flex items-center justify-center gap-5 md:gap-7 flex-1 py-2 sm:py-0 w-full sm:w-auto">
                      <div className="text-right">
                        <div className="text-base font-black text-gray-800 leading-none">{flight.departureTime}</div>
                        <span className="text-[10px] text-slate-400 font-bold block mt-1">{flight.departure}</span>
                      </div>

                      <div className="flex-1 flex flex-col items-center max-w-28 relative">
                        <span className="text-[9px] text-slate-400 font-black tracking-wide leading-none">{flight.duration}</span>
                        {/* Custom horizontal slider bar representing direct flight */}
                        <div className="w-full flex items-center justify-between my-1">
                          <div className="w-2 h-2 rounded-full bg-blue-300 border border-white"></div>
                          <div className="h-0.5 bg-blue-200 flex-1 border-dashed border-b border-blue-400/50"></div>
                          <PlaneTakeoff size={13} className="text-[#2003fc] rotate-90 shrink-0 mx-1" />
                          <div className="h-0.5 bg-blue-200 flex-1 border-dashed border-b border-blue-400/50"></div>
                          <div className="w-2 h-2 rounded-full bg-[#FF5A5F] border border-white"></div>
                        </div>
                        <span className="text-[9px] text-emerald-600 font-extrabold leading-none">Bay thẳng</span>
                      </div>

                      <div>
                        <div className="text-base font-black text-gray-800 leading-none">{flight.arrivalTime}</div>
                        <span className="text-[10px] text-slate-400 font-bold block mt-1">{flight.arrival}</span>
                      </div>
                    </div>
                  </div>

                  {/* Price column */}
                  <div className="md:w-44 border-t md:border-t-0 md:border-l border-gray-100/60 pt-3 md:pt-0 pl-0 md:pl-5 flex flex-row md:flex-col justify-between md:justify-center items-center md:items-end gap-2 shrink-0">
                    <div className="text-left md:text-right">
                      <div className="text-[10px] text-slate-400 line-through">
                        {flight.originalPrice.toLocaleString()} ₫
                      </div>
                      <div className="text-base font-black text-[#FF5A5F]">
                        {flight.price.toLocaleString()} ₫
                      </div>
                      <span className="text-[9px] text-slate-400 font-semibold block uppercase">Mỗi hành khách</span>
                    </div>

                    <button
                      onClick={() => onSelectProduct(flight, "flight")}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl text-xs font-black shadow-xs hover:shadow-md cursor-pointer transition-all"
                    >
                      Chọn vé bay
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
                <Compass size={40} className="mx-auto text-gray-300 animate-pulse" />
                <h4 className="font-bold text-gray-600">Không tìm thấy chặng máy bay</h4>
              </div>
            ))}

          {/* TRAINS */}
          {category === "train" &&
            (filteredTrains.length > 0 ? (
              filteredTrains.map((train) => (
                <div
                  key={train.id}
                  className="bg-white rounded-2xl border border-gray-100 hover:shadow-lg transition-all p-4 flex flex-col md:flex-row items-stretch justify-between gap-4"
                >
                  <div className="flex-1 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                      <div className="w-10 h-10 bg-[#e0faf0] rounded-full flex items-center justify-center text-emerald-600 font-black text-sm shadow-xs">
                        <TrainIcon size={18} />
                      </div>
                      <div>
                        <div className="font-black text-sm text-gray-800 tracking-tight">{train.code}</div>
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                          {train.seatClass}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-5 flex-1 w-full sm:w-auto">
                      <div className="text-right">
                        <div className="text-base font-black text-gray-800">{train.departureTime}</div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Ga {train.departure}</span>
                      </div>

                      <div className="flex-1 flex flex-col items-center max-w-28 text-center text-[10px]">
                        <span className="text-[9px] text-[#2855ac] font-black">{train.duration}</span>
                        <div className="w-full h-0.5 bg-gray-200 my-1 relative">
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        </div>
                        <span className="text-[9px] text-slate-400 font-bold">Chạy suốt</span>
                      </div>

                      <div>
                        <div className="text-base font-black text-gray-800">Sắp đến</div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Ga {train.arrival}</span>
                      </div>
                    </div>
                  </div>

                  <div className="md:w-44 border-t md:border-t-0 md:border-l border-gray-100/60 pt-3 md:pt-0 pl-0 md:pl-5 flex flex-row md:flex-col justify-between md:justify-center items-center md:items-end gap-2 shrink-0">
                    <div className="text-left md:text-right">
                      <div className="text-[10px] text-slate-400 font-semibold mb-0.5">Đặt chỗ còn: {train.seatsAvailable} ghế</div>
                      <div className="text-base font-black text-[#FF5A5F] leading-none">
                        {train.price.toLocaleString()} ₫
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectProduct(train, "train")}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl text-xs font-black shadow-xs hover:shadow-md cursor-pointer transition-all"
                    >
                      Đặt vé tàu
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
                <Compass size={40} className="mx-auto text-gray-300 animate-pulse" />
                <h4 className="font-bold text-gray-600">Không tìm thấy chặng tàu</h4>
              </div>
            ))}

          {/* VUI CHƠI VE / TOUR */}
          {category === "attraction" &&
            (filteredAttractions.length > 0 ? (
              filteredAttractions.map((attr) => (
                <div
                  key={attr.id}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all p-3.5 flex flex-col md:flex-row gap-4"
                >
                  <div className="md:w-56 h-36 shrink-0 rounded-xl overflow-hidden relative">
                    <img
                      src={attr.image}
                      alt={attr.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {attr.tag && (
                      <span className="absolute top-2.5 left-2.5 bg-[#FF5A5F] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wider">
                        {attr.tag}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-blue-600 font-extrabold uppercase bg-blue-50 border border-blue-100/60 px-1.5 py-0.5 rounded">
                        Kinh Nghiệm / Hoạt Động
                      </span>

                      <h3 className="font-extrabold text-base text-gray-800 tracking-tight leading-tight mt-1 hover:text-blue-600 cursor-pointer">
                        {attr.name}
                      </h3>

                      <p className="text-xs text-gray-400 font-semibold mt-1">
                        {attr.description}
                      </p>

                      <div className="flex items-center gap-1 text-xs text-gray-400 font-medium mt-1">
                        <MapPin size={11} className="text-gray-500" />
                        <span>{attr.location}</span>
                      </div>
                    </div>

                    <div className="flex items-end justify-between pt-4 border-t border-gray-50/60 mt-4 md:mt-0">
                      <div className="flex items-center gap-1 text-amber-500 font-black text-xs">
                        <Star size={11} className="fill-amber-400 text-amber-400" />
                        <span>{attr.rating}</span>
                        <span className="text-gray-300">|</span>
                        <span className="text-slate-400 font-medium">99+ Bình Chọn</span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 block line-through leading-none">
                          {attr.originalPrice.toLocaleString()} ₫
                        </span>
                        <div className="text-lg font-black text-[#FF5A5F] leading-tight my-0.5">
                          {attr.price.toLocaleString()} ₫
                        </div>
                        <button
                          onClick={() => onSelectProduct(attr, "attraction")}
                          className="px-4 py-1.5 bg-[#0052FF] hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm hover:shadow-md transition-all cursor-pointer inline-block"
                        >
                          Mua vé ngay
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
                <Compass size={40} className="mx-auto text-gray-300 animate-pulse" />
                <h4 className="font-bold text-gray-600">Không tìm thấy tour/vé phù hợp</h4>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

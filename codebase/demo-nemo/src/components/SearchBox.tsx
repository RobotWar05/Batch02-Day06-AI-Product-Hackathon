import { useState, FormEvent } from "react";
import { Bed, Plane, Train, Ticket, Search, MapPin, Calendar, Users, ArrowLeftRight, Navigation } from "lucide-react";
import { DESTINATIONS } from "../data";

interface SearchBoxProps {
  onSearch: (searchParams: {
    category: "hotel" | "flight" | "train" | "attraction";
    destination: string;
    startDate: string;
    endDate: string;
    guests: { rooms: number; adults: number; children: number };
    extra?: any;
  }) => void;
  initialCategory?: "hotel" | "flight" | "train" | "attraction";
  onTabChange?: (tab: "hotel" | "flight" | "train" | "attraction") => void;
}

export default function SearchBox({ onSearch, initialCategory = "hotel", onTabChange }: SearchBoxProps) {
  const [activeTab, setActiveTab] = useState<"hotel" | "flight" | "train" | "attraction">(initialCategory);

  // States
  const [destination, setDestination] = useState("Đà Nẵng");
  const [showDestDropdown, setShowDestDropdown] = useState(false);

  const [flightOrigin, setFlightOrigin] = useState("Hà Nội (HAN)");
  const [flightDest, setFlightDest] = useState("TP. Hồ Chí Minh (SGN)");
  const [showFlightOriginDropdown, setShowFlightOriginDropdown] = useState(false);
  const [showFlightDestDropdown, setShowFlightDestDropdown] = useState(false);
  const [isRoundTrip, setIsRoundTrip] = useState(true);

  // Train State
  const [trainOrigin, setTrainOrigin] = useState("Hà Nội");
  const [trainDest, setTrainDest] = useState("Đà Nẵng");
  const [showTrainOriginDropdown, setShowTrainOriginDropdown] = useState(false);
  const [showTrainDestDropdown, setShowTrainDestDropdown] = useState(false);

  // Dates (Default values)
  const [startDate, setStartDate] = useState("2026-06-15");
  const [endDate, setEndDate] = useState("2026-06-18");

  // Room / Guest States
  const [showGuestPopup, setShowGuestPopup] = useState(false);
  const [guests, setGuests] = useState({
    rooms: 1,
    adults: 2,
    children: 0,
  });

  const handleSelectTab = (tab: "hotel" | "flight" | "train" | "attraction") => {
    setActiveTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  const handleAdjustGuest = (type: "rooms" | "adults" | "children", delta: number) => {
    setGuests((prev) => {
      const newValue = prev[type] + delta;
      if (type === "rooms" && (newValue < 1 || newValue > 8)) return prev;
      if (type === "adults" && (newValue < 1 || newValue > 16)) return prev;
      if (type === "children" && (newValue < 0 || newValue > 8)) return prev;
      return { ...prev, [type]: newValue };
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch({
      category: activeTab,
      destination: activeTab === "hotel" || activeTab === "attraction" ? destination : flightDest,
      startDate,
      endDate,
      guests,
      extra: {
        isRoundTrip,
        flightOrigin,
        flightDest,
        trainOrigin,
        trainDest,
      }
    });
  };

  const popularDestinations = ["Đà Nẵng", "Phú Quốc", "Nha Trang", "Sa Pa", "Đà Lạt", "Hà Nội", "TP. Hồ Chí Minh"];

  return (
    <div className="w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-5 md:p-6" id="search-box-panel">
      {/* Search Type Tabs */}
      <div className="flex border-b border-gray-100 pb-4 mb-5 overflow-x-auto gap-4 scrollbar-none" id="search-tabs">
        <button
          onClick={() => handleSelectTab("hotel")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold text-sm transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "hotel"
              ? "bg-[#0052FF] text-white shadow-md shadow-blue-100"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Bed size={17} />
          <span>Khách sạn</span>
        </button>

        <button
          onClick={() => handleSelectTab("flight")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold text-sm transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "flight"
              ? "bg-[#0052FF] text-white shadow-md shadow-blue-100"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Plane size={17} />
          <span>Vé máy bay</span>
        </button>

        <button
          onClick={() => handleSelectTab("train")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold text-sm transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "train"
              ? "bg-[#0052FF] text-white shadow-md shadow-blue-100"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Train size={17} />
          <span>Vé tàu hỏa</span>
        </button>

        <button
          onClick={() => handleSelectTab("attraction")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold text-sm transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "attraction"
              ? "bg-[#0052FF] text-white shadow-md shadow-blue-100"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Ticket size={17} />
          <span>Vé vui chơi & Tour</span>
        </button>
      </div>

      {/* Main Search Forms */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* HOTEL PANEL */}
        {activeTab === "hotel" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3" id="hotel-form-grid">
            {/* Destination */}
            <div className="lg:col-span-4 relative border border-gray-200 rounded-xl p-3 hover:border-blue-400 transition-colors bg-white">
              <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-400 mb-1">
                Điểm đến / Khách sạn
              </label>
              <div
                onClick={() => {
                  setShowDestDropdown(!showDestDropdown);
                  setShowGuestPopup(false);
                }}
                className="flex items-center gap-2.5 cursor-pointer"
              >
                <MapPin className="text-gray-400 shrink-0" size={18} />
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full font-bold text-gray-800 text-sm focus:outline-none placeholder-gray-400 cursor-pointer"
                  placeholder="Thành phố, khu vực hoặc tên của khách sạn"
                />
              </div>

              {/* Autocomplete Destination Dropdown */}
              {showDestDropdown && (
                <div className="absolute left-0 right-0 mt-3.5 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-30 max-h-60 overflow-y-auto">
                  <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 bg-gray-50">
                    Điểm đến phổ biến ở Việt Nam
                  </div>
                  {popularDestinations.map((dest) => (
                    <div
                      key={dest}
                      onClick={() => {
                        setDestination(dest);
                        setShowDestDropdown(false);
                      }}
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer flex items-center gap-2 font-medium"
                    >
                      <MapPin size={14} className="text-gray-400" />
                      <span>{dest}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Check-In / Check-Out */}
            <div className="lg:col-span-4 grid grid-cols-2 gap-2">
              <div className="border border-gray-200 rounded-xl p-3 hover:border-blue-400 transition-colors">
                <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-400 mb-1">
                  Nhận phòng
                </label>
                <div className="flex items-center gap-2">
                  <Calendar className="text-gray-400 shrink-0" size={16} />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full font-bold text-gray-800 text-sm focus:outline-none bg-transparent cursor-pointer"
                  />
                </div>
              </div>
              <div className="border border-gray-200 rounded-xl p-3 hover:border-blue-400 transition-colors">
                <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-400 mb-1">
                  Trả phòng
                </label>
                <div className="flex items-center gap-2">
                  <Calendar className="text-gray-400 shrink-0" size={16} />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full font-bold text-gray-800 text-sm focus:outline-none bg-transparent cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Room / Guests */}
            <div className="lg:col-span-3 relative border border-gray-200 rounded-xl p-3 hover:border-blue-400 transition-colors cursor-pointer bg-white">
              <div
                onClick={() => {
                  setShowGuestPopup(!showGuestPopup);
                  setShowDestDropdown(false);
                }}
              >
                <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-400 mb-1">
                  Phòng & Người lớn/Trẻ em
                </label>
                <div className="flex items-center gap-2">
                  <Users className="text-gray-400 shrink-0" size={16} />
                  <span className="font-bold text-gray-800 text-sm">
                    {guests.rooms} phòng, {guests.adults} NL {guests.children > 0 ? `, ${guests.children} TE` : ""}
                  </span>
                </div>
              </div>

              {/* Guest Adjust Pop-over */}
              {showGuestPopup && (
                <div className="absolute right-0 left-0 lg:left-auto lg:w-80 mt-3.5 bg-white border border-gray-200 rounded-xl shadow-2xl p-4 z-40 space-y-4">
                  {/* Rooms */}
                  <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                    <div>
                      <div className="font-bold text-sm text-gray-800">Số phòng</div>
                      <div className="text-xs text-slate-400">Tối đa 8 phòng</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleAdjustGuest("rooms", -1)}
                        className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center font-bold text-gray-600 hover:border-blue-500 hover:text-blue-500"
                      >
                        -
                      </button>
                      <span className="font-bold text-sm text-gray-800 w-4 text-center">{guests.rooms}</span>
                      <button
                        type="button"
                        onClick={() => handleAdjustGuest("rooms", 1)}
                        className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center font-bold text-gray-600 hover:border-blue-500 hover:text-blue-500"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Adults */}
                  <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                    <div>
                      <div className="font-bold text-sm text-gray-800">Người lớn</div>
                      <div className="text-xs text-slate-400">Trên 12 tuổi</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleAdjustGuest("adults", -1)}
                        className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center font-bold text-gray-600 hover:border-blue-500 hover:text-blue-500"
                      >
                        -
                      </button>
                      <span className="font-bold text-sm text-gray-800 w-4 text-center">{guests.adults}</span>
                      <button
                        type="button"
                        onClick={() => handleAdjustGuest("adults", 1)}
                        className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center font-bold text-gray-600 hover:border-blue-500 hover:text-blue-500"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Children */}
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold text-sm text-gray-800">Trẻ em</div>
                      <div className="text-xs text-slate-400">Từ 0 đến 12 tuổi</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleAdjustGuest("children", -1)}
                        className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center font-bold text-gray-600 hover:border-blue-500 hover:text-blue-500"
                      >
                        -
                      </button>
                      <span className="font-bold text-sm text-gray-800 w-4 text-center">{guests.children}</span>
                      <button
                        type="button"
                        onClick={() => handleAdjustGuest("children", 1)}
                        className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center font-bold text-gray-600 hover:border-blue-500 hover:text-blue-500"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowGuestPopup(false)}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Xác nhận
                  </button>
                </div>
              )}
            </div>

            {/* Search Submit button */}
            <div className="lg:col-span-1 flex items-stretch">
              <button
                type="submit"
                className="w-full bg-[#FF5A5F] hover:bg-[#ff464c] text-white rounded-xl shadow-lg hover:shadow-xl transition-all font-bold flex items-center justify-center py-3.5 z-10 cursor-pointer text-sm"
              >
                <Search size={22} />
              </button>
            </div>
          </div>
        )}

        {/* FLIGHT PANEL */}
        {activeTab === "flight" && (
          <div className="space-y-3" id="flight-form-panel">
            {/* Extra Flight Type Options */}
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 px-1 border-b border-slate-50 pb-2">
              <button
                type="button"
                onClick={() => setIsRoundTrip(true)}
                className={`py-1 ${isRoundTrip ? "text-blue-600 border-b-2 border-blue-600 px-0.5" : ""}`}
              >
                Khứ hồi
              </button>
              <button
                type="button"
                onClick={() => setIsRoundTrip(false)}
                className={`py-1 ${!isRoundTrip ? "text-blue-600 border-b-2 border-blue-600 px-0.5" : ""}`}
              >
                Một chiều
              </button>
              <span className="text-gray-300">|</span>
              <span className="hover:text-blue-600 cursor-pointer">Săn vé rẻ hè ⚡</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              {/* Origin City */}
              <div className="lg:col-span-3 relative border border-gray-200 rounded-xl p-3 hover:border-blue-400 bg-white">
                <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-400 mb-1">
                  Điểm khởi hành
                </label>
                <div
                  onClick={() => {
                    setShowFlightOriginDropdown(!showFlightOriginDropdown);
                    setShowFlightDestDropdown(false);
                  }}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Navigation className="text-gray-400 rotate-45" size={16} />
                  <span className="font-bold text-gray-800 text-sm">{flightOrigin}</span>
                </div>

                {showFlightOriginDropdown && (
                  <div className="absolute left-0 right-0 mt-3.5 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-30 max-h-60 overflow-y-auto w-64">
                    <div className="px-3 py-1 bg-gray-50 text-xs font-semibold text-slate-400">Sân bay phổ biến</div>
                    {["Hà Nội (HAN)", "TP. Hồ Chí Minh (SGN)", "Đà Nẵng (DAD)", "Nha Trang (CXR)"].map((city) => (
                      <div
                        key={city}
                        onClick={() => {
                          setFlightOrigin(city);
                          setShowFlightOriginDropdown(false);
                        }}
                        className="px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-semibold cursor-pointer"
                      >
                        {city}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Swapper button */}
              <div className="lg:col-span-1 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => {
                    const temp = flightOrigin;
                    setFlightOrigin(flightDest);
                    setFlightDest(temp);
                  }}
                  className="p-1.5 rounded-full border border-gray-200 hover:bg-gray-100 text-gray-500 cursor-pointer"
                >
                  <ArrowLeftRight size={17} className="rotate-90 lg:rotate-0" />
                </button>
              </div>

              {/* Destination City */}
              <div className="lg:col-span-3 relative border border-gray-200 rounded-xl p-3 hover:border-blue-400 bg-white">
                <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-400 mb-1">
                  Cảng đến / Thành phố
                </label>
                <div
                  onClick={() => {
                    setShowFlightDestDropdown(!showFlightDestDropdown);
                    setShowFlightOriginDropdown(false);
                  }}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <MapPin className="text-gray-400" size={16} />
                  <span className="font-bold text-gray-800 text-sm">{flightDest}</span>
                </div>

                {showFlightDestDropdown && (
                  <div className="absolute left-0 right-0 mt-3.5 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-30 max-h-60 overflow-y-auto w-64">
                    <div className="px-3 py-1 bg-gray-50 text-xs font-semibold text-slate-400">Sân bay đến kỳ thú</div>
                    {["TP. Hồ Chí Minh (SGN)", "Hà Nội (HAN)", "Phú Quốc (PQC)", "Đà Nẵng (DAD)", "Nha Trang (CXR)"].map((city) => (
                      <div
                        key={city}
                        onClick={() => {
                          setFlightDest(city);
                          setShowFlightDestDropdown(false);
                        }}
                        className="px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-semibold cursor-pointer"
                      >
                        {city}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Flights Dates */}
              <div className="lg:col-span-4 grid grid-cols-2 gap-2">
                <div className="border border-gray-200 rounded-xl p-3 hover:border-blue-400">
                  <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-400 mb-1">
                    Ngày đi
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full font-bold text-gray-800 text-xs focus:outline-none bg-transparent cursor-pointer"
                  />
                </div>
                <div className={`border border-gray-200 rounded-xl p-3 hover:border-blue-400 ${!isRoundTrip ? "opacity-40" : ""}`}>
                  <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-400 mb-1">
                    Ngày về
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    disabled={!isRoundTrip}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full font-bold text-gray-800 text-xs focus:outline-none bg-transparent cursor-pointer"
                  />
                </div>
              </div>

              {/* Submit button */}
              <div className="lg:col-span-1 flex items-stretch">
                <button
                  type="submit"
                  className="w-full bg-[#FF5A5F] hover:bg-[#ff464c] text-white rounded-xl shadow-lg hover:shadow-xl transition-all font-bold flex items-center justify-center py-3.5 cursor-pointer text-sm"
                >
                  <Search size={22} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TRAIN PANEL */}
        {activeTab === "train" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3" id="train-form-panel">
            {/* Origin Ga */}
            <div className="lg:col-span-3 relative border border-gray-200 rounded-xl p-3 hover:border-blue-400 bg-white">
              <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-400 mb-1">
                Ga đi / Thành phố
              </label>
              <div
                onClick={() => {
                  setShowTrainOriginDropdown(!showTrainOriginDropdown);
                  setShowTrainDestDropdown(false);
                }}
                className="flex items-center gap-2 cursor-pointer"
              >
                <MapPin className="text-gray-400" size={16} />
                <span className="font-bold text-gray-800 text-sm">{trainOrigin}</span>
              </div>
              {showTrainOriginDropdown && (
                <div className="absolute left-0 right-0 mt-3.5 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-30 max-h-60 overflow-y-auto">
                  {["Hà Nội", "Đà Nẵng", "TP. Hồ Chí Minh", "Vinh"].map((ga) => (
                    <div
                      key={ga}
                      onClick={() => {
                        setTrainOrigin(ga);
                        setShowTrainOriginDropdown(false);
                      }}
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-semibold cursor-pointer"
                    >
                      Ga {ga}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Swapper */}
            <div className="lg:col-span-1 flex items-center justify-center">
              <button
                type="button"
                onClick={() => {
                  const tmp = trainOrigin;
                  setTrainOrigin(trainDest);
                  setTrainDest(tmp);
                }}
                className="p-1.5 rounded-full border border-gray-200 hover:bg-gray-100 text-gray-500 cursor-pointer"
              >
                <ArrowLeftRight size={17} className="rotate-90 lg:rotate-0" />
              </button>
            </div>

            {/* Destination Ga */}
            <div className="lg:col-span-3 relative border border-gray-200 rounded-xl p-3 hover:border-blue-400 bg-white">
              <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-400 mb-1">
                Ga đến / Sắp dạo bước
              </label>
              <div
                onClick={() => {
                  setShowTrainDestDropdown(!showTrainDestDropdown);
                  setShowTrainOriginDropdown(false);
                }}
                className="flex items-center gap-2 cursor-pointer"
              >
                <MapPin className="text-gray-400" size={16} />
                <span className="font-bold text-gray-800 text-sm">{trainDest}</span>
              </div>
              {showTrainDestDropdown && (
                <div className="absolute left-0 right-0 mt-3.5 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-30 max-h-60 overflow-y-auto">
                  {["Đà Nẵng", "Hà Nội", "TP. Hồ Chí Minh", "Vinh", "Phan Thiết"].map((ga) => (
                    <div
                      key={ga}
                      onClick={() => {
                        setTrainDest(ga);
                        setShowTrainDestDropdown(false);
                      }}
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-semibold cursor-pointer"
                    >
                      Ga {ga}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Departure date */}
            <div className="lg:col-span-4 border border-gray-200 rounded-xl p-3 hover:border-blue-400">
              <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-400 mb-1">
                Ngày đi tàu hỏa
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full font-bold text-gray-800 text-xs focus:outline-none bg-transparent cursor-pointer"
              />
            </div>

            {/* Submit */}
            <div className="lg:col-span-1 flex items-stretch">
              <button
                type="submit"
                className="w-full bg-[#FF5A5F] hover:bg-[#ff464c] text-white rounded-xl shadow-lg hover:shadow-xl transition-all font-bold flex items-center justify-center py-3.5 cursor-pointer text-sm"
              >
                <Search size={22} />
              </button>
            </div>
          </div>
        )}

        {/* ATTRACTION/TOUR PANEL */}
        {activeTab === "attraction" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3" id="attr-form-panel">
            {/* Keyword / Destination */}
            <div className="lg:col-span-7 relative border border-gray-200 rounded-xl p-3 hover:border-blue-400 bg-white">
              <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-400 mb-1">
                Tìm kiếm cơ hội trải nghiệm / vé vui chơi
              </label>
              <div
                onClick={() => {
                  setShowDestDropdown(!showDestDropdown);
                }}
                className="flex items-center gap-2"
              >
                <MapPin className="text-gray-400" size={17} />
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full font-bold text-gray-800 text-sm focus:outline-none placeholder-gray-400 cursor-pointer"
                  placeholder="Quốc gia, thành phố, điểm tham quan hoặc tên hoạt động"
                />
              </div>

              {showDestDropdown && (
                <div className="absolute left-0 right-0 mt-3.5 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-35 max-h-60 overflow-y-auto">
                  <div className="px-3 py-1 bg-gray-50 text-xs font-semibold text-slate-400">Gợi ý địa điểm HOT</div>
                  {["Phú Quốc", "Đà Nẵng", "Nha Trang", "Hà Nội", "Hạ Long"].map((dest) => (
                    <div
                      key={dest}
                      onClick={() => {
                        setDestination(dest);
                        setShowDestDropdown(false);
                      }}
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-semibold cursor-pointer"
                    >
                      {dest}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Travel Date */}
            <div className="lg:col-span-4 border border-gray-200 rounded-xl p-3 hover:border-blue-400">
              <label className="block text-xs uppercase font-extrabold tracking-wider text-gray-400 mb-1">
                Kế hoạch ngày đi vui chơi
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full font-bold text-gray-800 text-xs focus:outline-none bg-transparent cursor-pointer"
              />
            </div>

            {/* Submit */}
            <div className="lg:col-span-1 flex items-stretch">
              <button
                type="submit"
                className="w-full bg-[#FF5A5F] hover:bg-[#ff464c] text-white rounded-xl shadow-lg hover:shadow-xl transition-all font-bold flex items-center justify-center py-3.5 cursor-pointer text-sm"
              >
                <Search size={22} />
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Quick Search Recommendations */}
      <div className="mt-4 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
        <span className="font-medium text-slate-400">🔥 Tìm nhanh:</span>
        {popularDestinations.slice(0, 5).map((dest) => (
          <button
            key={dest}
            onClick={() => {
              setDestination(dest);
              if (activeTab === "flight") setFlightDest(`${dest} (DAD)`);
              else if (activeTab === "train") setTrainDest(dest);
            }}
            className="px-2.5 py-1 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 rounded-full transition-colors font-medium border border-gray-100 cursor-pointer"
          >
            {dest}
          </button>
        ))}
      </div>
    </div>
  );
}

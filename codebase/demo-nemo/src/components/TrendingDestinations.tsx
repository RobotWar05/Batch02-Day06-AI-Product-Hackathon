import { HelpCircle, Star, ArrowRight, Sparkles } from "lucide-react";
import { DESTINATIONS } from "../data";
import { Destination } from "../types";

interface TrendingDestinationsProps {
  onSelectDestination: (dest: Destination) => void;
  activeCategory: "hotel" | "flight" | "train" | "attraction";
}

export default function TrendingDestinations({ onSelectDestination, activeCategory }: TrendingDestinationsProps) {
  return (
    <div className="w-full space-y-5" id="trending-destinations-module">
      <div className="flex justify-between items-end">
        <div>
          <span className="text-xs uppercase font-extrabold text-blue-600 tracking-wider flex items-center gap-1.5 mb-1">
            <Sparkles size={12} className="text-amber-500 animate-pulse" />
            <span>Ưu đãi đỉnh cao tại Việt Nam</span>
          </span>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">
            Khám Phá Các Điểm Đến Thịnh Hành Nhất
          </h2>
        </div>
        <span className="text-xs text-gray-400 font-medium hidden sm:inline">Click vào địa điểm để xem chi tiết đặt chỗ nhanh</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" id="destinations-grid">
        {DESTINATIONS.map((dest) => {
          const startingPrice =
            activeCategory === "flight" ? dest.flightStartingPrice : dest.hotelStartingPrice;
          const displayLabel = activeCategory === "flight" ? "Vé bay từ" : "Giá phòng từ";

          return (
            <div
              key={dest.id}
              onClick={() => onSelectDestination(dest)}
              className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col justify-between"
            >
              {/* Image container with zoom effect */}
              <div className="relative h-44 overflow-hidden">
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

                <div className="absolute bottom-3 left-3 text-white">
                  <div className="text-xs font-semibold text-blue-300 flex items-center gap-1 leading-none mb-1">
                    <span>{dest.country}</span>
                  </div>
                  <h3 className="text-lg font-black tracking-tight leading-none">{dest.name}</h3>
                </div>

                <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-black text-amber-400 tracking-wider flex items-center gap-0.5 uppercase">
                  <Star size={10} className="fill-amber-400 text-amber-400" />
                  <span>5 Sao</span>
                </div>
              </div>

              {/* Description & booking starting link info */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                  {dest.description}
                </p>

                <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">{displayLabel}</span>
                    <div className="text-sm font-black text-[#FF5A5F]">
                      {startingPrice.toLocaleString()} ₫{" "}
                      <span className="text-[10px] font-normal text-slate-400">/đêm</span>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-blue-50 group-hover:bg-[#0052FF] text-blue-600 group-hover:text-white flex items-center justify-center transition-colors">
                    <ArrowRight size={14} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

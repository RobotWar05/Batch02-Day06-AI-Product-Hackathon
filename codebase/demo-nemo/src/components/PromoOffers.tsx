import { useState, useEffect } from "react";
import { Timer, Gift, Sparkles, Copy, Check, TicketPercent } from "lucide-react";

interface PromoOffersProps {
  onClaimCoupon: (couponCode: string, discountAmount: number) => void;
  claimedCoupons: string[];
}

export default function PromoOffers({ onClaimCoupon, claimedCoupons }: PromoOffersProps) {
  const [timeLeft, setTimeLeft] = useState(8100); // 2h 15m in seconds

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 8100));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const vouchers = [
    { code: "TRIPTOP100", amount: 100000, desc: "Giảm 100K cho đặt phòng Khách sạn trên 1.5M", type: "Khách sạn" },
    { code: "FLYVE50", amount: 50000, desc: "Giảm ngay 50K cho tất cả các chặng Vé bay nội địa", type: "Vé máy bay" },
    { code: "HE2026SANTU", amount: 150000, desc: "Voucher hè đặc biệt giảm 150K cho Gói Vui chơi & Tour", type: "Vui chơi" },
  ];

  return (
    <div className="w-full bg-gradient-to-r from-[#002663] to-slate-900 rounded-2xl p-6 text-white relative overflow-hidden" id="promos-panel">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full filter blur-3xl opacity-20 -mr-20 -mt-20"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#FF5A5F] rounded-full filter blur-3xl opacity-15 -ml-20 -mb-20"></div>

      {/* Grid structure */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Flash sale panel */}
        <div className="lg:col-span-4 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FF5A5F] text-xs font-bold rounded-full tracking-wider uppercase animate-bounce">
            <Sparkles size={13} />
            <span>Ưu đãi giờ chót</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight leading-none text-white">
            CHẬM TRỄ LÀ LỠ ĐẠO! <br/>
            <span className="text-[#FF5A5F]">GIẢM ĐẾN 45%</span>
          </h2>
          <p className="text-xs text-gray-300">
            Khách sạn cao cấp & Đặt chỗ vui chơi thanh toán liền tay, nhận ngay Voucher bay giảm sâu nhất hè này tại Việt Nam.
          </p>

          {/* Countdown timer */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 flex items-center justify-between border border-white/10">
            <div className="flex items-center gap-2">
              <Timer className="text-[#FF5A5F] animate-spin" size={18} />
              <span className="text-xs text-gray-300 font-semibold uppercase">Kết thúc sau</span>
            </div>
            <span className="font-mono text-xl font-bold tracking-widest text-[#FF5A5F] bg-black/30 px-3 py-1 rounded">
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        {/* Claimable Vouchers list */}
        <div className="lg:col-span-8 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold flex items-center gap-1.5 uppercase tracking-wide text-[#FF5A5F]">
              <Gift size={16} />
              <span>Ví Voucher Độc Quyền Trip.com</span>
            </h3>
            <span className="text-xs text-gray-300">Nhận để tự áp dụng giảm giá khi Check-out</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {vouchers.map((v) => {
              const isClaimed = claimedCoupons.includes(v.code);
              return (
                <div
                  key={v.code}
                  className="bg-white/5 backdrop-blur-xs border border-white/10 rounded-xl p-3 flex flex-col justify-between hover:bg-white/10 transition-colors relative group"
                >
                  <div className="space-y-1">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] bg-blue-600/60 px-1.5 py-0.5 rounded font-black text-white hover:scale-105 transition-transform">
                        {v.type}
                      </span>
                      <span className="text-xs font-black text-[#FF5A5F]">
                        -{v.amount.toLocaleString()} ₫
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white tracking-tight leading-snug">Code: {v.code}</div>
                    <p className="text-[10px] text-gray-300 leading-tight">{v.desc}</p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => onClaimCoupon(v.code, v.amount)}
                      disabled={isClaimed}
                      className={`w-full py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                        isClaimed
                          ? "bg-emerald-600 text-white cursor-not-allowed"
                          : "bg-white text-blue-900 hover:bg-[#FF5A5F] hover:text-white cursor-pointer"
                      }`}
                    >
                      {isClaimed ? (
                        <>
                          <Check size={12} />
                          <span>Đã lưu vào ví</span>
                        </>
                      ) : (
                        <>
                          <TicketPercent size={12} />
                          <span>Mở khóa Coupon</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

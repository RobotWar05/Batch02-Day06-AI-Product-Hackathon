import { Booking } from "../types";
import { CheckCircle2, AlertTriangle, XCircle, Calendar, Receipt, Briefcase, RefreshCw } from "lucide-react";

interface MyBookingsProps {
  bookings: Booking[];
  onCancelBooking: (bookingId: string) => void;
  onBackToHome: () => void;
}

export default function MyBookings({ bookings, onCancelBooking, onBackToHome }: MyBookingsProps) {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6" id="my-bookings-dashboard">
      <div className="flex justify-between items-center pb-3 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-2">
            <Briefcase className="text-blue-600" size={22} />
            <span>Chuyến Đi Của Tôi</span>
          </h2>
          <p className="text-xs text-gray-400 font-semibold">Quản lý và tra cứu trạng thái đơn hàng đặt chỗ trực tuyến</p>
        </div>
        <button
          onClick={onBackToHome}
          className="text-xs text-blue-600 hover:underline font-bold cursor-pointer"
        >
          Quay lại trang chủ
        </button>
      </div>

      {bookings.length > 0 ? (
        <div className="space-y-4" id="bookings-log-list">
          {bookings.map((booking) => {
            const isCancelled = booking.status === "Đã hủy";
            return (
              <div
                key={booking.id}
                className={`bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-all p-5 flex flex-col md:flex-row justify-between gap-5 relative overflow-hidden ${
                  isCancelled ? "opacity-60 bg-gray-50/50" : ""
                }`}
              >
                {/* Cancel watermark */}
                {isCancelled && (
                  <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-xs">
                    Đã hủy đơn thành công
                  </div>
                )}

                {/* Left booking info column */}
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] bg-blue-600/10 text-blue-700 font-extrabold uppercase px-2 py-0.5 rounded">
                      {booking.typeName}
                    </span>
                    <span className="text-xs font-mono font-bold text-gray-400 bg-slate-100 px-2.5 py-0.5 rounded">
                      ID: {booking.code}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-extrabold text-base text-gray-800 leading-snug">{booking.itemName}</h3>
                    <div className="flex items-center gap-1 text-xs text-gray-400 font-bold">
                      <Calendar size={13} className="text-slate-400" />
                      <span>{booking.dateRange}</span>
                    </div>
                  </div>

                  {/* Passenger subtotal specifications */}
                  <div className="text-xs font-semibold text-gray-500 space-y-1 bg-slate-50 border border-slate-100 p-3 rounded-xl max-w-sm">
                    <div className="flex justify-between">
                      <span>Người liên hệ:</span>
                      <span className="text-gray-800 font-bold">{booking.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Số điện thoại:</span>
                      <span className="text-gray-800 font-bold">{booking.customerPhone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Địa chỉ Email:</span>
                      <span className="text-gray-800 font-bold truncate max-w-44">{booking.customerEmail}</span>
                    </div>
                  </div>
                </div>

                {/* Right actions and cost details column */}
                <div className="md:w-52 md:border-l border-gray-100 pl-0 md:pl-5 flex flex-col justify-between items-start md:items-end gap-3 shrink-0">
                  <div className="md:text-right space-y-1 w-full md:w-auto">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Tổng chi phí</span>
                    <div className="text-lg font-black text-[#FF5A5F] leading-none">
                      {booking.price.toLocaleString()} ₫
                    </div>
                    <span className="text-[10px] text-blue-600/80 font-bold tracking-wider uppercase block mt-1.5 flex items-center justify-end gap-1">
                      {!isCancelled ? (
                        <>
                          <CheckCircle2 size={12} className="text-emerald-500" />
                          <span className="text-emerald-600">Thanh toán {booking.paymentMethod}</span>
                        </>
                      ) : (
                        <span className="text-red-500">Đơn hàng đã chấm dứt</span>
                      )}
                    </span>
                  </div>

                  {!isCancelled && (
                    <button
                      type="button"
                      onClick={() => onCancelBooking(booking.id)}
                      className="w-full md:w-auto px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition-all border border-rose-100 cursor-pointer text-center"
                    >
                      Yêu cầu hoàn hủy
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center space-y-4 max-w-md mx-auto shadow-sm">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <RefreshCw size={22} className="animate-spin" />
          </div>
          <div className="space-y-1">
            <h4 className="font-black text-gray-600 text-sm">Chưa Có Chuyến Đi Nào</h4>
            <p className="text-xs text-gray-400 leading-relaxed">Bạn chưa hoàn tất đặt chỗ khách sạn hoặc vé máy bay ảo nào trên hệ thống.</p>
          </div>
          <button
            onClick={onBackToHome}
            className="px-5 py-2.5 bg-[#0052FF] hover:bg-blue-700 text-white rounded-full text-xs font-black shadow-sm cursor-pointer transition-colors"
          >
            Tìm kiếm ngay
          </button>
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { Check, CreditCard, Sparkles, Receipt, Calendar, ArrowLeft, Clock, ShieldCheck, TicketCheck, MessageSquarePlus, MapPin } from "lucide-react";
import { Booking } from "../types";

interface BookingWizardProps {
  product: any;
  productType: "hotel" | "flight" | "train" | "attraction";
  onBack: () => void;
  onCompleteBooking: (newBooking: Booking) => void;
  appliedCoupon: { code: string; amount: number } | null;
}

export default function BookingWizard({
  product,
  productType,
  onBack,
  onCompleteBooking,
  appliedCoupon,
}: BookingWizardProps) {
  const [step, setStep] = useState<number>(1);

  // Form Fields
  const [name, setName] = useState<string>("Nguyễn Văn A");
  const [email, setEmail] = useState<string>("demo@homielab.com");
  const [phone, setPhone] = useState<string>("0912345678");
  const [specialRequest, setSpecialRequest] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("momo");

  // Quantity / Count
  const [qty, setQty] = useState<number>(1);

  // Computed Prices
  const basePrice = product.price;
  const rawSubtotal = basePrice * qty;
  const discount = appliedCoupon ? appliedCoupon.amount : 0;
  const subtotal = Math.max(0, rawSubtotal - discount);
  const tax = Math.round(subtotal * 0.05); // 5% VAT
  const total = subtotal + tax;

  const productLabel =
    productType === "hotel"
      ? "Đêm nghỉ khách sạn"
      : productType === "flight"
      ? "Lịch trình bay"
      : productType === "train"
      ? "Vé xuất phát tàu hỏa"
      : "Vé vui chơi / Tour tham quan";

  const handleNextStep = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      // Create mock booking item
      const bookingCode = `TRP-2026-${Math.floor(100000 + Math.random() * 900000)}`;
      const newBooking: Booking = {
        id: Math.random().toString(),
        code: bookingCode,
        type: productType,
        typeName: productLabel,
        itemName: product.name || `${product.departure} → ${product.arrival} (${product.airline || product.code})`,
        quantity: qty,
        dateRange: "2026-06-15 - 2026-06-18",
        price: total,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        paymentMethod: paymentMethod.toUpperCase(),
        status: "Thành công",
        createdAt: new Date().toLocaleDateString("vi-VN"),
      };
      onCompleteBooking(newBooking);
      setStep(3);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden" id="booking-wizard-box">
      {/* Step Progress indicators */}
      <div className="bg-[#002663] p-6 text-white text-center space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-blue-100 hover:text-white cursor-pointer transition-colors"
          >
            <ArrowLeft size={15} />
            <span>Quay lại kết quả</span>
          </button>
          <span className="text-xs bg-white/10 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
            Thanh toán an toàn bảo mật 🛡️
          </span>
        </div>

        <h2 className="text-xl font-extrabold tracking-tight">Chi Tiết Đặt Hàng & Giữ Phòng</h2>

        <div className="flex justify-center items-center gap-2 max-w-lg mx-auto pt-2" id="steps-row">
          <div className="flex items-center gap-1.5">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? "bg-[#FF5A5F] text-white" : "bg-white/20 text-blue-200"}`}>
              1
            </span>
            <span className="text-xs font-semibold text-white">Điền thông tin</span>
          </div>
          <div className="h-0.5 bg-white/20 w-16"></div>
          <div className="flex items-center gap-1.5">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? "bg-[#FF5A5F] text-white" : "bg-white/20 text-blue-200"}`}>
              2
            </span>
            <span className={`text-xs font-semibold ${step >= 2 ? "text-white" : "text-blue-200"}`}>Thanh toán ảo</span>
          </div>
          <div className="h-0.5 bg-white/20 w-16"></div>
          <div className="flex items-center gap-1.5">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 3 ? "bg-emerald-500 text-white animate-bounce" : "bg-white/20 text-blue-200"}`}>
              ✓
            </span>
            <span className={`text-xs font-semibold ${step >= 3 ? "text-white" : "text-blue-200"}`}>Xác nhận</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12" id="steps-split-panel">
        {/* Left Form Panel */}
        <div className="md:col-span-8 p-6 space-y-6">
          {step === 1 && (
            <div className="space-y-4" id="step-fields-1">
              <h3 className="font-extrabold text-gray-800 text-sm uppercase tracking-wider border-b border-gray-100 pb-2">
                Thông tin hành khách liên hệ
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-400">HỌ VÀ TÊN (TRÙNG HỘ CHIẾU/CCCD)</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-400">SỐ ĐIỆN THOẠI</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-400">EMAIL NHẬN MÃ ĐẶT CHỖ (MÃ VOUCHER)</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Number of item selector */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-sm text-gray-800">
                    Số lượng {productType === "hotel" ? "phòng đăng ký" : productType === "flight" ? "số khách bay" : "số lượng vé mua"}
                  </h4>
                  <p className="text-[11px] text-gray-400">Chọn tối đa 5 vé trong một lượt thanh toán ảo.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQty((q) => (q > 1 ? q - 1 : q))}
                    className="w-8 h-8 rounded-full border border-gray-200 bg-white flex items-center justify-center font-bold text-gray-600 hover:border-blue-500"
                  >
                    -
                  </button>
                  <span className="font-extrabold text-sm text-gray-800 text-center w-4">{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty((q) => (q < 5 ? q + 1 : q))}
                    className="w-8 h-8 rounded-full border border-gray-200 bg-white flex items-center justify-center font-bold text-gray-600 hover:border-blue-500"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Special requests for hotel */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-400 flex items-center gap-1">
                  <MessageSquarePlus size={13} />
                  <span>YÊU CẦU ĐẶC BIỆT / GHI CHÚ THÊM TRUYỀN HÌNH</span>
                </label>
                <textarea
                  value={specialRequest}
                  onChange={(e) => setSpecialRequest(e.target.value)}
                  placeholder="Ví dụ: Phòng không hút thuốc, giường đôi cỡ lớn, check-in muộn, v.v."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:border-blue-500 h-20"
                ></textarea>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-2.5 text-xs text-blue-800">
                <Clock className="text-blue-500 shrink-0" size={16} />
                <span>Giá và phòng được bảo lưu tạm thời trong vòng <strong>15 phút</strong>. Vui lòng bấm Tiếp Tục thanh toán nhanh.</span>
              </div>

              <button
                type="button"
                onClick={handleNextStep}
                className="w-full py-3.5 bg-[#FF5A5F] hover:bg-[#ff464c] text-white font-extrabold rounded-xl shadow-md text-sm transition-all text-center cursor-pointer"
              >
                Tiếp tục đi tới Thanh Toán ➜
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4" id="step-fields-2">
              <h3 className="font-extrabold text-gray-800 text-sm uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center gap-1">
                <CreditCard size={15} className="text-blue-600" />
                <span>Phương thức thanh toán ảo an toàn</span>
              </h3>

              <div className="grid grid-cols-2 gap-3" id="payment-choices">
                {[
                  { id: "momo", label: "Ví MoMo", logo: "https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png" },
                  { id: "vnpay", label: "VNPay / QR", logo: "https://vnpay.vn/wp-content/uploads/2020/07/vnpay-logo-png.png" },
                  { id: "visa", label: "Visa / Mastercard", logo: "https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png" },
                  { id: "atm", label: "Thẻ ATM Nội địa", logo: "https://vnpay.vn/wp-content/uploads/2020/07/vnpay-logo-png.png" },
                ].map((pay) => (
                  <div
                    key={pay.id}
                    onClick={() => setPaymentMethod(pay.id)}
                    className={`border rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:border-blue-500 transition-colors select-none ${
                      paymentMethod === pay.id ? "bg-blue-50/50 border-blue-500 ring-1 ring-blue-500" : "border-gray-200"
                    }`}
                  >
                    <div className="w-8 h-8 rounded bg-gray-50 flex items-center justify-center p-0.5 overflow-hidden">
                      <CreditCard size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <span className="text-xs font-extrabold block text-gray-800">{pay.label}</span>
                      <span className="text-[10px] text-gray-400 font-bold">Thanh toán tức thì</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Virtual Card Box if credit card is selected */}
              {paymentMethod === "visa" && (
                <div className="bg-gradient-to-br from-slate-800 to-slate-950 text-white rounded-xl p-4 space-y-4 shadow-lg border border-slate-700/50 animate-fade-in">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-black italic tracking-widest text-[#FF5A5F]">TRIP CARD PLATINUM</span>
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-bold">Visa</span>
                  </div>
                  <div className="py-2">
                    <span className="font-mono text-base tracking-widest">••••  ••••  ••••  1834</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-[9px] text-[#FF5A5F] font-black uppercase tracking-wider">Hành khách</div>
                      <span className="text-xs font-bold font-mono tracking-wide">{name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] text-slate-400 font-black uppercase">Tháng/Năm</div>
                      <span className="text-xs font-bold font-mono">12/28</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-100 flex gap-2.5 text-xs text-emerald-800 font-bold">
                <ShieldCheck size={18} className="text-emerald-500 shrink-0" />
                <span>Hệ thống bảo đảm Trip.com: Được hoàn vé miễn phí 100% trong vòng 24 giờ kể từ thời điểm đặt chỗ thành công.</span>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-3 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-600 cursor-pointer"
                >
                  Quay lại thông tin
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex-1 py-3 bg-[#FF5A5F] hover:bg-[#ff464c] text-white font-extrabold rounded-xl shadow-md text-sm transition-all text-center cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Hoàn tất mua Virtual Ticket ({total.toLocaleString()} ₫)</span>
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-10 space-y-5" id="step-fields-3">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md ring-4 ring-emerald-50">
                <Check size={36} className="stroke-[3]" />
              </div>

              <div className="space-y-1">
                <h3 className="font-black text-xl text-gray-800 tracking-tight">Xác Nhận Đặt Chỗ Thành Công!</h3>
                <p className="text-xs text-gray-400">Vé của bạn đã được lưu trực tuyến và gửi tới hòm thư <strong>{email}</strong>.</p>
              </div>

              {/* Dynamic ticket confirmation details */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left space-y-3.5 max-w-md mx-auto">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-[#0052FF]">MÃ ĐẶT CHỖ TRIP.COM</span>
                  <span className="font-mono font-black text-[#FF5A5F] uppercase text-sm">TRPM-{Math.floor(100000 + Math.random() * 900000)}</span>
                </div>

                <div className="border-t border-dashed border-gray-200 pt-3 space-y-2 text-xs font-semibold text-gray-600">
                  <div className="flex justify-between">
                    <span>Hành khách chính:</span>
                    <span className="text-[#2b3c4d] font-bold">{name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Lựa chọn dịch vụ:</span>
                    <span className="text-[#2b3c4d] font-bold truncate max-w-52">{product.name || `${product.departure} → ${product.arrival}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Số lượng:</span>
                    <span className="text-[#2b3c4d] font-bold">{qty} x ({productType === "hotel" ? "đêm nghỉ" : "lượt bay/tour"})</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-100 pt-2 font-bold text-[#FF5A5F]">
                    <span>Tổng tiền (đã thuế VAT):</span>
                    <span className="text-sm font-black">{total.toLocaleString()} ₫</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={onBack}
                  className="px-5 py-2.5 bg-[#0052FF] hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-xs hover:shadow-md cursor-pointer transition-all"
                >
                  Tiếp tục tìm kiếm khác
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Product Overview summary column */}
        <div className="md:col-span-4 bg-slate-50 border-l border-gray-100 p-5 space-y-4" id="order-summary-sidebar">
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-gray-200 pb-2">
            <Receipt size={14} className="text-blue-500" />
            <span>Tóm tắt đặt vé</span>
          </h4>

          {/* Mini-details block */}
          <div className="space-y-3">
            <span className="text-[10px] bg-[#FF5A5F] text-white font-extrabold uppercase px-1.5 py-0.5 rounded">
              {productType}
            </span>

            <h3 className="text-sm font-black text-[#2b3c4d] tracking-tight leading-snug">
              {product.name || `${product.departure} → ${product.arrival}`}
            </h3>

            {productType === "hotel" && (
              <div className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
                <MapPin size={11} className="text-slate-400" />
                <span className="truncate">{product.location}</span>
              </div>
            )}

            <div className="text-xs font-bold text-slate-500 space-y-0.5 pt-1">
              <div className="flex items-center gap-1 text-[#0052FF]">
                <Calendar size={12} />
                <span>Check-in: 15/06/2026</span>
              </div>
              <div className="text-slate-400 font-medium pl-4">Check-out: 18/06/2026 • 3 Đêm</div>
            </div>
          </div>

          {/* Pricing breakdowns */}
          <div className="border-t border-gray-200 pt-4 space-y-2 text-xs font-semibold text-slate-500" id="pricing-list">
            <div className="flex justify-between">
              <span>Đơn giá niêm yết:</span>
              <span className="text-gray-800 font-bold">{basePrice.toLocaleString()} ₫</span>
            </div>
            <div className="flex justify-between">
              <span>Số lượng:</span>
              <span>{qty}</span>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-2">
              <span>Tạm tính ({qty} lượt):</span>
              <span className="text-gray-800 font-bold">{(basePrice * qty).toLocaleString()} ₫</span>
            </div>

            {appliedCoupon && (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span className="flex items-center gap-1">
                  <TicketCheck size={12} /> Voucher ({appliedCoupon.code})
                </span>
                <span>-{appliedCoupon.amount.toLocaleString()} ₫</span>
              </div>
            )}

            <div className="flex justify-between text-slate-400 text-[10px]">
              <span>Phí dịch vụ & VAT (5%):</span>
              <span>{tax.toLocaleString()} ₫</span>
            </div>

            <div className="flex justify-between text-base font-black text-[#FF5A5F] border-t border-gray-200 pt-3">
              <span>Tổng thanh toán:</span>
              <span>{total.toLocaleString()} ₫</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

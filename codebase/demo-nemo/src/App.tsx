import { useState, useEffect, FormEvent } from "react";
import { Sparkles, Star, Bed, Plane, ArrowRight, ShieldCheck, Heart, Share2, CornerDownRight, MessageSquare, PlusCircle, CheckCircle, Smartphone, Award, ThumbsUp } from "lucide-react";
import Header from "./components/Header";
import SearchBox from "./components/SearchBox";
import PromoOffers from "./components/PromoOffers";
import TrendingDestinations from "./components/TrendingDestinations";
import SearchResults from "./components/SearchResults";
import BookingWizard from "./components/BookingWizard";
import MyBookings from "./components/MyBookings";
import AIAssistant from "./components/AIAssistant";
import { DESTINATIONS, REVIEWS } from "./data";
import { Booking, Destination, Review } from "./types";

export default function App() {
  // Locale / Currency States
  const [language, setLanguage] = useState<string>("vi-vn");
  const [currency, setCurrency] = useState<string>("VND");

  // Core Navigation State
  const [view, setView] = useState<"home" | "results" | "booking-wizard" | "bookings">("home");
  const [activeCategory, setActiveCategory] = useState<"hotel" | "flight" | "train" | "attraction">("hotel");

  // Search parameters
  const [searchDest, setSearchDest] = useState<string>("Đà Nẵng");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Claimed coupons
  const [claimedCoupons, setClaimedCoupons] = useState<string[]>([]);
  const [activeCoupon, setActiveCoupon] = useState<{ code: string; amount: number } | null>(null);

  // Bookings state (with 1 preset historical diamond booking)
  const [bookings, setBookings] = useState<Booking[]>([
    {
      id: "booking-demo",
      code: "TRP-2026-681944",
      type: "hotel",
      typeName: "Đêm nghỉ khách sạn",
      itemName: "Sheraton Nha Trang Hotel & Spa",
      quantity: 1,
      dateRange: "2026-05-10 - 2026-05-12",
      price: 2500000,
      customerName: "Nguyễn Văn A",
      customerEmail: "demo@homielab.com",
      customerPhone: "0912345678",
      paymentMethod: "MOMO",
      status: "Thành công",
      createdAt: "10/05/2026",
    },
  ]);

  // Review logic
  const [reviews, setReviews] = useState<Review[]>(REVIEWS);
  const [newReview, setNewReview] = useState({
    author: "Nguyễn Văn A",
    rating: 5,
    content: "",
    destination: "Nha Trang",
  });
  const [showReviewSuccess, setShowReviewSuccess] = useState(false);

  // Auto-scroll helper
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [view]);

  // Handle coupon claim
  const handleClaimCoupon = (code: string, amount: number) => {
    if (!claimedCoupons.includes(code)) {
      setClaimedCoupons((prev) => [...prev, code]);
      // Instantly make this coupon active inside checkout sessions
      setActiveCoupon({ code, amount });
    }
  };

  // Trigger search action
  const handleSearchAction = (params: any) => {
    setActiveCategory(params.category);
    setSearchDest(params.destination || "");
    setView("results");
  };

  // Handle selected product checkout click
  const handleSelectProduct = (product: any, type: string) => {
    setSelectedProduct(product);
    setView("booking-wizard");
  };

  // Callback on successful virtual booking checkout
  const handleBookingCompleted = (newBooking: Booking) => {
    setBookings((prev) => [newBooking, ...prev]);
  };

  // Cancel virtual order
  const handleCancelBooking = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: "Đã hủy" as const } : b))
    );
  };

  // Select destination cards from trending module
  const handleSelectTrendingDest = (dest: Destination) => {
    setSearchDest(dest.name);
    setView("results");
  };

  // Submitting reviews
  const handleSubmitReview = (e: FormEvent) => {
    e.preventDefault();
    if (!newReview.content.trim()) return;

    const reviewItem: Review = {
      id: Math.random().toString(),
      author: newReview.author,
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80",
      rating: newReview.rating,
      date: new Date().toISOString().split("T")[0],
      content: newReview.content,
      destination: newReview.destination,
    };

    setReviews((prev) => [reviewItem, ...prev]);
    setNewReview((prev) => ({ ...prev, content: "" }));
    setShowReviewSuccess(true);
    setTimeout(() => {
      setShowReviewSuccess(false);
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col font-sans text-slate-800" id="trip-app-root">
      {/* Header component */}
      <Header
        currentLanguage={language}
        onChangeLanguage={setLanguage}
        currentCurrency={currency}
        onChangeCurrency={setCurrency}
        onViewBookings={() => setView("bookings")}
        onViewHome={() => setView("home")}
        bookingCount={bookings.filter((b) => b.status === "Thành công").length}
      />

      {/* Main Container */}
      <main className="flex-1 pb-16">
        {/* VIEW: HOME VIEW */}
        {view === "home" && (
          <div className="space-y-8 animate-fade-in" id="view-home">
            {/* Hero Section Container */}
            <div className="relative bg-[#002663] py-14 md:py-18 px-4 md:px-8 text-white overflow-hidden" id="hero-banner">
              <div className="absolute inset-0 opacity-40 bg-gradient-to-br from-blue-400 to-indigo-900"></div>
              {/* Abstract Pattern */}
              <div className="absolute -right-20 -top-20 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-20"></div>
              <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-cyan-400 rounded-full blur-3xl opacity-10"></div>

              <div className="max-w-5xl mx-auto relative z-10 space-y-6">
                <div className="space-y-2 text-center md:text-left">
                  <span className="text-xs font-black uppercase tracking-widest text-[#FF5A5F] bg-white/10 px-3.5 py-1 rounded-full border border-white/5 inline-block">
                    Diamond VIP Travel Offers 💎
                  </span>
                  <h1 className="text-3xl md:text-4.5xl font-black tracking-tight leading-none text-white">
                    Mở Ra Cả Thế Giới • <span className="text-[#FF5A5F]">Săn Chuyến Đi Mơ Ước</span>
                  </h1>
                  <p className="text-xs sm:text-xs text-blue-100 font-bold max-w-xl opacity-90 leading-relaxed">
                    Hơn 1,2 triệu khách sạn, đường bay toàn cầu, vé tàu cao tốc và vé vui chơi giảm giá sốc nhất hè này tại Việt Nam.
                  </p>
                </div>

                {/* Core tabbed search box */}
                <SearchBox
                  onSearch={handleSearchAction}
                  initialCategory={activeCategory}
                  onTabChange={setActiveCategory}
                />
              </div>
            </div>

            {/* Inner Content Grid */}
            <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-10">
              {/* Promo Offers & Countdown timer */}
              <PromoOffers
                onClaimCoupon={handleClaimCoupon}
                claimedCoupons={claimedCoupons}
              />

              {/* Trending destinations display module */}
              <TrendingDestinations
                onSelectDestination={handleSelectTrendingDest}
                activeCategory={activeCategory}
              />

              {/* Guarantees and highlights Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4" id="why-trip-demo">
                {[
                  {
                    title: "Bảo Đảm Dịch Vụ 24/7",
                    desc: "Hỗ trợ khách hàng đa ngôn ngữ mọi cung giờ. Hoàn hủy và giải quyết khiếu nại bay tức thì nhanh chóng.",
                    icon: <ShieldCheck className="text-emerald-500 shrink-0" size={28} />,
                  },
                  {
                    title: "Thành Viên Diamond Ưu Đãi",
                    desc: "X3 điểm thưởng, miễn phí phòng chờ sân bay cao cấp toàn cầu và giảm giá thêm 20% đặt khách sạn thường niên.",
                    icon: <Award className="text-amber-500 shrink-0" size={28} />,
                  },
                  {
                    title: "Ứng Dụng Đa Tiện Ích",
                    desc: "Tra cứu lộ trình của bạn cực kỳ trực quan, bản đồ dẫn đường, vé điện tử và hỗ trợ trực tuyến không cần giấy tờ.",
                    icon: <Smartphone className="text-blue-500 shrink-0" size={28} />,
                  },
                ].map((g, i) => (
                  <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 flex gap-4 hover:shadow-md transition-shadow">
                    {g.icon}
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-sm text-gray-800 tracking-tight leading-none">{g.title}</h3>
                      <p className="text-xs text-gray-500 leading-relaxed font-semibold">{g.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Customer reviews and submission section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="customer-reviews-box">
                {/* Review Stack display */}
                <div className="lg:col-span-8 space-y-4">
                  <h3 className="text-base font-black text-gray-800 tracking-right flex items-center gap-2">
                    <MessageSquare className="text-blue-600" size={18} />
                    <span>Ý Kiến Phản Hồi Từ Khách Hàng đặt vé</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="reviews-sub-grid">
                    {reviews.slice(0, 4).map((r) => (
                      <div key={r.id} className="bg-white p-4 rounded-2xl border border-gray-100 space-y-3 shadow-xs flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] font-black text-gray-700">{r.author}</span>
                            <div className="flex items-center gap-0.5 text-amber-400">
                              {Array.from({ length: Math.round(r.rating) }).map((_, i) => (
                                <Star key={i} size={11} className="fill-amber-400 text-amber-400" />
                              ))}
                            </div>
                          </div>
                          <span className="text-[10px] text-blue-600 font-extrabold bg-blue-50 px-1.5 py-0.5 rounded">
                            Hành trình {r.destination}
                          </span>
                          <p className="text-xs text-gray-500 font-medium leading-relaxed italic">
                            "{r.content}"
                          </p>
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold border-t border-slate-50 pt-2 text-right">
                          Hài lòng • {r.date}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Review submission Form */}
                <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-gray-100 h-fit space-y-4">
                  <div className="space-y-1 border-b border-gray-100 pb-2">
                    <h4 className="font-extrabold text-sm text-gray-800 tracking-tight flex items-center gap-1.5">
                      <PlusCircle size={16} className="text-orange-500" />
                      <span>Chia sẻ trải nghiệm</span>
                    </h4>
                    <p className="text-[11px] text-gray-400">Gửi đóng góp sau chuyến đi ảo của bạn bên dưới</p>
                  </div>

                  <form onSubmit={handleSubmitReview} className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-extrabold text-slate-400">HỌ TÊN ĐĂNG Ý KIẾN</label>
                      <input
                        type="text"
                        required
                        value={newReview.author}
                        onChange={(e) => setNewReview({ ...newReview, author: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold focus:border-blue-500 focus:ring-1"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-extrabold text-slate-400">ĐIỂM ĐẾN PHẢN HỒI</label>
                      <select
                        value={newReview.destination}
                        onChange={(e) => setNewReview({ ...newReview, destination: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold focus:border-blue-500 cursor-pointer"
                      >
                        {DESTINATIONS.map((d) => (
                          <option key={d.id} value={d.name}>
                            Phản hồi về {d.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-extrabold text-slate-400">MỨC ĐỘ HÀI LÒNG</label>
                      <div className="flex gap-2">
                        {[5, 4, 3, 2, 1].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setNewReview({ ...newReview, rating: num })}
                            className={`w-7 h-7 rounded-full border text-xs font-black flex items-center justify-center transition-colors ${
                              newReview.rating === num ? "bg-amber-400 border-amber-400 text-white" : "border-gray-200 text-gray-400 hover:border-amber-300"
                            }`}
                          >
                            {num}★
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-extrabold text-slate-400">NỘI DUNG CHIA SẺ</label>
                      <textarea
                        required
                        value={newReview.content}
                        onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
                        placeholder="Hãy viết cảm nghĩ của bạn về khách sạn, thức ăn hoặc dịch vụ của hệ thống tư vấn ảo..."
                        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium focus:border-blue-500 h-20"
                      ></textarea>
                    </div>

                    {showReviewSuccess && (
                      <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-100 text-[10px] font-extrabold flex items-center gap-1.5 animate-bounce">
                        <CheckCircle size={12} className="text-emerald-500" />
                        <span>Bình luận được phát hành thành công trực tuyến!</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-lg shadow-xs cursor-pointer transition-colors"
                    >
                      Đăng đóng góp du lịch
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: SEARCH RESULTS VIEW */}
        {view === "results" && (
          <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6 space-y-6 animate-fade-in" id="view-results">
            {/* Quick navigation links back to top */}
            <div className="flex items-center justify-between text-xs font-black text-slate-400">
              <button
                onClick={() => setView("home")}
                className="flex items-center gap-1 hover:text-blue-600 cursor-pointer"
              >
                ← Quay lại trang tìm kiếm
              </button>
              <span className="text-[#FF5A5F] uppercase tracking-wider">
                Ưu đãi Diamond đã áp dụng khi đặt trực tiếp
              </span>
            </div>

            {/* Micro search selector panel to dynamically switch tabs */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4 flex gap-3 items-center justify-between overflow-x-auto">
              <div className="flex gap-2">
                {[
                  { id: "hotel", label: "Khách sạn", icon: <Bed size={15} /> },
                  { id: "flight", label: "Vé máy bay", icon: <Plane size={15} /> },
                  { id: "train", label: "Tàu hỏa", icon: <Award size={15} /> },
                  { id: "attraction", label: "Vui chơi/Tour", icon: <Sparkles size={15} /> },
                ].map((categoryItem) => (
                  <button
                    key={categoryItem.id}
                    onClick={() => setActiveCategory(categoryItem.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold cursor-pointer transition-all ${
                      activeCategory === categoryItem.id
                        ? "bg-[#0052FF] text-white"
                        : "text-gray-500 hover:bg-slate-50"
                    }`}
                  >
                    {categoryItem.icon}
                    <span>{categoryItem.label}</span>
                  </button>
                ))}
              </div>

              {/* Simple Input updates */}
              <div className="flex border border-slate-200 rounded-xl px-3 py-1 items-center gap-1 w-52 shrink-0">
                <input
                  type="text"
                  value={searchDest}
                  onChange={(e) => setSearchDest(e.target.value)}
                  placeholder="Đổi điểm đến..."
                  className="w-full text-xs font-bold text-gray-700 bg-transparent focus:outline-none"
                />
              </div>
            </div>

            {/* Results Grid List component */}
            <SearchResults
              category={activeCategory}
              destinationSearch={searchDest}
              onSelectProduct={handleSelectProduct}
              appliedCoupon={activeCoupon ? activeCoupon.code : null}
            />
          </div>
        )}

        {/* VIEW: BOOKING WIZARD */}
        {view === "booking-wizard" && selectedProduct && (
          <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6 animate-fade-in" id="view-checkout">
            <BookingWizard
              product={selectedProduct}
              productType={activeCategory}
              onBack={() => setView("results")}
              onCompleteBooking={handleBookingCompleted}
              appliedCoupon={activeCoupon}
            />
          </div>
        )}

        {/* VIEW: BOOKINGS DASHBOARD */}
        {view === "bookings" && (
          <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8 animate-fade-in" id="view-dashboard">
            <MyBookings
              bookings={bookings}
              onCancelBooking={handleCancelBooking}
              onBackToHome={() => setView("home")}
            />
          </div>
        )}
      </main>

      {/* AI Assistant float component */}
      <AIAssistant 
        onTriggerSearch={(category, destination) => {
          setActiveCategory(category);
          setSearchDest(destination);
          setView("results");
        }}
        onUpdateSearchDest={(destination) => {
          setSearchDest(destination);
        }}
      />

      {/* Simple Localized Footer */}
      <footer className="w-full bg-slate-900 text-slate-400 text-xs py-8 border-t border-slate-800" id="trip-footer">
        <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-white font-black text-xl tracking-tighter">
              Trip<span className="text-[#FF5A5F]">.demo</span>
            </div>
            <p className="text-[10px] leading-relaxed text-slate-500 font-semibold">
              Bản quyền sở hữu thuộc về Trip.demo Clone, mô phỏng tối ưu hóa UI/UX dành cho mục đích cá nhân học tập và phát triển ứng dụng di động an toàn.
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-2">Liên hệ & Hỗ trợ</h4>
            <ul className="space-y-1 font-semibold text-[11px] text-slate-400">
              <li>Hotline ảo: 1900 2026</li>
              <li>Email: support@trip.demo</li>
              <li>Trung tâm trợ giúp trực tuyến</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-2">Điều khoản pháp lý</h4>
            <ul className="space-y-1 font-semibold text-[11px] text-slate-400">
              <li>Chính sách bảo mật dữ liệu</li>
              <li>Quyền lợi thành viên Diamond</li>
              <li>Điều khoản hoàn hủy vé nội địa</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="text-white font-bold">Thành viên Diamond VIP</h4>
            <p className="text-[10px] text-slate-500 font-semibold">
              Được bảo lưu quyền lợi Diamond nâng cấp phòng chờ thương phẩm, xe đưa đón tận hồ bơi.
            </p>
            <div className="flex items-center gap-1 text-amber-500 font-black">
              <Star size={12} className="fill-amber-500" />
              <span>Đại sứ Thương Hiệu Việt Nam 2026</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { useState } from "react";
import { Globe, DollarSign, User, Briefcase, ChevronDown, Bell, LogIn, Award } from "lucide-react";

interface HeaderProps {
  currentLanguage: string;
  onChangeLanguage: (lang: string) => void;
  currentCurrency: string;
  onChangeCurrency: (curr: string) => void;
  onViewBookings: () => void;
  onViewHome: () => void;
  bookingCount: number;
}

export default function Header({
  currentLanguage,
  onChangeLanguage,
  currentCurrency,
  onChangeCurrency,
  onViewBookings,
  onViewHome,
  bookingCount,
}: HeaderProps) {
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showCurrMenu, setShowCurrMenu] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true); // Default log in state for beautiful customized look
  const userEmail = "demo@homielab.com"; // Customized from metadata

  const languages = [
    { code: "vi-VN", label: "Tiếng Việt (VN)" },
    { code: "en-US", label: "English (US)" },
  ];

  const currencies = [
    { code: "VND", symbol: "₫", name: "Đồng Việt Nam" },
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  ];

  return (
    <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm" id="trip-header">
      {/* Top bar */}
      <div className="bg-[#F5F7FA] text-xs text-slate-500 py-1.5 px-4 md:px-8 border-b border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="hover:text-[#0052FF] cursor-pointer hidden sm:inline font-medium">Khuyến mãi & Tin tức</span>
          <span className="hover:text-[#0052FF] cursor-pointer hidden md:inline font-medium">Tải ứng dụng di động</span>
          <span className="text-[#FF5A5F] font-bold animate-pulse">🔥 Săn Siêu Deal Du Lịch Hè 2026</span>
        </div>
        <div className="flex items-center gap-4">
          {/* Support */}
          <span className="hover:text-[#0052FF] cursor-pointer flex items-center gap-1 font-medium">
            Hỗ trợ khách hàng
          </span>

          {/* Language selector */}
          <div className="relative">
            <button
              onClick={() => {
                setShowLangMenu(!showLangMenu);
                setShowCurrMenu(false);
              }}
              className="flex items-center gap-1 cursor-pointer hover:text-[#0052FF] font-medium"
            >
              <Globe size={13} />
              <span>{currentLanguage === "vi-VN" ? "Tiếng Việt" : "English"}</span>
              <ChevronDown size={10} />
            </button>
            {showLangMenu && (
              <div className="absolute right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl py-1 w-40 z-50">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      onChangeLanguage(lang.code);
                      setShowLangMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 flex justify-between items-center ${
                      currentLanguage === lang.code ? "text-[#0052FF] font-semibold" : ""
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Currency selector */}
          <div className="relative">
            <button
              onClick={() => {
                setShowCurrMenu(!showCurrMenu);
                setShowLangMenu(false);
              }}
              className="flex items-center gap-0.5 cursor-pointer hover:text-[#0052FF] font-medium"
            >
              <DollarSign size={13} />
              <span>{currentCurrency}</span>
              <ChevronDown size={10} />
            </button>
            {showCurrMenu && (
              <div className="absolute right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl py-1 w-48 z-50">
                {currencies.map((curr) => (
                  <button
                    key={curr.code}
                    onClick={() => {
                      onChangeCurrency(curr.code);
                      setShowCurrMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 flex justify-between items-center ${
                      currentCurrency === curr.code ? "text-[#0052FF] font-semibold" : ""
                    }`}
                  >
                    <span>{curr.name} ({curr.symbol})</span>
                    <span className="text-slate-400">{curr.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3.5 flex justify-between items-center">
        {/* Logo and search links */}
        <div className="flex items-center gap-6">
          <div onClick={onViewHome} className="flex items-center cursor-pointer select-none">
            <div className="text-2xl font-black text-[#0052FF] tracking-tighter">
              Trip<span className="text-[#FF5A5F]">.demo</span>
            </div>
            <span className="text-slate-500 font-bold text-xs ml-2.5 bg-[#F5F7FA] px-2 py-0.5 rounded border border-slate-200">
              Việt Nam
            </span>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={onViewBookings}
            className="flex items-center gap-1.5 px-3 py-1.8 text-xs font-bold text-slate-700 hover:text-[#0052FF] hover:bg-[#F5F7FA] rounded-lg transition-colors cursor-pointer relative"
          >
            <Briefcase size={16} className="text-[#0052FF]" />
            <span className="hidden sm:inline">Chuyến đi của tôi</span>
            {bookingCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#FF5A5F] text-white font-bold text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center scale-90">
                {bookingCount}
              </span>
            )}
          </button>

          {/* User section */}
          {isLoggedIn ? (
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3 sm:pl-4">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-[11px] text-[#0052FF] font-bold flex items-center gap-1">
                  <Award size={12} className="text-amber-500" /> Thành viên Diamond
                </span>
                <span className="text-[11px] text-slate-500 font-bold truncate max-w-28">{userEmail}</span>
              </div>
              <div className="h-9 w-9 bg-gradient-to-tr from-[#0052FF] to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-blue-100 hover:scale-105 cursor-pointer transition-transform duration-200">
                M
              </div>
              <button
                onClick={() => setIsLoggedIn(false)}
                className="text-xs text-slate-400 hover:text-red-500 hover:underline font-bold cursor-pointer"
              >
                Thoát
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsLoggedIn(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#0052FF] hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow-md cursor-pointer transition-all duration-200"
            >
              <LogIn size={15} />
              <span>Đăng nhập</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

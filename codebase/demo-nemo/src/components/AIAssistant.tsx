import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Bot, User, Brain, X, Maximize2, Minimize2, Calendar, Users, Plane, Train, ArrowRight, Check, AlertTriangle, ChevronRight, HelpCircle, DollarSign, Clock } from "lucide-react";
import Markdown from "react-markdown";
import {
  compareTrips,
  createChatSession,
  loginDemoUser,
  postChatMessage,
  searchTrips,
  type BackendAssistantResponse,
  type BackendSearchResultSet,
  type BackendTripOption,
  type BackendTripState,
} from "../lib/backend";

export interface SearchSlots {
  departure: string | null;
  destination: string | null;
  travelDate: string | null;
  transportType: "flight" | "train" | null;
  passengerCount: number | null;
}

export interface RouteOption {
  id: string;
  code: string;
  provider: string; // "Vietnam Airlines", "SE1 (Thống Nhất)", etc
  time: string; // e.g. "08:00 - 10:15"
  price: number;
  duration: string;
  note?: string;
  type: "flight" | "train";
}

interface RouteDeckData {
  flights: RouteOption[];
  trains: RouteOption[];
  recommendation: string;
  savingCost: string;
  savingTime: string;
}

export function getRouteComparison(dep: string, dest: string): RouteDeckData {
  const d = (dep || "").trim();
  const a = (dest || "").trim();
  
  let flights: RouteOption[] = [];
  let trains: RouteOption[] = [];
  let recommendation = "";
  let savingCost = "0%";
  let savingTime = "0h";

  const normKey = `${d}->${a}`.toLowerCase()
    .replace(/tp\.hcm|tp\. hồ chí minh|sài gòn/g, "sg")
    .replace(/hà nội/g, "hn")
    .replace(/đà nẵng/g, "dn")
    .replace(/nha trang/g, "nt")
    .replace(/phú quốc/g, "pq")
    .replace(/đà lạt/g, "dl")
    .replace(/sa pa/g, "sp");

  if (normKey.includes("hn->pq") || normKey.includes("pq->hn")) {
    flights = [
      { id: "f-1", code: "VN-121", provider: "Vietnam Airlines", time: "07:00 - 09:10", price: 1850000, duration: "2h 10m", type: "flight", note: "Dịch vụ chuẩn mực 4 sao" },
      { id: "f-2", code: "VJ-453", provider: "VietJet Air", time: "11:20 - 13:30", price: 1250000, duration: "2h 10m", type: "flight", note: "Giá ưu đãi, bay thẳng" }
    ];
    trains = [
      { id: "t-1", code: "SE3 + Phà", provider: "Đường sắt + Tàu cao tốc", time: "19:25 - 14:00 (+1đ)", price: 980000, duration: "18h 35m", type: "train", note: "Chuyển tiếp tại Rạch Giá" }
    ];
    recommendation = "Nên chọn Máy bay! Di chuyển bằng đường bay thẳng giúp tiết kiệm hơn 16 tiếng rưỡi mệt mỏi.";
    savingCost = "21%";
    savingTime = "16h 25m";
  } else if (normKey.includes("sg->pq") || normKey.includes("pq->sg")) {
    flights = [
      { id: "f-3", code: "VN-129", provider: "Vietnam Airlines", time: "14:10 - 15:10", price: 1350000, duration: "1h 00m", type: "flight", note: "Bao gồm 20kg ký gửi" },
      { id: "f-4", code: "VJ-321", provider: "VietJet Air", time: "09:15 - 10:15", price: 850000, duration: "1h 00m", type: "flight", note: "Vé tiết kiệm Eco" }
    ];
    trains = [
      { id: "t-2", code: "Limousine+Phà", provider: "Xe Limousine + Phà Superdong", time: "22:00 - 06:30 (+1đ)", price: 450000, duration: "8h 30m", type: "train", note: "Thích hợp đi đêm thong thả" }
    ];
    recommendation = "Xe khách kết hợp phà biển giúp tiết kiệm 47% chi phí vé cho cả gia đình, đổi lại máy bay chỉ mất đúng 1 giờ bay.";
    savingCost = "47%";
    savingTime = "7h 30m";
  } else if (normKey.includes("hn->dn") || normKey.includes("dn->hn")) {
    flights = [
      { id: "f-5", code: "QH-152", provider: "Bamboo Airways", time: "07:30 - 08:50", price: 1100000, duration: "1h 20m", type: "flight", note: "Giờ khởi hành đẹp sáng" },
      { id: "f-6", code: "VN-511", provider: "Vietnam Airlines", time: "19:20 - 20:45", price: 1250000, duration: "1h 25m", type: "flight", note: "Tặng suất ăn nhẹ" }
    ];
    trains = [
      { id: "t-3", code: "SE1 (Thống Nhất)", provider: "Đường Sắt Việt Nam", time: "22:15 - 14:00 (+1đ)", price: 850000, duration: "15h 45m", type: "train", note: "Khoang 4 giường nằm êm ái" }
    ];
    recommendation = "Hàng không tiết kiệm 14 tiếng di chuyển và chênh lệch giá chỉ khoảng 250,000 đ. Tuy nhiên, tàu hỏa vượt đèo Hải Vân ngắm cảnh rất đẹp!";
    savingCost = "22%";
    savingTime = "14h 25m";
  } else if (normKey.includes("sg->nt") || normKey.includes("nt->sg")) {
    flights = [
      { id: "f-7", code: "VU-741", provider: "Vietravel Airlines", time: "16:45 - 17:55", price: 850000, duration: "1h 10m", type: "flight", note: "Bay tầm chiều ngắm mây" },
      { id: "f-8", code: "VN-322", provider: "Vietnam Airlines", time: "06:10 - 07:20", price: 1300000, duration: "1h 10m", type: "flight", note: "Premium Economy cải tiến" }
    ];
    trains = [
      { id: "t-4", code: "SNT2 (Du Lịch)", provider: "Đường Sắt Sài Gòn", time: "20:30 - 05:30 (+1đ)", price: 480000, duration: "9h 00m", type: "train", note: "Tàu đêm 5 sao cao cấp mượt" }
    ];
    recommendation = "Vé tàu đêm SNT2 5-sao là lựa chọn lý tưởng! Giá rẻ bằng nửa máy bay, ngủ một giấc sáng sớm là tới thẳng trung tâm thành phố Nha Trang.";
    savingCost = "43%";
    savingTime = "7h 50m";
  } else if (normKey.includes("hn->sg") || normKey.includes("sg->hn")) {
    flights = [
      { id: "f-9", code: "VN-213", provider: "Vietnam Airlines", time: "08:00 - 10:15", price: 1650000, duration: "2h 15m", type: "flight", note: "Đường bay vàng di sản" },
      { id: "f-10", code: "VJ-302", provider: "VietJet Air", time: "11:35 - 13:50", price: 950000, duration: "2h 15m", type: "flight", note: "Tối ưu chi phí bình dân" }
    ];
    trains = [
      { id: "t-5", code: "SE5 (Thống Nhất)", provider: "Đường Sắt Việt Nam", time: "08:50 - 17:00 (+1đ)", price: 1450000, duration: "32h 10m", type: "train", note: "Khoang VIP điều hoà thế hệ mới" }
    ];
    recommendation = "Vé máy bay tối ưu tuyệt đối về cả chi phí lẫn quỹ thời gian (chỉ mất 2h15m so với 32h đi tàu ròng rã).";
    savingCost = "Không tiết kiệm (đi tàu giá tương đương máy bay)";
    savingTime = "29h 55m";
  } else {
    // Generics routes
    flights = [
      { id: "f-gen-1", code: "VN-GEN", provider: "Vietnam Airlines", time: "08:30 - 10:00", price: 1250000, duration: "1h 30m", type: "flight", note: "Dịch vụ bay đầy đủ" },
      { id: "f-gen-2", code: "VJ-GEN", provider: "VietJet Air", time: "13:10 - 14:40", price: 890000, duration: "1h 30m", type: "flight", note: "Giá rẻ tiết kiệm" }
    ];
    trains = [
      { id: "t-gen-1", code: "SE-GEN", provider: "Đường Sắt Quốc Gia VN", time: "21:00 - 09:30 (+1đ)", price: 550000, duration: "12h 30m", type: "train", note: "Giường nằm khoang 4 điều hòa" }
    ];
    recommendation = "Hãy đối chiếu ưu nhược điểm giữa thời gian di chuyển (máy bay) với chi phí & trải nghiệm ngắm cảnh thiên nhiên thanh bình dọc miền Tổ quốc (tàu hỏa).";
    savingCost = "38%";
    savingTime = "11h 00m";
  }

  return { flights, trains, recommendation, savingCost, savingTime };
}

export interface ChatMessage {
  sender: "user" | "bot";
  text: string;
  isUnsafe?: boolean;
  searchWidget?: {
    slots: SearchSlots;
    isComplete?: boolean;
    routeData?: RouteDeckData;
    activeTab?: "compare" | "flights" | "trains";
    selectedTripId?: string;
    bookingStep?: "select" | "passenger_info" | "success";
    bookingId?: string;
    passengers?: string[];
    contactPhone?: string;
    contactEmail?: string;
    selectedTripDetails?: RouteOption;
    error?: string;
  };
}

interface AIAssistantProps {
  onTriggerSearch?: (category: "flight" | "train" | "hotel" | "attraction", destination: string) => void;
  onUpdateSearchDest?: (dest: string) => void;
}

function formatSavingsCost(value: number | null): string {
  if (!value) {
    return "0đ";
  }
  return `${value.toLocaleString("vi-VN")}đ`;
}

function formatSavingsTime(minutes: number | null): string {
  if (!minutes) {
    return "0h";
  }
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

function mapTripOption(option: BackendTripOption): RouteOption {
  return {
    id: option.id,
    code: option.code,
    provider: option.provider,
    time: `${option.departure_time} - ${option.arrival_time}`,
    price: option.one_way_price_vnd || option.total_price_vnd || 0,
    duration: option.duration_label,
    note: option.recommendation_reason || option.reason,
    type: option.transport_mode,
  };
}

function flattenTrips(group: { default: BackendTripOption[]; see_more: BackendTripOption[] }): RouteOption[] {
  return [...group.default, ...group.see_more].map(mapTripOption);
}

function mapStateToSlots(state: BackendTripState | null, fallback: SearchSlots): SearchSlots {
  if (!state) {
    return fallback;
  }

  const routeChanged = Boolean(
    (state.slots.departure && fallback.departure && state.slots.departure !== fallback.departure) ||
      (state.slots.destination && fallback.destination && state.slots.destination !== fallback.destination)
  );

  if (routeChanged) {
    return {
      departure: state.slots.departure,
      destination: state.slots.destination,
      travelDate: state.slots.date,
      transportType: state.slots.transport,
      passengerCount: state.slots.passengers ?? 1,
    };
  }

  return {
    departure: state.slots.departure ?? fallback.departure,
    destination: state.slots.destination ?? fallback.destination,
    travelDate: state.slots.date ?? fallback.travelDate,
    transportType: state.slots.transport ?? fallback.transportType,
    passengerCount: state.slots.passengers ?? fallback.passengerCount ?? 1,
  };
}

export default function AIAssistant({ onTriggerSearch, onUpdateSearchDest }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [currentSlots, setCurrentSlots] = useState<SearchSlots>({
    departure: null,
    destination: null,
    travelDate: null,
    transportType: null,
    passengerCount: 1,
  });

  const [messages, setMessages] = useState<Array<ChatMessage>>([
    {
      sender: "bot",
      text: "Xin chào! Tôi là **Neo**, Trợ lý Du lịch AI thông minh của Trip.com Việt Nam. \n\nTôi có thể tìm kiếm tự nhiên các chuyến **bay** hoặc vé **tàu hỏa** tức thì. Bạn muốn lên lịch trình đi nghỉ dưỡng ở đâu sắp tới? Hãy thử nói: *\"Tìm vé máy bay từ Hà Nội đi Phú Quốc cuối tuần này\"* hoặc nhấp gợi ý dưới nhé! ✈️🚂",
    },
  ]);
  const [inputMsg, setInputMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string | null>(null);
  const sessionBootRef = useRef<Promise<string> | null>(null);

  const quickPrompts = [
    "Săn vé rẻ nhất từ Hà Nội đi Phú Quốc cuối tuần này",
    "Tìm chuyến đi Nha Trang từ Sài Gòn có giá vé rẻ nhất",
    "So sánh giá tìm vé tối ưu tiết kiệm nhất Hà Nội - Sài Gòn",
    "Vé rẻ nhất đi Đà Nẵng ngày mai là máy bay hay tàu hỏa",
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    void ensureSession();
  }, []);

  const loadRouteData = async (slots: SearchSlots): Promise<RouteDeckData | null> => {
    if (!slots.departure || !slots.destination || !slots.travelDate) {
      return null;
    }

    const query = {
      origin: slots.departure,
      destination: slots.destination,
      date: slots.travelDate,
      transport_mode: null,
      passengers: slots.passengerCount || 1,
      priority: "balanced",
    };

    const [searchData, compareData] = await Promise.all([
      searchTrips(query),
      compareTrips(query),
    ]);

    return {
      flights: flattenTrips(searchData.grouped_results.flight),
      trains: flattenTrips(searchData.grouped_results.train),
      recommendation: compareData.summary || searchData.recommendation.reason || searchData.message,
      savingCost: formatSavingsCost(compareData.price_delta_vnd),
      savingTime: formatSavingsTime(compareData.duration_delta_minutes),
    };
  };

  const enrichSlotsWithRouteData = async (slots: SearchSlots): Promise<{
    slots: SearchSlots;
    routeData?: RouteDeckData;
    isComplete: boolean;
  }> => {
    const routeData = await loadRouteData(slots).catch(() => null);
    return {
      slots,
      routeData: routeData || undefined,
      isComplete: !!(slots.departure && slots.destination && slots.travelDate && slots.transportType),
    };
  };

  const ensureSession = async () => {
    if (sessionIdRef.current) {
      return sessionIdRef.current;
    }
    if (sessionBootRef.current) {
      return sessionBootRef.current;
    }

    sessionBootRef.current = (async () => {
      const user = await loginDemoUser("Demo Nemo");
      const session = await createChatSession(user.id, "Neo frontend session");
      sessionIdRef.current = session.id;
      return session.id;
    })();

    try {
      return await sessionBootRef.current;
    } finally {
      sessionBootRef.current = null;
    }
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    setMessages((prev) => [...prev, { sender: "user", text: textToSend }]);
    setInputMsg("");
    setIsLoading(true);

    try {
      const sessionId = await ensureSession();
      const data = await postChatMessage(sessionId, textToSend);
      const state = data.session.current_trip_state;
      const nextSlots = mapStateToSlots(state, currentSlots);
      const widgetData =
        state?.intent === "search_trip"
          ? await enrichSlotsWithRouteData(nextSlots)
          : null;

      setCurrentSlots(nextSlots);

      if (nextSlots.destination && onUpdateSearchDest) {
        onUpdateSearchDest(nextSlots.destination);
      }

      const newMsg: ChatMessage = {
        sender: "bot",
        text: data.response.message,
        isUnsafe: state?.is_unsafe || false,
      };

      if (widgetData) {
        newMsg.searchWidget = widgetData;
      }

      setMessages((prev) => [...prev, newMsg]);
    } catch (e) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Xin lỗi, tôi gặp sự cố kết nối với hệ thống tư vấn. Bạn có thể kiểm tra internet hoặc bấm lại sau!" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateWidgetSlot = async (msgIndex: number, field: keyof SearchSlots, value: any) => {
    let updatedSlotsSnapshot: SearchSlots | null = null;

    setMessages((prev) =>
      prev.map((m, idx) => {
        if (idx === msgIndex && m.searchWidget) {
          const updatedSlots = { ...m.searchWidget.slots, [field]: value };
          updatedSlotsSnapshot = updatedSlots;
          const isComplete = !!(
            updatedSlots.departure &&
            updatedSlots.destination &&
            updatedSlots.travelDate &&
            updatedSlots.transportType
          );

          // Update active global context slots
          setCurrentSlots(updatedSlots);

          if (updatedSlots.destination && onUpdateSearchDest) {
            onUpdateSearchDest(updatedSlots.destination);
          }

          return {
            ...m,
            searchWidget: {
              ...m.searchWidget,
              slots: updatedSlots,
              isComplete,
              routeData: undefined,
            },
          };
        }
        return m;
      })
    );

    if (!updatedSlotsSnapshot) {
      return;
    }

    try {
      const routeData = await loadRouteData(updatedSlotsSnapshot);
      setMessages((prev) =>
        prev.map((m, idx) => {
          if (idx === msgIndex && m.searchWidget) {
            const selectedTripStillExists = routeData
              ? [...routeData.flights, ...routeData.trains].some(
                  (trip) => trip.id === m.searchWidget?.selectedTripId
                )
              : false;

            return {
              ...m,
              searchWidget: {
                ...m.searchWidget,
                routeData: routeData || undefined,
                selectedTripId: selectedTripStillExists ? m.searchWidget.selectedTripId : undefined,
                selectedTripDetails: selectedTripStillExists ? m.searchWidget.selectedTripDetails : undefined,
              },
            };
          }
          return m;
        })
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handleExecuteSearch = (slots: SearchSlots) => {
    if (!slots.transportType || !slots.destination) return;
    if (onTriggerSearch) {
      onTriggerSearch(slots.transportType, slots.destination);
    }
  };

  const handleUpdateBookingField = (msgIndex: number, field: string, value: any) => {
    setMessages((prev) =>
      prev.map((m, idx) => {
        if (idx === msgIndex && m.searchWidget) {
          return {
            ...m,
            searchWidget: {
              ...m.searchWidget,
              [field]: value,
              error: undefined, // Clear errors on typing
            },
          };
        }
        return m;
      })
    );
  };

  const handleUpdatePassengerName = (msgIndex: number, passIndex: number, name: string) => {
    setMessages((prev) =>
      prev.map((m, idx) => {
        if (idx === msgIndex && m.searchWidget) {
          const currentPass = [...(m.searchWidget.passengers || [])];
          currentPass[passIndex] = name;
          return {
            ...m,
            searchWidget: {
              ...m.searchWidget,
              passengers: currentPass,
              error: undefined, // Clear errors on typing
            },
          };
        }
        return m;
      })
    );
  };

  const handleCreateBooking = (msgIndex: number) => {
    setMessages((prev) =>
      prev.map((m, idx) => {
        if (idx === msgIndex && m.searchWidget) {
          const slots = m.searchWidget.slots;
          const pax = slots.passengerCount || 1;
          const passengers = m.searchWidget.passengers || [];
          
          let missingFieldName = "";
          for (let i = 0; i < pax; i++) {
            if (!passengers[i] || !passengers[i].trim()) {
              missingFieldName = `Họ tên hành khách thứ ${i + 1}`;
              break;
            }
          }
          if (!missingFieldName && (!m.searchWidget.contactPhone || !m.searchWidget.contactPhone.trim())) {
            missingFieldName = "Số điện thoại liên hệ";
          }
          if (!missingFieldName && (!m.searchWidget.contactEmail || !m.searchWidget.contactEmail.trim())) {
            missingFieldName = "Email nhận vé điện tử";
          }

          if (missingFieldName) {
            return {
              ...m,
              searchWidget: {
                ...m.searchWidget,
                error: `Vui lòng điền thông tin: ${missingFieldName}!`,
              },
            };
          }

          const bId = "BK-" + Math.floor(100000 + Math.random() * 900000);
          return {
            ...m,
            searchWidget: {
              ...m.searchWidget,
              bookingId: bId,
              bookingStep: "success",
              error: undefined,
            },
          };
        }
        return m;
      })
    );
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-tr from-[#0052FF] to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-4 rounded-full shadow-2xl flex items-center justify-center gap-2 hover:scale-105 transition-all duration-300 ring-4 ring-blue-100/50 cursor-pointer"
        id="ai-assistant-toggle"
      >
        <Sparkles className="animate-pulse" size={20} />
        <span className="text-xs font-black uppercase tracking-wider hidden sm:inline pl-0.5">Tư vấn AI Neo</span>
      </button>

      {/* Floating Chat Panel */}
      {isOpen && (
        <div
          className={`fixed transition-all duration-300 z-50 flex flex-col bg-white border border-slate-200 shadow-2xl overflow-hidden animate-fade-in ${
            isFullScreen
              ? "inset-0 md:inset-6 rounded-none md:rounded-3xl w-full h-full md:w-auto md:h-auto max-w-none"
              : "fixed bottom-22 right-6 w-100 max-w-[calc(100vw-2rem)] h-[550px] rounded-3xl"
          }`}
          id="ai-chat-window"
        >
          {/* Header */}
          <div className="bg-[#002663] p-4 text-white flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                <Bot size={20} className="text-[#FF5A5F]" />
              </div>
              <div>
                <h3 className="text-sm font-black tracking-tight flex items-center gap-1.5">
                  <span>Trợ Lý Vé Du Lịch Neo</span>
                  <span className="text-[9px] bg-[#FF5A5F] text-white px-1 py-0.5 rounded font-black animate-pulse">VE-AI</span>
                </h3>
                <p className="text-[10px] text-blue-100 font-semibold leading-none mt-0.5">Đặt vé tàu & bay tự động qua chat</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/85 hover:text-white cursor-pointer transition-colors"
                title={isFullScreen ? "Thu nhỏ cửa sổ" : "Phóng to toàn màn hình"}
              >
                {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/85 hover:text-white cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#F8FAFC]">
            <div className={`space-y-4 ${isFullScreen ? "max-w-3xl mx-auto w-full py-4 text-sm" : ""}`}>
              {messages.map((msg, index) => (
                <div key={index} className="space-y-2">
                  <div className={`flex gap-3 max-w-[85%] ${msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 select-none ${msg.sender === "user" ? "bg-blue-100 text-[#0052FF]" : "bg-rose-50 text-[#FF5A5F]"}`}>
                      {msg.sender === "user" ? <User size={14} /> : <Bot size={14} />}
                    </div>

                    <div
                      className={`rounded-2xl px-4 py-3 leading-relaxed shadow-xs ${
                        msg.sender === "user"
                          ? "bg-[#0052FF] text-white rounded-tr-none text-xs font-semibold"
                          : "bg-white text-slate-700 border border-slate-100 rounded-tl-none text-xs font-medium"
                      }`}
                    >
                      <div className="markdown-body">
                        <Markdown
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed font-semibold">{children}</p>,
                            strong: ({ children }) => {
                              if (msg.sender === "user") {
                                return <strong className="font-extrabold text-white underline decoration-wavy decoration-1">{children}</strong>;
                              }
                              return <strong className="font-extrabold text-[#0052FF]">{children}</strong>;
                            },
                            h1: ({ children }) => <h1 className="text-sm font-black text-[#002663] mt-3 mb-1.5">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-xs font-black text-[#002663] mt-2.5 mb-1">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-xs font-bold text-[#002663] mt-2 mb-1">{children}</h3>,
                            ul: ({ children }) => <ul className="list-disc pl-4 space-y-1.5 my-2 font-semibold">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1.5 my-2 font-semibold">{children}</ol>,
                            li: ({ children }) => <li className="text-xs">{children}</li>,
                          }}
                        >
                          {msg.text}
                        </Markdown>
                      </div>

                      {/* Safeguard prompt injection or dangerous refusal box representation */}
                      {msg.isUnsafe && (
                        <div className="mt-2.5 p-2 bg-rose-50 border border-rose-100 rounded-lg text-[9px] text-[#FF5A5F] font-bold flex items-center gap-1.5 animate-pulse">
                          <AlertTriangle size={11} className="shrink-0 text-[#FF5A5F]" />
                          <span>[AN NINH HỆ THỐNG] Đã chặn phản hồi do chứa nội dung không an toàn!</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dynamic editable itinerary widget search block */}
                  {msg.sender === "bot" && msg.searchWidget && (() => {
                    const step = msg.searchWidget.bookingStep || "select";
                    const pax = msg.searchWidget.slots.passengerCount || 1;

                    if (step === "success") {
                      return (
                        <div className="ml-11 max-w-[80%] bg-white rounded-3xl border border-emerald-100 shadow-lg p-0 overflow-hidden text-[11px] animate-fade-in select-none text-slate-705">
                          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-4 text-white text-center space-y-1.5 relative">
                            {/* Decorative airplane/train vector */}
                            <div className="absolute right-3 top-3 opacity-15 rotate-12">
                              {msg.searchWidget.slots.transportType === "train" ? <Train size={48} /> : <Plane size={48} />}
                            </div>
                            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center mx-auto shadow-xs">
                              <Check size={18} strokeWidth={3} className="text-white" />
                            </div>
                            <h4 className="text-xs font-black uppercase tracking-wider">Đặt Vé Thành Công!</h4>
                            <p className="text-[9px] text-emerald-100 font-medium font-sans">Đã xuất mã giữ chỗ điện tử thành công</p>
                          </div>

                          <div className="p-4 space-y-3.5 text-slate-700 bg-white font-sans">
                            <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                              <span className="font-extrabold text-[9px] text-slate-400 uppercase">MÃ ĐẶT CHỖ (PNR)</span>
                              <span className="font-mono font-black text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-[11px] tracking-widest">{msg.searchWidget.bookingId}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-x-2 gap-y-3 border-b border-slate-100 pb-3">
                              <div>
                                <span className="text-[8px] font-black text-slate-400 uppercase block">Ga Khởi hành</span>
                                <strong className="text-slate-800 text-xs">{msg.searchWidget.slots.departure}</strong>
                              </div>
                              <div className="text-right">
                                <span className="text-[8px] font-black text-slate-400 uppercase block">Ga Điểm đến</span>
                                <strong className="text-slate-800 text-xs">{msg.searchWidget.slots.destination}</strong>
                              </div>
                              <div>
                                <span className="text-[8px] font-black text-slate-400 uppercase block">Ngày khởi hành</span>
                                <strong className="text-slate-800 font-sans text-[11px]">{msg.searchWidget.slots.travelDate}</strong>
                              </div>
                              <div className="text-right">
                                <span className="text-[8px] font-black text-slate-400 uppercase block">Chuyến & Hãng</span>
                                <strong className="text-[#0052FF] font-black uppercase text-[10px]">
                                  {msg.searchWidget.selectedTripDetails?.provider || "Vietnam Airlines"} ({msg.searchWidget.selectedTripDetails?.code || "VN-121"})
                                </strong>
                              </div>
                            </div>

                            <div className="space-y-1.5 border-b border-slate-100 pb-3">
                              <span className="text-[8px] font-black text-slate-400 uppercase block">Danh sách Hành khách ({pax} người)</span>
                              <div className="space-y-1">
                                {(msg.searchWidget.passengers || []).slice(0, pax).map((name, i) => (
                                  <div key={i} className="font-extrabold text-slate-800 flex items-center gap-1.5 text-[10px]">
                                    <span className="text-[8px] w-3.5 h-3.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-black">{i + 1}</span>
                                    <span className="uppercase font-mono font-sans">{name}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 border-b border-slate-100 pb-3 text-[9px]">
                              <div>
                                <span className="text-[8px] font-black text-slate-400 uppercase block">SĐT Liên hệ</span>
                                <strong className="text-slate-700 font-mono font-sans">{msg.searchWidget.contactPhone}</strong>
                              </div>
                              <div className="text-right">
                                <span className="text-[8px] font-black text-slate-400 uppercase block">Email gửi vé</span>
                                <strong className="text-slate-700 font-mono truncate block max-w-[130px] ml-auto font-sans">{msg.searchWidget.contactEmail}</strong>
                              </div>
                            </div>

                            <div className="flex justify-between items-center pt-1 font-black">
                              <span className="text-slate-500 uppercase text-[9px]">Tổng thanh toán</span>
                              <span className="text-emerald-600 text-xs text-right font-sans">
                                {((msg.searchWidget.selectedTripDetails?.price || 1250000) * pax).toLocaleString()} VNĐ
                              </span>
                            </div>

                            {/* Simulated QR Code check-in block */}
                            <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex items-center gap-3 font-sans">
                              <div className="w-12 h-12 bg-white border border-slate-200 rounded-lg shrink-0 flex flex-col justify-between p-1 select-none">
                                <div className="flex justify-between">
                                  <div className="w-2 h-2 bg-slate-800"></div>
                                  <div className="w-2 h-2 bg-slate-800"></div>
                                </div>
                                <div className="flex-1 flex flex-wrap gap-[1px] p-[1.5px] justify-center items-center opacity-75">
                                  {Array.from({ length: 9 }).map((_, i) => (
                                    <div key={i} className={`w-1 h-1 ${Math.random() > 0.4 ? "bg-slate-800" : "bg-transparent"}`}></div>
                                  ))}
                                </div>
                                <div className="flex justify-between">
                                  <div className="w-2 h-2 bg-slate-800"></div>
                                  <div className="w-1 h-1 bg-slate-800 self-end"></div>
                                </div>
                              </div>
                              <div>
                                <h5 className="text-[9px] text-slate-800 font-black flex items-center gap-1 uppercase">
                                  <span>XÁC THỰC MÃ VÉ ĐIỆN TỬ</span>
                                </h5>
                                <p className="text-[8px] text-slate-400 leading-normal mt-0.5">
                                  Mã QR đã được liên kết với phòng chờ ga/sân bay. Quét mã tại quầy để xuất thẻ boarding pass.
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setMessages((prev) =>
                                  prev.map((m, idx) => {
                                    if (idx === index && m.searchWidget) {
                                      return {
                                        ...m,
                                        searchWidget: {
                                          ...m.searchWidget,
                                          bookingStep: "select",
                                          selectedTripId: undefined,
                                          selectedTripDetails: undefined,
                                          passengers: [],
                                          contactPhone: "",
                                          contactEmail: "",
                                        }
                                      };
                                    }
                                    return m;
                                  })
                                );
                              }}
                              className="w-full py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-slate-800 font-extrabold rounded-xl text-[9px] text-center cursor-pointer transition-all uppercase tracking-wider font-sans"
                            >
                              Đặt chuyến khác hoặc Thay đổi
                            </button>
                          </div>
                        </div>
                      );
                    }

                    if (step === "passenger_info") {
                      return (
                        <div className="ml-11 max-w-[80%] bg-white rounded-2xl border border-blue-100 shadow-md p-4 space-y-3.5 font-semibold text-slate-800 text-[11px] animate-fade-in text-slate-700 font-sans">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-1 text-[#002663] font-black">
                              <Sparkles size={13} className="text-[#0052FF]" />
                              <span>HỒ SƠ ĐẶT VÉ TRỰC TIẾP</span>
                            </div>
                            <span className="text-[8px] px-1.5 py-0.5 rounded font-black uppercase bg-[#0052FF]/10 text-[#0052FF]">
                              HÀNH KHÁCH ({pax} NGƯỜI)
                            </span>
                          </div>

                          {/* Selected flight/train brief details card inside passenger step */}
                          {msg.searchWidget.selectedTripDetails && (
                            <div className="p-2.5 bg-slate-50 border border-slate-150 rounded-xl space-y-1">
                              <div className="flex justify-between items-center text-[10px] font-black">
                                <div className="flex items-center gap-1.5">
                                  {msg.searchWidget.slots.transportType === "train" ? <Train size={11} className="text-amber-600" /> : <Plane size={11} className="text-blue-600" />}
                                  <span className="text-slate-805 font-extrabold">{msg.searchWidget.selectedTripDetails.provider} ({msg.searchWidget.selectedTripDetails.code})</span>
                                </div>
                                <span className="text-emerald-700 font-black font-sans">{(msg.searchWidget.selectedTripDetails.price * pax).toLocaleString()}đ</span>
                              </div>
                              <div className="text-[8px] text-slate-400 font-mono flex gap-3">
                                <span>🚀 Ngày đi: {msg.searchWidget.slots.travelDate}</span>
                                <span>⏱️ Giờ đi: {msg.searchWidget.selectedTripDetails.time}</span>
                              </div>
                            </div>
                          )}

                          {/* Render dynamic passenger name fields based on pax count */}
                          <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                            {Array.from({ length: pax }).map((_, i) => (
                              <div key={i} className="space-y-1">
                                <label className="block text-[8px] font-black text-slate-400 uppercase">Họ & Tên Hành khách {i + 1} (In hoa không dấu)</label>
                                <input
                                  type="text"
                                  value={(msg.searchWidget.passengers || [])[i] || ""}
                                  onChange={(e) => handleUpdatePassengerName(index, i, e.target.value)}
                                  placeholder="NGUYEN VAN A"
                                  className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl text-xs font-bold text-slate-800 uppercase focus:outline-none focus:border-[#0052FF] focus:bg-white transition-all font-mono placeholder-slate-400"
                                />
                              </div>
                            ))}
                          </div>

                          {/* Contact information phone / email */}
                          <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-[10px]">
                            <div>
                              <label className="block text-[8px] font-black text-slate-400 uppercase">SĐT liên hệ</label>
                              <input
                                type="tel"
                                value={msg.searchWidget.contactPhone || ""}
                                onChange={(e) => handleUpdateBookingField(index, "contactPhone", e.target.value)}
                                placeholder="0912345678"
                                className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0052FF] focus:bg-white transition-all font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[8px] font-black text-slate-400 uppercase">Email nhận vé</label>
                              <input
                                type="email"
                                value={msg.searchWidget.contactEmail || ""}
                                onChange={(e) => handleUpdateBookingField(index, "contactEmail", e.target.value)}
                                placeholder="customer@mail.com"
                                className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0052FF] focus:bg-white transition-all font-mono placeholder-slate-400 font-sans"
                              />
                            </div>
                          </div>

                          {/* Error validation block */}
                          {msg.searchWidget.error && (
                            <div className="p-2 bg-rose-50 border border-rose-100 rounded-xl text-[9px] text-[#FF5A5F] font-bold flex items-center gap-1.5 animate-pulse">
                              <AlertTriangle size={12} className="shrink-0 text-[#FF5A5F]" />
                              <span>{msg.searchWidget.error}</span>
                            </div>
                          )}

                          <div className="flex gap-2 border-t border-slate-100 pt-3 text-[10px]">
                            <button
                              type="button"
                              onClick={() => handleUpdateBookingField(index, "bookingStep", "select")}
                              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold rounded-xl transition-all cursor-pointer text-center uppercase tracking-wider font-sans"
                            >
                              Quay lại
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCreateBooking(index)}
                              className="flex-1 py-2.5 bg-gradient-to-tr from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold rounded-xl transition-all cursor-pointer text-center shadow-md flex items-center justify-center gap-1 uppercase tracking-wider font-sans"
                            >
                              <Check size={12} />
                              <span>Mua vé ngay</span>
                            </button>
                          </div>
                        </div>
                      );
                    }

                    // Default Select step
                    const selectedTripDetails = msg.searchWidget.selectedTripDetails;
                    return (
                      <div className="ml-11 max-w-[80%] bg-white rounded-2xl border border-blue-100 shadow-md p-4 space-y-3 font-semibold text-slate-805 text-[11px] animate-fade-in relative text-slate-700">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2 col-span-2">
                          <div className="flex items-center gap-1 text-[#002663] font-black">
                            <Sparkles size={13} className="text-[#0052FF]" />
                            <span>HƯỚNG TÌM KIẾM CỦA NEO</span>
                          </div>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase ${msg.searchWidget.isComplete ? "bg-emerald-100 text-emerald-800" : "bg-orange-100 text-orange-850"}`}>
                            {msg.searchWidget.isComplete ? "Sẵn sàng" : "Thiếu thông tin"}
                          </span>
                        </div>

                        {/* Routes select dropdown block */}
                        <div className="grid grid-cols-2 gap-2 text-slate-805">
                          <div className="col-span-2 flex items-center justify-between gap-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                            <div className="flex-1 w-20">
                              <label className="block text-[8px] font-black text-slate-400 uppercase">Khởi hành</label>
                              <select
                                value={msg.searchWidget.slots.departure || ""}
                                onChange={(e) => handleUpdateWidgetSlot(index, "departure", e.target.value || null)}
                                className="w-full bg-transparent font-bold mt-1 focus:outline-none cursor-pointer text-xs"
                              >
                                <option value="">-- Chưa chọn --</option>
                                <option value="Hà Nội">Hà Nội (HN)</option>
                                <option value="TP.HCM">TP.HCM (Sài Gòn)</option>
                                <option value="Đà Nẵng">Đà Nẵng (DN)</option>
                                <option value="Nha Trang">Nha Trang (NT)</option>
                                <option value="Phú Quốc">Phú Quốc (PQ)</option>
                                <option value="Đà Lạt">Đà Lạt (DL)</option>
                                <option value="Sa Pa">Sa Pa (SP)</option>
                              </select>
                            </div>
                            <ArrowRight size={12} className="text-slate-300 self-end mb-1 shrink-0" />
                            <div className="flex-1 text-right w-20 font-sans">
                              <label className="block text-[8px] font-black text-slate-400 uppercase">Điểm đến</label>
                              <select
                                value={msg.searchWidget.slots.destination || ""}
                                onChange={(e) => handleUpdateWidgetSlot(index, "destination", e.target.value || null)}
                                className="w-full bg-transparent font-bold mt-1 focus:outline-none cursor-pointer text-right text-xs"
                              >
                                <option value="">-- Chưa chọn --</option>
                                <option value="Hà Nội">Hà Nội (HN)</option>
                                <option value="TP.HCM">TP.HCM (Sài Gòn)</option>
                                <option value="Đà Nẵng">Đà Nẵng (DN)</option>
                                <option value="Nha Trang">Nha Trang (NT)</option>
                                <option value="Phú Quốc">Phú Quốc (PQ)</option>
                                <option value="Đà Lạt">Đà Lạt (DL)</option>
                                <option value="Sa Pa">Sa Pa (SP)</option>
                              </select>
                            </div>
                          </div>

                          {/* Date selection field */}
                          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                            <label className="block text-[8px] font-black text-slate-400 uppercase flex items-center gap-1">
                              <Calendar size={10} />
                              <span>Ngày đi</span>
                            </label>
                            <input
                              type="date"
                              value={msg.searchWidget.slots.travelDate || ""}
                              onChange={(e) => handleUpdateWidgetSlot(index, "travelDate", e.target.value || null)}
                              className="w-full bg-transparent font-bold mt-1 focus:outline-none text-xs text-slate-700 font-sans"
                            />
                          </div>

                          {/* Transport option switcher field */}
                          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                            <label className="block text-[8px] font-black text-slate-400 uppercase flex items-center gap-1">
                              {msg.searchWidget.slots.transportType === "train" ? <Train size={10} /> : <Plane size={10} />}
                              <span>Phương tiện</span>
                            </label>
                            <select
                              value={msg.searchWidget.slots.transportType || ""}
                              onChange={(e) => handleUpdateWidgetSlot(index, "transportType", e.target.value || null)}
                              className="w-full bg-transparent font-bold mt-1 focus:outline-none text-xs cursor-pointer text-slate-700 font-sans"
                            >
                              <option value="">-- Chưa chọn --</option>
                              <option value="flight">✈️ Vé máy bay</option>
                              <option value="train">🚂 Vé tàu hỏa</option>
                            </select>
                          </div>

                          {/* Passenger switcher field */}
                          <div className="col-span-2 bg-slate-50 p-2 rounded-xl border border-slate-200 flex justify-between items-center text-slate-800">
                            <div className="flex items-center gap-1.5">
                              <Users size={11} className="text-slate-400" />
                              <span className="text-[8px] font-black text-slate-400 uppercase">Số hành khách</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleUpdateWidgetSlot(index, "passengerCount", Math.max(1, (msg.searchWidget?.slots.passengerCount || 1) - 1))}
                                className="w-5 h-5 bg-white shadow-xs hover:bg-slate-200 text-slate-700 rounded-sm flex items-center justify-center font-bold text-xs cursor-pointer select-none"
                              >
                                -
                              </button>
                              <span className="font-extrabold text-xs w-4 text-center font-sans">{msg.searchWidget.slots.passengerCount || 1}</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateWidgetSlot(index, "passengerCount", (msg.searchWidget?.slots.passengerCount || 1) + 1)}
                                className="w-5 h-5 bg-white shadow-xs hover:bg-slate-200 text-slate-700 rounded-sm flex items-center justify-center font-bold text-xs cursor-pointer select-none"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Dynamic Flight & Train Comparison Deck */}
                          {msg.searchWidget.slots.departure && msg.searchWidget.slots.destination && (() => {
                            const compData =
                              msg.searchWidget.routeData ||
                              getRouteComparison(msg.searchWidget.slots.departure, msg.searchWidget.slots.destination);
                            const activeTab = msg.searchWidget.activeTab || "compare";
                            const selectedTripId = msg.searchWidget.selectedTripId;

                            const handleSelectTrip = (type: "flight" | "train", tripId: string) => {
                              setMessages((prev) =>
                                prev.map((m, idx) => {
                                  if (idx === index && m.searchWidget) {
                                    const nextSlots = { ...m.searchWidget.slots, transportType: type };
                                    setCurrentSlots(nextSlots);
                                    
                                    const comp =
                                      m.searchWidget.routeData ||
                                      getRouteComparison(nextSlots.departure || "", nextSlots.destination || "");
                                    const matchedList = type === "flight" ? comp.flights : comp.trains;
                                    const matchedDetails = matchedList.find((t) => t.id === tripId);

                                    return {
                                      ...m,
                                      searchWidget: {
                                        ...m.searchWidget,
                                        slots: nextSlots,
                                        selectedTripId: tripId,
                                        selectedTripDetails: matchedDetails,
                                        isComplete: !!(nextSlots.departure && nextSlots.destination && nextSlots.travelDate && nextSlots.transportType),
                                      },
                                    };
                                  }
                                  return m;
                                })
                              );
                            };

                            const handleSetTab = (tab: "compare" | "flights" | "trains") => {
                              setMessages((prev) =>
                                prev.map((m, idx) => {
                                  if (idx === index && m.searchWidget) {
                                    return {
                                      ...m,
                                      searchWidget: {
                                        ...m.searchWidget,
                                        activeTab: tab,
                                      },
                                    };
                                  }
                                  return m;
                                })
                              );
                            };

                            return (
                              <div className="col-span-2 border-t border-slate-100 pt-2.5 space-y-2 select-none text-slate-800">
                                {/* Segment controls */}
                                <div className="flex bg-slate-100 p-1 rounded-xl text-[9px] font-black">
                                  <button
                                    type="button"
                                    onClick={() => handleSetTab("compare")}
                                    className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${activeTab === "compare" ? "bg-[#002663] text-white shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
                                  >
                                    <Sparkles size={11} />
                                    <span>SO SÁNH GIÁ & GIỜ</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSetTab("flights")}
                                    className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${activeTab === "flights" ? "bg-[#0052FF] text-white shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
                                  >
                                    <Plane size={11} />
                                    <span>MÁY BAY ({compData.flights.length})</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSetTab("trains")}
                                    className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${activeTab === "trains" ? "bg-amber-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
                                  >
                                    <Train size={11} />
                                    <span>TÀU HOẢ ({compData.trains.length})</span>
                                  </button>
                                </div>

                                {/* Tab Body */}
                                {activeTab === "compare" && (() => {
                                  const flightMinPrice = compData.flights.length > 0 ? Math.min(...compData.flights.map(f => f.price)) : Infinity;
                                  const trainMinPrice = compData.trains.length > 0 ? Math.min(...compData.trains.map(t => t.price)) : Infinity;
                                  const isFlightCheapest = flightMinPrice < trainMinPrice;

                                  return (
                                    <div className="p-2 border border-blue-50 rounded-xl bg-slate-50/50 space-y-2 animate-fade-in text-slate-700">
                                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                                        {/* Flight Speed card */}
                                        <div 
                                          onClick={() => handleSetTab("flights")}
                                          className={`p-2.5 rounded-lg flex flex-col justify-between border cursor-pointer hover:border-blue-400 hover:shadow-xs transition-all ${isFlightCheapest ? "bg-emerald-50/10 border-emerald-200" : "bg-blue-50/50 border-blue-100"}`}
                                        >
                                          <div>
                                            <div className="flex items-center justify-between gap-1">
                                              <div className="flex items-center gap-1.5 text-[#0052FF]">
                                                <Plane size={11} />
                                                <span className="font-extrabold uppercase">Vé Máy Bay</span>
                                              </div>
                                              {isFlightCheapest && (
                                                <span className="text-[7.5px] bg-emerald-500 text-white font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 select-none shrink-0">
                                                  <DollarSign size={8} /> RẺ NHẤT
                                                </span>
                                              )}
                                            </div>
                                            <div className="mt-1 font-black text-slate-800 text-xs">Phù hợp nhất</div>
                                            <p className="text-[9px] text-slate-500 mt-2 leading-normal flex items-center gap-1">
                                              <Clock size={10} className="text-slate-400" />
                                              <span>Thời gian: <strong className="text-[#0052FF] font-black">{compData.flights[0]?.duration || "1h30m"}</strong></span>
                                            </p>
                                            <p className="text-[9px] text-slate-500 mt-1 flex items-center gap-1">
                                              <DollarSign size={10} className="text-slate-400" />
                                              <span>Giá chỉ từ: <strong className="text-slate-700 font-extrabold">{(compData.flights[0]?.price || 1200000).toLocaleString()}đ</strong></span>
                                            </p>
                                          </div>
                                          <div className="mt-2.5 text-[8px] text-[#0052FF] font-black bg-blue-100/60 rounded px-1.5 py-0.5 inline-block text-center uppercase font-sans">
                                            Tiết kiệm {compData.savingTime} di chuyển
                                          </div>
                                        </div>

                                        {/* Train Budget card */}
                                        <div 
                                          onClick={() => handleSetTab("trains")}
                                          className={`p-2.5 rounded-lg flex flex-col justify-between border cursor-pointer hover:border-amber-400 hover:shadow-xs transition-all ${!isFlightCheapest ? "bg-emerald-50/10 border-emerald-200" : "bg-amber-50/50 border-amber-100"}`}
                                        >
                                          <div>
                                            <div className="flex items-center justify-between gap-1">
                                              <div className="flex items-center gap-1.5 text-amber-700">
                                                <Train size={11} />
                                                <span className="font-extrabold uppercase">Vé Tàu Hoả</span>
                                              </div>
                                              {!isFlightCheapest && (
                                                <span className="text-[7.5px] bg-emerald-500 text-white font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 select-none shrink-0">
                                                  <DollarSign size={8} /> RẺ NHẤT
                                                </span>
                                              )}
                                            </div>
                                            <div className="mt-1 font-black text-slate-800 text-xs text-amber-900 font-bold">Du lịch thong thả</div>
                                            <p className="text-[9px] text-slate-500 mt-2 leading-normal flex items-center gap-1">
                                              <Clock size={10} className="text-slate-400" />
                                              <span>Thời gian: <strong className="text-amber-800 font-bold">{compData.trains[0]?.duration || "12h"}</strong></span>
                                            </p>
                                            <p className="text-[9px] text-slate-500 mt-1 flex items-center gap-1">
                                              <DollarSign size={10} className="text-slate-400" />
                                              <span>Giá chỉ từ: <strong className="text-emerald-700 font-black">{(compData.trains[0]?.price || 480000).toLocaleString()}đ</strong></span>
                                            </p>
                                          </div>
                                          <div className="mt-2.5 text-[8px] text-emerald-850 font-black bg-emerald-100/85 rounded px-1.5 py-0.5 inline-block text-center uppercase font-sans">
                                            Giảm {compData.savingCost} chi phí vé
                                          </div>
                                        </div>
                                      </div>

                                      {/* Neo Advice row */}
                                      <div className="text-[9px] text-slate-500 bg-white border border-slate-100 rounded-lg p-2 leading-relaxed flex items-start gap-1.5 font-sans">
                                        <Bot size={13} className="text-[#FF5A5F] shrink-0 mt-0.5 animate-bounce" />
                                        <span>
                                          <strong>Gợi ý từ Neo:</strong> {compData.recommendation}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })()}

                                {activeTab === "flights" && (
                                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 animate-fade-in text-slate-700 font-sans">
                                    {compData.flights.map((flight) => {
                                      const isSelected = selectedTripId === flight.id;
                                      const totalPrice = flight.price * pax;
                                      return (
                                        <div
                                          key={flight.id}
                                          onClick={() => handleSelectTrip("flight", flight.id)}
                                          className={`p-2 rounded-xl border transition-all cursor-pointer text-[10px] space-y-1.5 ${
                                            isSelected
                                              ? "bg-blue-50/80 border-[#0052FF] ring-1 ring-[#0052FF]"
                                              : "bg-white border-slate-200 hover:border-slate-300"
                                          }`}
                                        >
                                          <div className="flex justify-between items-center font-bold font-sans">
                                            <div className="flex items-center gap-1 text-slate-800 font-extrabold">
                                              <Plane size={11} className="text-[#0052FF]" />
                                              <span className="font-extrabold">{flight.provider}</span>
                                              <span className="text-[8px] text-slate-400 bg-slate-100 px-1 rounded font-normal font-sans">{flight.code}</span>
                                            </div>
                                            <div className="text-[#0052FF] font-extrabold text-[11px] text-right">
                                              {flight.price.toLocaleString()}đ <span className="text-[8px] text-slate-400 font-normal">/vé</span>
                                            </div>
                                          </div>
                                          <div className="flex justify-between items-center text-[9px] text-slate-500 font-medium">
                                            <div>
                                              🕒 Giờ bay: <strong className="text-slate-700">{flight.time}</strong> ({flight.duration})
                                            </div>
                                            {flight.note && <div className="text-[#0052FF] bg-blue-100/50 px-1 rounded-sm text-[8px] font-bold font-sans">{flight.note}</div>}
                                          </div>
                                          
                                          {/* Total calculation indicator list */}
                                          <div className="flex justify-between items-center border-t border-dashed border-slate-100 pt-1.5 mt-1 text-[8px] font-sans">
                                            <span className="text-slate-400">Tổng cộng cho {pax} khách:</span>
                                            <span className="text-[#002663] font-black text-[10px]">
                                              {totalPrice.toLocaleString()} VNĐ
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                {activeTab === "trains" && (
                                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 animate-fade-in text-slate-700 font-sans">
                                    {compData.trains.map((train) => {
                                      const isSelected = selectedTripId === train.id;
                                      const totalPrice = train.price * pax;
                                      return (
                                        <div
                                          key={train.id}
                                          onClick={() => handleSelectTrip("train", train.id)}
                                          className={`p-2 rounded-xl border transition-all cursor-pointer text-[10px] space-y-1.5 ${
                                            isSelected
                                              ? "bg-amber-50/80 border-amber-500 ring-1 ring-amber-500"
                                              : "bg-white border-slate-200 hover:border-slate-300"
                                          }`}
                                        >
                                          <div className="flex justify-between items-center font-bold">
                                            <div className="flex items-center gap-1 text-slate-800 font-extrabold font-sans">
                                              <Train size={11} className="text-amber-600" />
                                              <span className="font-extrabold">{train.provider}</span>
                                              <span className="text-[8px] text-amber-700 bg-amber-100 px-1 rounded font-black">{train.code}</span>
                                            </div>
                                            <div className="text-emerald-700 font-extrabold text-[11px] text-right font-sans">
                                              {train.price.toLocaleString()}đ <span className="text-[8px] text-slate-400 font-normal">/vé</span>
                                            </div>
                                          </div>
                                          <div className="flex justify-between items-center text-[9px] text-slate-500 font-medium font-sans">
                                            <div>
                                              🕒 Giờ đi: <strong className="text-slate-700">{train.time}</strong> ({train.duration})
                                            </div>
                                            {train.note && <div className="text-amber-800 bg-amber-50 px-1 rounded-sm text-[8px] font-bold font-sans">{train.note}</div>}
                                          </div>

                                          {/* Total cost indicator row */}
                                          <div className="flex justify-between items-center border-t border-dashed border-slate-100 pt-1.5 mt-1 text-[8px] font-sans">
                                            <span className="text-slate-400">Tổng cộng cho {pax} khách:</span>
                                            <span className="text-emerald-950 font-black text-[10px]">
                                              {totalPrice.toLocaleString()} VNĐ
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>

                        {/* Interactive Checkout CTAs Block */}
                        <div className="pt-2 select-none border-t border-slate-100 mt-2 text-[10px] col-span-2">
                          {selectedTripDetails ? (
                            <div className="space-y-2">
                              <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between text-[11px] animate-fade-in font-sans">
                                <div className="flex items-center gap-1.5 text-emerald-900 font-extrabold">
                                  <Check size={12} className="text-emerald-600 shrink-0" />
                                  <span>Đang chọn: <strong className="text-[#0052FF]">{selectedTripDetails.provider} ({selectedTripDetails.code})</strong></span>
                                </div>
                                <span className="text-emerald-800 font-extrabold">{(selectedTripDetails.price * pax).toLocaleString()}đ</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleUpdateBookingField(index, "bookingStep", "passenger_info")}
                                className="w-full py-2.5 bg-[#0052FF] hover:bg-blue-700 text-white font-extrabold rounded-xl flex items-center justify-center gap-1.5 shadow-sm hover:shadow transition-all cursor-pointer text-xs uppercase tracking-wider font-sans"
                              >
                                <span>Điền thông tin và đặt vé ngay</span>
                                <ChevronRight size={12} />
                              </button>
                            </div>
                          ) : (
                            <div className="text-[10px] text-amber-600 font-extrabold flex items-center gap-1.5 bg-amber-50 rounded-xl p-2.5 border border-amber-100 leading-normal font-sans">
                              <AlertTriangle size={12} className="shrink-0 text-amber-500" />
                              <span>Vui lòng click chọn Chuyến bay/Tàu hỏa cụ thể ở các tab trên để xuất hồ sơ đặt vé trực tiếp!</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 max-w-[80%] mr-auto items-center animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-rose-50 text-[#FF5A5F] flex items-center justify-center text-xs">
                    <Bot size={14} />
                  </div>
                  <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none px-4 py-3 text-xs text-slate-400 font-bold flex items-center gap-2">
                    <Brain size={15} className="animate-spin text-[#FF5A5F]" />
                    <span>Neo đang lên kế hoạch & chọn ưu đãi cho bạn...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef}></div>
            </div>
          </div>

           {/* Quick recommendations suggestions prompts */}
          {messages.length <= 1 && (
            <div className="p-3 border-t border-slate-100 bg-white">
              <div className={`space-y-2 ${isFullScreen ? "max-w-3xl mx-auto w-full px-2" : ""}`}>
                <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider font-mono">Tìm nhanh cùng Neo:</div>
                <div className="flex flex-wrap gap-1.5">
                  {quickPrompts.map((p) => (
                    <button
                      key={p}
                      onClick={() => handleSendMessage(p)}
                      className="text-[10px] bg-slate-50 border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-[#0052FF] hover:border-[#0052FF] font-black px-2.5 py-1.5 rounded-full cursor-pointer transition-all duration-150"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Input formulation area */}
          <div className="p-4 bg-slate-50/50 border-t border-slate-100 shrink-0">
            <div className={`flex items-center gap-3 bg-white border border-slate-200 rounded-2xl pl-3.5 pr-2 py-2.5 shadow-sm hover:border-[#0052FF]/65 focus-within:border-[#0052FF] focus-within:ring-4 focus-within:ring-blue-100/50 transition-all ${isFullScreen ? "max-w-3xl mx-auto w-full" : ""}`}>
              <Sparkles size={14} className="text-[#0052FF] shrink-0 animate-pulse" />
              <input
                type="text"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage(inputMsg)}
                placeholder="Hỏi Neo: 'Vé máy bay từ HN đi Phú Quốc rẻ nhất cuối tuần này'..."
                className="w-full text-xs font-semibold text-slate-700 bg-transparent focus:outline-none placeholder-slate-400 font-sans"
              />
              <button
                type="button"
                onClick={() => handleSendMessage(inputMsg)}
                className="p-2 rounded-xl bg-[#0052FF] hover:bg-blue-700 text-white cursor-pointer transition-all shrink-0 hover:scale-[1.03] active:scale-95 shadow-xs flex items-center justify-center"
                id="send-chat-btn"
              >
                <Send size={13} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

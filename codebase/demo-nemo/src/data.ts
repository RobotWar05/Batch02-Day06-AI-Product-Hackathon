import { Hotel, Flight, Train, Car, Attraction, Destination, Review } from "./types";

export const DESTINATIONS: Destination[] = [
  {
    id: "phu-quoc",
    name: "Phú Quốc",
    country: "Việt Nam",
    image: "https://images.unsplash.com/photo-1583250091858-a86a09ad952b?auto=format&fit=crop&w=800&q=80",
    hotelStartingPrice: 750000,
    flightStartingPrice: 1200000,
    description: "Đảo ngọc thiên đường với những bãi cát trắng mịn, hoàng hôn lãng mạn và hải sản tươi ngon."
  },
  {
    id: "da-nang",
    name: "Đà Nẵng",
    country: "Việt Nam",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80",
    hotelStartingPrice: 600000,
    flightStartingPrice: 950000,
    description: "Thành phố đáng sống nhất Việt Nam với Cầu Vàng nổi tiếng, Ngũ Hành Sơn huyền bí và bãi biển Mỹ Khê ôm trọn thành phố."
  },
  {
    id: "nha-trang",
    name: "Nha Trang",
    country: "Việt Nam",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    hotelStartingPrice: 500000,
    flightStartingPrice: 1100000,
    description: "Vịnh biển đẹp nhất hành tinh, nổi tiếng với các hòn đảo, rạn san hô kỳ thú và vương quốc giải trí VinWonders."
  },
  {
    id: "sa-pa",
    name: "Sa Pa",
    country: "Việt Nam",
    image: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=800&q=80",
    hotelStartingPrice: 450000,
    flightStartingPrice: 1300000,
    description: "Xứ sở sương mù mờ ảo, cảnh sắc thiên nhiên hùng vĩ kỳ vĩ của mây trời ruộng bậc thang Sa Pa."
  },
  {
    id: "da-lat",
    name: "Đà Lạt",
    country: "Việt Nam",
    image: "https://images.unsplash.com/photo-1594498305001-c8eb586efae6?auto=format&fit=crop&w=800&q=80",
    hotelStartingPrice: 400000,
    flightStartingPrice: 980000,
    description: "Xứ sở ngàn hoa, đồi thông thơ mộng và không khí se lạnh ôm trọn những nét cổ kính lãng mạn châu Âu."
  },
  {
    id: "ha-noi",
    name: "Hà Nội",
    country: "Việt Nam",
    image: "https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?auto=format&fit=crop&w=800&q=80",
    hotelStartingPrice: 550000,
    flightStartingPrice: 800000,
    description: "Thủ đô thanh lịch nghìn năm văn hiến cổ kính, những ngõ nhỏ yên bình trầm mặc rêu phong."
  },
  {
    id: "ho-chi-minh",
    name: "TP. Hồ Chí Minh",
    country: "Việt Nam",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80",
    hotelStartingPrice: 650000,
    flightStartingPrice: 850000,
    description: "Thành phố mang tên Bác sôi động, nhộn nhịp, nhịp sống sầm uất thâu đêm với sự giao thoa Á - Âu độc đáo."
  }
];

export const HOTELS: Hotel[] = [
  // Phú Quốc
  {
    id: "hotel-pq-1",
    name: "Vinpearl Resort & Spa Phú Quốc",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
    location: "Bãi Dài, Gành Dầu, Phú Quốc, Kiên Giang",
    rating: 4.8,
    reviewsCount: 1420,
    price: 2450000,
    originalPrice: 3200000,
    stars: 5,
    amenities: ["Hồ bơi", "Spa", "Đưa đón sân bay", "Ăn sáng miễn phí", "Bãi biển riêng", "WiFi miễn phí", "Phòng Gym"],
    tag: "Ưu Đãi Đặc Biệt",
    description: "Mái ngói đỏ tươi mang đậm phong cách kiến trúc Đông Dương nổi bật giữa bãi cát trắng mịn của Bãi Dài hoang sơ."
  },
  {
    id: "hotel-pq-2",
    name: "Lahana Resort Phú Quốc Eco Site",
    image: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=800&q=80",
    location: "91/3 Trần Hưng Đạo, Dương Đông, Phú Quốc",
    rating: 4.6,
    reviewsCount: 890,
    price: 1150000,
    originalPrice: 1550000,
    stars: 4,
    amenities: ["Hồ bơi", "WiFi miễn phí", "Ăn sáng miễn phí", "Thân thiện môi trường", "Phòng Gym"],
    tag: "Sinh Thái",
    description: "Khách sạn lọt thỏm giữa đồi cây xanh rì, cách bãi biển vài bước chân, cho trải nghiệm thiên nhiên tuyệt đối dịu dàng."
  },
  {
    id: "hotel-pq-3",
    name: "Sunset Sanato Resort Phú Quốc",
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
    location: "Bãi Trường, Dương Tơ, Phú Quốc",
    rating: 4.5,
    reviewsCount: 1280,
    price: 1650000,
    originalPrice: 2000000,
    stars: 4,
    amenities: ["Bãi biển riêng", "Hồ bơi", "Bar bãi biển", "WiFi miễn phí", "Ăn sáng miễn phí"],
    tag: "Check-in Đẹp",
    description: "Địa điểm ngắm hoàng hôn đỉnh nhất Phú Quốc cực kỳ nổi tiếng với các mô hình nghệ thuật trên biển."
  },

  // Đà Nẵng
  {
    id: "hotel-dn-1",
    name: "InterContinental Danang Sun Peninsula Resort",
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
    location: "Bán Đảo Sơn Trà, Đà Nẵng",
    rating: 4.9,
    reviewsCount: 950,
    price: 9800000,
    originalPrice: 12000000,
    stars: 5,
    amenities: ["Bãi biển riêng", "Hồ bơi vô cực", "Nhà hàng Michelin", "Spa", "Đưa đón sân bay", "Dịch vụ quản gia"],
    tag: "Siêu Sang",
    description: "Kiệt tác thiết kế của kiến trúc sư lừng danh Bill Bensley trên bán đảo Sơn Trà hoang dã diệu kỳ."
  },
  {
    id: "hotel-dn-2",
    name: "Sala Danang Beach Hotel",
    image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80",
    location: "36-38 Lâm Hoành, Mỹ An, Ngũ Hành Sơn, Đà Nẵng",
    rating: 4.7,
    reviewsCount: 2200,
    price: 1200000,
    originalPrice: 1800000,
    stars: 4,
    amenities: ["Hồ bơi tầng thượng", "WiFi miễn phí", "Ăn sáng miễn phí", "Nhìn ra biển", "Bar tầng thượng"],
    tag: "Bán Chạy Nhất",
    description: "Vị trí tuyệt vời ngay trước bãi tắm Mỹ Khê, sở hữu hồ bơi vô cực tầng thượng ngắm mây nước tuyệt mỹ."
  },

  // Nha Trang
  {
    id: "hotel-nt-1",
    name: "Vinpearl Resort Nha Trang",
    image: "https://images.unsplash.com/photo-1455587734955-081b22074882?auto=format&fit=crop&w=800&q=80",
    location: "Đảo Hòn Tre, Vĩnh Nguyên, Nha Trang",
    rating: 4.7,
    reviewsCount: 1650,
    price: 1950000,
    originalPrice: 2600000,
    stars: 5,
    amenities: ["Bãi biển riêng", "Hồ bơi ngoài trời", "Công viên nước sân vườn", "Ăn sáng miễn phí", "WiFi miễn phí"],
    tag: "Gia Đình Thích",
    description: "Tòa lâu đài tráng lệ trên đảo Hòn Tre tách biệt với cảng biển sầm uất mang đậm kiến trúc châu Âu bán cổ điển."
  },
  {
    id: "hotel-nt-2",
    name: "Sheraton Nha Trang Hotel & Spa",
    image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80",
    location: "26-28 Trần Phú, Lộc Thọ, Nha Trang",
    rating: 4.8,
    reviewsCount: 1100,
    price: 2500000,
    originalPrice: 3100000,
    stars: 5,
    amenities: ["Hồ bơi vô cực", "Nhìn ra biển", "Spa", "Trà chiều", "WiFi miễn phí", "Phòng Hội nghị"],
    tag: "Thương Hiệu Lớn",
    description: "Tọa lạc trên con đường vàng Trần Phú sầm uất với góc nhìn bao quát toàn bộ vịnh biển Nha Trang trong lành."
  },

  // Hà Nội
  {
    id: "hotel-hn-1",
    name: "Sofitel Legend Metropole Hà Nội",
    image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
    location: "15 Ngô Quyền, Hoàn Kiếm, Hà Nội",
    rating: 4.9,
    reviewsCount: 820,
    price: 6800000,
    originalPrice: 8500000,
    stars: 5,
    amenities: ["Di sản lâu đời", "Hồ bơi nước ấm", "Nhà hàng Pháp", "Spa", "WiFi miễn phí"],
    tag: "Biểu Tượng Lịch Sử",
    description: "Khách sạn cổ kính mang nét quyến rũ vượt thời gian với bề dày lịch sử độc đáo từ thời thuộc Pháp 1901."
  },
  {
    id: "hotel-hn-2",
    name: "La Sinfonía Del Rey Hotel & Spa",
    image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80",
    location: "33-35 Hàng Dầu, Hoàn Kiếm, Hà Nội",
    rating: 4.8,
    reviewsCount: 950,
    price: 1800000,
    originalPrice: 2400000,
    stars: 4,
    amenities: ["Sky Bar", "WiFi miễn phí", "Ăn sáng miễn phí", "Sát Hồ Gươm", "Spa"],
    tag: "Khuyên Dùng",
    description: "Ốc đảo sang trọng thanh bình tọa lạc ngay con phố cổ nhộn nhịp, chỉ cách Hồ Hoàn Kiếm vài bước chân."
  }
];

export const FLIGHTS: Flight[] = [
  {
    id: "flight-1",
    code: "VN-213",
    airline: "Vietnam Airlines",
    airlineLogo: "VNA",
    departure: "Hà Nội (HAN)",
    arrival: "TP. Hồ Chí Minh (SGN)",
    departureTime: "08:00",
    arrivalTime: "10:15",
    price: 1650000,
    originalPrice: 2200000,
    duration: "2h 15m",
    stops: 0
  },
  {
    id: "flight-2",
    code: "VJ-302",
    airline: "VietJet Air",
    airlineLogo: "VJA",
    departure: "Hà Nội (HAN)",
    arrival: "TP. Hồ Chí Minh (SGN)",
    departureTime: "11:35",
    arrivalTime: "13:50",
    price: 950000,
    originalPrice: 1400000,
    duration: "2h 15m",
    stops: 0
  },
  {
    id: "flight-3",
    code: "QH-152",
    airline: "Bamboo Airways",
    airlineLogo: "BAV",
    departure: "Hà Nội (HAN)",
    arrival: "Đà Nẵng (DAD)",
    departureTime: "07:30",
    arrivalTime: "08:50",
    price: 1100000,
    originalPrice: 1600000,
    duration: "1h 20m",
    stops: 0
  },
  {
    id: "flight-4",
    code: "VN-129",
    airline: "Vietnam Airlines",
    airlineLogo: "VNA",
    departure: "TP. Hồ Chí Minh (SGN)",
    arrival: "Phú Quốc (PQC)",
    departureTime: "14:10",
    arrivalTime: "15:10",
    price: 1350000,
    originalPrice: 1900000,
    duration: "1h 00m",
    stops: 0
  },
  {
    id: "flight-5",
    code: "VU-741",
    airline: "Vietravel Airlines",
    airlineLogo: "VTA",
    departure: "TP. Hồ Chí Minh (SGN)",
    arrival: "Nha Trang (CXR)",
    departureTime: "16:45",
    arrivalTime: "17:55",
    price: 850000,
    originalPrice: 1200000,
    duration: "1h 10m",
    stops: 0
  },
  {
    id: "flight-6",
    code: "VN-511",
    airline: "Vietnam Airlines",
    airlineLogo: "VNA",
    departure: "Đà Nẵng (DAD)",
    arrival: "Hà Nội (HAN)",
    departureTime: "19:20",
    arrivalTime: "20:45",
    price: 1250000,
    originalPrice: 1800000,
    duration: "1h 25m",
    stops: 0
  }
];

export const TRAINS: Train[] = [
  {
    id: "train-se1",
    code: "SE1 (Thống Nhất)",
    type: "Tàu nhanh chở khách",
    departure: "Hà Nội",
    arrival: "Đà Nẵng",
    departureTime: "22:15",
    duration: "15h 45m",
    price: 850000,
    seatsAvailable: 34,
    seatClass: "Giường nằm khoang 4 điều hòa"
  },
  {
    id: "train-se3",
    code: "SE3 (Thống Nhất)",
    type: "Tàu nhanh cao cấp",
    departure: "Hà Nội",
    arrival: "Vinh",
    departureTime: "19:25",
    duration: "5h 50m",
    price: 420000,
    seatsAvailable: 12,
    seatClass: "Ngồi mềm điều hòa"
  },
  {
    id: "train-se5",
    code: "SE5 (Thống Nhất)",
    type: "Tàu chất lượng cao",
    departure: "Hà Nội",
    arrival: "TP. Hồ Chí Minh",
    departureTime: "08:50",
    duration: "32h 10m",
    price: 1450000,
    seatsAvailable: 18,
    seatClass: "Giường nằm khoang 4 VIP"
  },
  {
    id: "train-spt1",
    code: "SPT1",
    type: "Tàu du lịch",
    departure: "TP. Hồ Chí Minh",
    arrival: "Phan Thiết (Mũi Né)",
    departureTime: "06:40",
    duration: "3h 50m",
    price: 280000,
    seatsAvailable: 50,
    seatClass: "Ngồi mềm điều hòa cao cấp"
  }
];

export const CARS: Car[] = [
  {
    id: "car-1",
    type: "SUV",
    name: "Toyota Fortuner",
    brand: "Toyota",
    capacity: 7,
    bags: 4,
    price: 1200000,
    rating: 4.8,
    company: "TripCar Vietnam",
    image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "car-2",
    type: "Sedan",
    name: "Hyundai Accent",
    brand: "Hyundai",
    capacity: 5,
    bags: 2,
    price: 800000,
    rating: 4.6,
    company: "An Tam Car Rental",
    image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "car-3",
    type: "Luxury",
    name: "Mercedes-Benz C200",
    brand: "Mercedes",
    capacity: 5,
    bags: 3,
    price: 2500000,
    rating: 4.9,
    company: "Luxe Drive VN",
    image: "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?auto=format&fit=crop&w=400&q=80"
  }
];

export const ATTRACTIONS: Attraction[] = [
  {
    id: "attr-1",
    name: "Vé vui chơi VinWonders Phú Quốc",
    location: "Khu Bãi Dài, Phú Quốc",
    rating: 4.9,
    price: 950000,
    originalPrice: 1100000,
    tag: "Bestseller",
    image: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80",
    description: "Tổ hợp công viên chủ đề lớn nhất Việt Nam với quy mô hoành tráng chuẩn quốc tế."
  },
  {
    id: "attr-2",
    name: "Vé Cáp Treo Bà Nà Hills Đà Nẵng",
    location: "Hòa Ninh, Hòa Vang, Đà Nẵng",
    rating: 4.8,
    price: 880000,
    originalPrice: 950000,
    tag: "Must See",
    image: "https://images.unsplash.com/photo-1509060464153-44667396260f?auto=format&fit=crop&w=800&q=80",
    description: "Khám phá danh thắng mây trời châu Âu, dạo bước qua chiếc Cầu Vàng duyên dáng giữa núi rừng."
  },
  {
    id: "attr-3",
    name: "Tour 4 đảo Nha Trang bằng Canô xịn",
    location: "Cảng Cầu Đá, Nha Trang",
    rating: 4.7,
    price: 550000,
    originalPrice: 700000,
    tag: "Khuyên Dùng",
    image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80",
    description: "Nhảy sóng biển đảo hoang sơ Nha Trang, lặn ngắm san hô quý, thưởng thức buffet hải sản tươi."
  }
];

export const REVIEWS: Review[] = [
  {
    id: "rev-1",
    author: "Nguyễn Minh Anh",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
    rating: 5,
    date: "2026-05-12",
    content: "Đặt khách sạn Vinpearl Resort Phú Quốc qua Trip.com siêu tiện lợi. Nhận phòng cực kỳ nhanh, nhân viên tận tâm chu đáo tuyệt đối.",
    destination: "Phú Quốc"
  },
  {
    id: "rev-2",
    author: "Trần Tuấn Kiệt",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
    rating: 5,
    date: "2026-05-24",
    content: "Vé cáp treo Bà Nà mua trực tiếp xuất QR Code quét qua cổng rất nhanh, giá lại rẻ hơn mua tại chỗ. Nhất định sẽ ủng hộ tiếp!",
    destination: "Đà Nẵng"
  },
  {
    id: "rev-3",
    author: "Lê Thị Hồng Nhung",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
    rating: 4.8,
    date: "2026-06-01",
    content: "Khách sạn Sala Đà Nẵng view quá mê ly. Bể bơi vô cực ngắm hoàng hôn ngút ngàn mây nước. Chăm sóc khách hàng của Trip.com hỗ trợ nhiệt tình khi mình đổi ngày bay.",
    destination: "Đà Nẵng"
  }
];

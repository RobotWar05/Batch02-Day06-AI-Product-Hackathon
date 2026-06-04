export interface Hotel {
  id: string;
  name: string;
  image: string;
  location: string;
  rating: number;
  reviewsCount: number;
  price: number;
  originalPrice: number;
  stars: number;
  amenities: string[];
  tag?: string;
  description: string;
}

export interface Flight {
  id: string;
  code: string;
  airline: string;
  airlineLogo: string;
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  originalPrice: number;
  duration: string;
  stops: number;
}

export interface Train {
  id: string;
  code: string;
  type: string;
  departure: string;
  arrival: string;
  departureTime: string;
  duration: string;
  price: number;
  seatsAvailable: number;
  seatClass: string;
}

export interface Car {
  id: string;
  type: string; // "SUV", "Sedan", "Hatchback", "Luxury"
  name: string;
  brand: string;
  capacity: number;
  bags: number;
  price: number;
  rating: number;
  company: string;
  image: string;
}

export interface Attraction {
  id: string;
  name: string;
  location: string;
  rating: number;
  price: number;
  originalPrice: number;
  tag?: string;
  image: string;
  description: string;
}

export interface Destination {
  id: string;
  name: string;
  image: string;
  country: string;
  hotelStartingPrice: number;
  flightStartingPrice: number;
  description: string;
}

export interface Booking {
  id: string;
  code: string;
  type: "hotel" | "flight" | "train" | "car" | "attraction";
  typeName: string;
  itemName: string;
  quantity: number; // e.g. number of rooms or passengers
  dateRange: string;
  price: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentMethod: string;
  status: "Chờ thanh toán" | "Thành công" | "Đã hủy";
  createdAt: string;
}

export interface Review {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  date: string;
  content: string;
  destination: string;
}

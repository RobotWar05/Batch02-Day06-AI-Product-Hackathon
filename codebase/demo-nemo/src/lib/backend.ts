export interface BackendTripState {
  intent: "search_trip" | "faq" | "unrelated";
  slots: {
    departure: string | null;
    destination: string | null;
    date: string | null;
    transport: "flight" | "train" | null;
    passengers: number | null;
  };
  confidence: number;
  missing_slots: string[];
  pending_slot: "departure" | "destination" | "date" | "transport" | "passengers" | null;
  search_status: "collecting" | "ready" | "searched" | "not_applicable";
  is_unsafe: boolean;
  last_tool_calls: Array<Record<string, unknown>>;
  raw_message: string;
}

export interface BackendAssistantResponse {
  response_type: "text" | "slot_filling" | "trip_widget" | "search_results" | "error";
  message: string;
  payload: Record<string, any>;
  next_action: string | null;
}

export interface BackendTripOption {
  id: string;
  provider: string;
  code: string;
  transport_mode: "flight" | "train";
  origin: string;
  destination: string;
  date: string;
  departure_time: string;
  arrival_time: string;
  duration_minutes: number;
  duration_label: string;
  total_price_vnd?: number;
  one_way_price_vnd?: number;
  price_label: string;
  available_seats?: number;
  reason?: string;
  recommendation_reason?: string;
}

export interface BackendSearchResultSet {
  status: "ok" | "need_more_info" | "no_results";
  query: Record<string, any>;
  grouped_results: {
    flight: {
      default: BackendTripOption[];
      see_more: BackendTripOption[];
    };
    train: {
      default: BackendTripOption[];
      see_more: BackendTripOption[];
    };
  };
  recommendation: {
    best_option_id: string | null;
    reason: string;
    confidence: number;
  };
  follow_up_question: string | null;
  message: string;
}

export interface BackendModeComparison {
  query: Record<string, any>;
  cheaper_mode: "flight" | "train" | null;
  cheapest_flight: BackendTripOption | null;
  cheapest_train: BackendTripOption | null;
  flight_total_price_vnd: number | null;
  train_total_price_vnd: number | null;
  price_delta_vnd: number | null;
  duration_delta_minutes: number | null;
  summary: string;
}

interface BackendUser {
  id: string;
  username: string;
}

interface BackendSession {
  id: string;
  current_trip_state: BackendTripState | null;
}

interface LoginResponse {
  status: "ok";
  is_new_user: boolean;
  user: BackendUser;
}

interface CreateSessionResponse {
  status: "ok";
  session: BackendSession;
}

interface PostMessageResponse {
  status: "ok";
  session: BackendSession;
  response: BackendAssistantResponse;
}

const BACKEND_PREFIX = "/backend";

async function backendFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BACKEND_PREFIX}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Backend request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function loginDemoUser(username: string): Promise<BackendUser> {
  const data = await backendFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password: "demo-nemo" }),
  });
  return data.user;
}

export async function createChatSession(userId: string, title: string): Promise<BackendSession> {
  const data = await backendFetch<CreateSessionResponse>(`/users/${userId}/sessions`, {
    method: "POST",
    body: JSON.stringify({ title }),
  });
  return data.session;
}

export async function postChatMessage(sessionId: string, content: string): Promise<PostMessageResponse> {
  return backendFetch<PostMessageResponse>(`/sessions/${sessionId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export async function searchTrips(query: Record<string, any>): Promise<BackendSearchResultSet> {
  return backendFetch<BackendSearchResultSet>("/api/search", {
    method: "POST",
    body: JSON.stringify(query),
  });
}

export async function compareTrips(query: Record<string, any>): Promise<BackendModeComparison> {
  return backendFetch<BackendModeComparison>("/api/compare", {
    method: "POST",
    body: JSON.stringify(query),
  });
}

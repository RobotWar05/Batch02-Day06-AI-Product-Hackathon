function normalize(text) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function parseUserMessage(message) {
  const raw = normalize(message);
  const isFailureDemo = raw.includes("ha noi") && raw.includes("da nang") && raw.includes("tau");
  const hasJune10 = raw.includes("10/6") || raw.includes("10 thang 6") || raw.includes("ngay 10");
  const slots = {
    intent: raw.includes("huy") ? "cancel" : "search_trip",
    origin: null,
    destination: null,
    date: hasJune10 ? "2026-06-10" : null,
    date_label: hasJune10 ? "10/06/2026" : null,
    transport_mode: null,
    passengers: raw.match(/\b2\b|2 ve|hai ve/) ? 2 : 1,
    confidence: 0.96,
    missing_fields: [],
    warning: "",
    preferred_provider: null
  };

  if (raw.includes("sai gon") || raw.includes("tp.hcm") || raw.includes("tphcm") || raw.includes("ho chi minh")) {
    slots.origin = "TP.HCM";
  }
  if (raw.includes("ha noi")) {
    slots.origin = "Hà Nội";
  }
  if (raw.includes("da nang")) {
    slots.destination = "Đà Nẵng";
  }
  if (raw.includes("tau")) {
    slots.transport_mode = "train";
  }
  if (raw.includes("may bay") || raw.includes("bay")) {
    slots.transport_mode = "flight";
  }
  if (raw.includes("vietnam airline") || raw.includes("vietnam airlines")) {
    slots.preferred_provider = "Vietnam Airlines";
    slots.transport_mode = "flight";
  }
  if (raw.includes("vietjet")) {
    slots.preferred_provider = "Vietjet Air";
    slots.transport_mode = "flight";
  }
  if (raw.includes("bamboo")) {
    slots.preferred_provider = "Bamboo Airways";
    slots.transport_mode = "flight";
  }
  if (raw.includes("vietravel")) {
    slots.preferred_provider = "Vietravel Airlines";
    slots.transport_mode = "flight";
  }
  if (raw.includes("sun phuquoc") || raw.includes("sun phu quoc")) {
    slots.preferred_provider = "Sun PhuQuoc Airways";
    slots.transport_mode = "flight";
  }

  if (isFailureDemo) {
    slots.date = "2026-06-10";
    slots.date_label = "10/06/2026";
    slots.transport_mode = "flight";
    slots.confidence = 0.62;
    slots.warning = "AI có thể đã hiểu sai phương tiện. Vui lòng kiểm tra trước khi tìm.";
  }

  if (!slots.origin) slots.missing_fields.push("origin");
  if (!slots.destination) slots.missing_fields.push("destination");
  if (!slots.date) slots.missing_fields.push("date");
  if (!slots.transport_mode) slots.missing_fields.push("transport_mode");

  return slots;
}


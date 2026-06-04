function normalize(text) {
  return String(text || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function parseTravelDate(message) {
  const raw = normalize(message);
  const slashDate = raw.match(/\b(\d{1,2})\s*\/\s*(\d{1,2})(?:\s*\/\s*(\d{2,4}))?\b/);
  if (slashDate) {
    const day = Number(slashDate[1]);
    const month = Number(slashDate[2]);
    const year = slashDate[3] ? normalizeYear(slashDate[3]) : 2026;
    return buildDateSlot(day, month, year);
  }

  const textDate = raw.match(/(?:ngay\s*)?(\d{1,2})\s*(?:thang|\/)?\s*(\d{1,2})?/);
  if (textDate && raw.includes("ngay")) {
    const day = Number(textDate[1]);
    const month = Number(textDate[2] || 6);
    return buildDateSlot(day, month, 2026);
  }

  return { date: null, date_label: null };
}

function normalizeYear(value) {
  const year = Number(value);
  return year < 100 ? 2000 + year : year;
}

function buildDateSlot(day, month, year) {
  if (!day || !month || day < 1 || day > 31 || month < 1 || month > 12) {
    return { date: null, date_label: null };
  }
  const dd = String(day).padStart(2, "0");
  const mm = String(month).padStart(2, "0");
  return {
    date: `${year}-${mm}-${dd}`,
    date_label: `${dd}/${mm}/${year}`
  };
}

function parseUserMessage(message) {
  const raw = normalize(message);
  const isFailureDemo = raw.includes("ha noi") && raw.includes("da nang") && raw.includes("tau");
  const slots = {
    intent: raw.includes("huy") ? "cancel" : "search_trip",
    origin: null,
    destination: null,
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
  if (raw.includes("nha trang")) {
    slots.destination = "Nha Trang";
  }
  if (raw.includes("da nang")) {
    slots.destination = "Đà Nẵng";
  }
  if (raw.includes("di ha noi") || raw.includes("den ha noi")) {
    slots.destination = "Hà Nội";
  }
  if (raw.includes("di tp.hcm") || raw.includes("den tp.hcm") || raw.includes("di sai gon") || raw.includes("den sai gon")) {
    slots.destination = "TP.HCM";
  }
  if (raw.includes("tu nha trang")) {
    slots.origin = "Nha Trang";
  }
  if (raw.includes("tu da nang")) {
    slots.origin = "Đà Nẵng";
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
    slots.transport_mode = "flight";
    slots.confidence = 0.62;
    slots.warning = "AI có thể đã hiểu sai phương tiện. Vui lòng kiểm tra trước khi tìm.";
  }

  if (!slots.origin) slots.missing_fields.push("origin");
  if (!slots.destination) slots.missing_fields.push("destination");
  if (!slots.transport_mode) slots.missing_fields.push("transport_mode");

  return slots;
}

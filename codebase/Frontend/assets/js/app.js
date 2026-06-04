const messagesEl = document.getElementById("messages");
const chatCanvas = document.getElementById("chatCanvas");
const form = document.getElementById("chatForm");
const input = document.getElementById("chatInput");
const resetBtn = document.getElementById("resetBtn");
const sheet = document.getElementById("editSheet");
const sheetBackdrop = document.getElementById("sheetBackdrop");
const sheetTitle = document.getElementById("sheetTitle");
const sheetOptions = document.getElementById("sheetOptions");
const applyEditBtn = document.getElementById("applyEditBtn");
const closeSheetBtn = document.getElementById("closeSheetBtn");

const state = {
  messages: [],
  currentSlots: null,
  selectedEditField: null,
  pendingValue: null,
  resultVisible: false,
  expandedResults: {
    flight: false,
    train: false
  }
};

function iconForTransport(mode) {
  return mode === "flight" ? "flight_takeoff" : "train";
}

function labelForTransport(mode) {
  return mode === "flight" ? "Máy bay" : "Tàu hỏa";
}

function addMessage(type, content, meta = {}) {
  state.messages.push({ id: crypto.randomUUID(), type, content, meta });
  render();
}

function setTyping() {
  addMessage("typing", "Đang phân tích...");
}

function removeTyping() {
  state.messages = state.messages.filter((msg) => msg.type !== "typing");
  render();
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    chatCanvas.scrollTop = chatCanvas.scrollHeight;
  });
}

function render() {
  messagesEl.innerHTML = state.messages.map(renderMessage).join("");
  attachDynamicHandlers();
  scrollToBottom();
}

function renderMessage(message) {
  if (message.type === "user") return renderUserBubble(message.content);
  if (message.type === "typing") return renderTypingBubble();
  if (message.type === "bot") return renderBotBubble(message.content);
  if (message.type === "clarify") return renderClarification(message.meta.slots);
  if (message.type === "widget") return renderTripWidget(message.meta.slots);
  if (message.type === "results") return renderResults(message.meta.slots);
  return "";
}

function renderUserBubble(text) {
  return `
    <div class="flex justify-end">
      <div class="max-w-[80%] rounded-3xl rounded-tr-md bg-primary px-4 py-3 text-sm text-white shadow-ambient">
        ${escapeHtml(text)}
      </div>
    </div>
  `;
}

function renderBotBubble(text) {
  return `
    <div class="flex items-start gap-3">
      <div class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary-container text-secondary">
        <span class="material-symbols-outlined text-[18px] fill">smart_toy</span>
      </div>
      <div class="max-w-[85%] rounded-3xl rounded-tl-md border border-outline bg-surface px-4 py-3 text-sm text-text shadow-ambient">
        ${escapeHtml(text)}
      </div>
    </div>
  `;
}

function renderTypingBubble() {
  return `
    <div class="flex items-start gap-3">
      <div class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary-container text-secondary">
        <span class="material-symbols-outlined text-[18px] fill">smart_toy</span>
      </div>
      <div class="rounded-3xl rounded-tl-md border border-outline bg-surface px-4 py-3 text-sm text-muted shadow-ambient">
        <span class="inline-flex items-center gap-2">
          <span class="h-2 w-2 animate-pulse rounded-full bg-primary"></span>
          Đang phân tích...
        </span>
      </div>
    </div>
  `;
}

function renderClarification(slots) {
  const needOrigin = slots.missing_fields.includes("origin");
  const needTransport = slots.missing_fields.includes("transport_mode");
  const needDate = slots.missing_fields.includes("date");
  const missingLabels = slots.missing_fields.map((field) => ({
    origin: "điểm đi",
    destination: "điểm đến",
    date: "ngày đi",
    transport_mode: "phương tiện"
  }[field] || field)).join(", ");
  return `
    <div class="ml-0 md:ml-11 max-w-[620px] rounded-2xl border-2 border-primary/20 bg-surface p-5 shadow-ambient">
      <div class="mb-4 flex items-center gap-3">
        <div class="grid h-9 w-9 place-items-center rounded-xl bg-secondary-container text-secondary">
          <span class="material-symbols-outlined">help</span>
        </div>
        <div>
          <h3 class="font-bold text-text">Tôi cần thêm thông tin</h3>
          <p class="text-sm text-muted">Bot không đoán bừa khi thiếu slot quan trọng: ${escapeHtml(missingLabels)}.</p>
        </div>
      </div>
      ${needDate ? `
      <div class="mb-4">
        <p class="mb-2 text-sm font-semibold text-text">Bạn muốn đi ngày nào?</p>
        <div class="flex flex-wrap gap-2">
          ${quickButton("date", "2026-06-10", "10/06/2026")}
          ${quickButton("date", "2026-06-11", "11/06/2026")}
        </div>
      </div>` : ""}
      ${needOrigin ? `
      <div class="mb-4">
        <p class="mb-2 text-sm font-semibold text-text">Bạn muốn khởi hành từ đâu?</p>
        <div class="flex flex-wrap gap-2">
          ${quickButton("origin", "Hà Nội")}
          ${quickButton("origin", "TP.HCM")}
          ${quickButton("origin", "Đà Nẵng")}
        </div>
      </div>` : ""}
      ${needTransport ? `
      <div class="mb-1">
        <p class="mb-2 text-sm font-semibold text-text">Bạn muốn đi bằng gì?</p>
        <div class="flex flex-wrap gap-2">
          ${quickButton("transport_mode", "flight", "Máy bay")}
          ${quickButton("transport_mode", "train", "Tàu hỏa")}
        </div>
      </div>` : ""}
    </div>
  `;
}

function quickButton(field, value, label = value) {
  return `<button data-quick-field="${field}" data-quick-value="${value}" class="quick-btn rounded-full border border-outline bg-surface px-4 py-2 text-sm font-semibold text-muted transition hover:border-primary hover:text-primary">${escapeHtml(label)}</button>`;
}

function renderTripWidget(slots) {
  const statusColor = slots.warning ? "text-warning" : "text-success";
  const statusIcon = slots.warning ? "warning" : "check_circle";
  const statusText = slots.warning ? "Cần kiểm tra lại" : "Đã nhận diện thông tin";
  return `
    <div class="ml-0 md:ml-11 max-w-[620px] overflow-hidden rounded-2xl border border-outline bg-surface shadow-ambient">
      <div class="flex items-center justify-between border-b border-outline bg-surface-low px-5 py-4">
        <div class="flex items-center gap-3">
          <div class="grid h-10 w-10 place-items-center rounded-xl bg-secondary-container text-primary">
            <span class="material-symbols-outlined">${iconForTransport(slots.transport_mode)}</span>
          </div>
          <div>
            <h3 class="font-bold text-text">Chi tiết hành trình</h3>
            <p class="flex items-center gap-1 text-xs font-semibold ${statusColor}">
              <span class="material-symbols-outlined text-[16px]">${statusIcon}</span>
              ${statusText} · confidence ${Math.round(slots.confidence * 100)}%
            </p>
          </div>
        </div>
        <button data-edit-field="all" class="edit-btn grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-surface-high hover:text-primary" title="Chỉnh sửa">
          <span class="material-symbols-outlined">edit</span>
        </button>
      </div>

      <div class="grid gap-4 p-5 sm:grid-cols-2">
        ${slotField("origin", "location_on", "Điểm đi", slots.origin || "Chưa rõ")}
        ${slotField("destination", "flag", "Điểm đến", slots.destination || "Chưa rõ")}
        ${slotField("date", "calendar_today", "Ngày đi", slots.date_label || "Chưa rõ")}
        ${slotField("transport_mode", iconForTransport(slots.transport_mode), "Phương tiện", labelForTransport(slots.transport_mode))}
        ${slotField("passengers", "group", "Hành khách", `${slots.passengers || 1} người`)}
      </div>

      ${slots.warning ? `
      <div class="mx-5 mb-4 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-text">
        <span class="font-semibold text-warning">Cảnh báo:</span> ${escapeHtml(slots.warning)}
      </div>` : ""}

      <div class="flex flex-wrap items-center justify-end gap-3 border-t border-outline px-5 py-4">
        <button data-edit-field="transport_mode" class="edit-btn rounded-xl border border-outline bg-surface px-4 py-2 text-sm font-semibold text-muted transition hover:border-primary hover:text-primary">Chỉnh sửa</button>
        <button id="searchBtn" class="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-container">
          ${state.resultVisible ? "Tìm lại kết quả" : "Tìm chuyến"}
        </button>
      </div>
    </div>
  `;
}

function slotField(field, icon, label, value) {
  return `
    <div class="group flex items-start justify-between gap-3 rounded-xl border border-transparent p-2 transition hover:border-outline hover:bg-surface-low">
      <div class="flex gap-3">
        <span class="material-symbols-outlined mt-1 text-[18px] text-muted">${icon}</span>
        <div>
          <p class="text-xs font-bold uppercase tracking-wide text-muted">${label}</p>
          <p class="mt-1 text-sm font-semibold text-text">${escapeHtml(value)}</p>
        </div>
      </div>
      <button data-edit-field="${field}" class="edit-btn grid h-8 w-8 place-items-center rounded-full text-muted opacity-100 transition hover:bg-surface-high hover:text-primary md:opacity-0 md:group-hover:opacity-100" title="Sửa ${label}">
        <span class="material-symbols-outlined text-[16px]">edit</span>
      </button>
    </div>
  `;
}

function renderResults(slots) {
  const flights = prioritizeResults(flightResults, slots.preferred_provider);
  const trains = prioritizeResults(trainResults, null);
  const visibleFlights = state.expandedResults.flight ? flights : flights.slice(0, 3);
  const visibleTrains = state.expandedResults.train ? trains : trains.slice(0, 2);
  const cheapestFlight = [...flightResults].sort((a, b) => a.total_price_vnd - b.total_price_vnd)[0];
  const preferredBest = slots.preferred_provider ? flights.find((item) => item.provider === slots.preferred_provider) : null;
  const cheaperHint = preferredBest && cheapestFlight && cheapestFlight.total_price_vnd < preferredBest.total_price_vnd
    ? `<div class="mb-3 rounded-2xl border border-primary/20 bg-secondary-container px-4 py-3 text-sm text-text">
        Tôi đã ưu tiên ${escapeHtml(slots.preferred_provider)} theo yêu cầu của bạn. Có chuyến rẻ hơn của ${escapeHtml(cheapestFlight.provider)} (${cheapestFlight.price}). Bạn muốn xem chuyến rẻ hơn không?
        <button class="show-more-btn ml-2 font-bold text-primary underline" data-mode="flight">Có, xem thêm</button>
      </div>`
    : "";
  return `
    <div class="ml-0 md:ml-11 max-w-[720px]">
      <div class="mb-3 flex items-center justify-between">
        <div>
          <h3 class="text-lg font-bold text-text">Kết quả phù hợp</h3>
          <p class="text-sm text-muted">${slots.origin} -> ${slots.destination} · ${slots.date_label} · ưu tiên chuyến rẻ nếu chưa chọn hãng</p>
        </div>
        <span class="rounded-full bg-secondary-container px-3 py-1 text-xs font-bold text-secondary">Dữ liệu demo</span>
      </div>
      ${cheaperHint}
      ${renderResultSection("flight", "Máy bay", "Hiển thị 3 chuyến rẻ nhất trước. Bấm xem thêm để tham khảo hãng khác.", visibleFlights, flights.length)}
      ${renderResultSection("train", "Tàu hỏa", "Hiển thị 2 chuyến tàu đi thẳng để so sánh chi phí và thời gian.", visibleTrains, trains.length)}
    </div>
  `;
}

function prioritizeResults(results, preferredProvider) {
  return [...results].sort((a, b) => {
    if (preferredProvider) {
      const aPreferred = a.provider === preferredProvider ? 0 : 1;
      const bPreferred = b.provider === preferredProvider ? 0 : 1;
      if (aPreferred !== bPreferred) return aPreferred - bPreferred;
    }
    return a.total_price_vnd - b.total_price_vnd || a.duration_minutes - b.duration_minutes;
  });
}

function renderResultSection(mode, title, subtitle, items, total) {
  const expanded = state.expandedResults[mode];
  const hiddenCount = Math.max(total - items.length, 0);
  const hasExtraItems = total > (mode === "flight" ? 3 : 2);
  return `
    <section class="mb-4 rounded-2xl border border-outline bg-surface-low p-3">
      <div class="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 class="flex items-center gap-2 font-bold text-text">
            <span class="material-symbols-outlined text-[18px] text-primary">${iconForTransport(mode)}</span>
            ${title}
          </h4>
          <p class="text-xs text-muted">${subtitle}</p>
        </div>
        ${hiddenCount > 0 ? `<button class="show-more-btn rounded-xl border border-outline bg-surface px-3 py-2 text-xs font-bold text-primary transition hover:border-primary" data-mode="${mode}">Xem thêm ${hiddenCount} chuyến</button>` : ""}
        ${expanded && hasExtraItems ? `<button class="show-less-btn rounded-xl border border-outline bg-surface px-3 py-2 text-xs font-bold text-muted transition hover:border-primary" data-mode="${mode}">Thu gọn</button>` : ""}
      </div>
      <div class="grid gap-3">
        ${items.map(renderResultCard).join("")}
      </div>
    </section>
  `;
}

function renderResultCard(item) {
  const modeLabel = labelForTransport(item.transport_mode);
  return `
    <article class="rounded-2xl border border-outline bg-surface p-4 shadow-ambient transition hover:-translate-y-0.5 hover:shadow-floating">
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div class="flex items-start gap-3">
          <div class="grid h-11 w-11 place-items-center rounded-xl bg-secondary-container text-primary">
            <span class="material-symbols-outlined">${iconForTransport(item.transport_mode)}</span>
          </div>
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <h4 class="font-bold text-text">${escapeHtml(item.provider)} · ${escapeHtml(item.code)}</h4>
              <span class="rounded-full bg-surface-low px-2 py-1 text-xs font-semibold text-muted">${modeLabel}</span>
            </div>
            <p class="mt-1 text-sm text-muted">${escapeHtml(item.reason)}</p>
          </div>
        </div>

        <div class="grid grid-cols-3 items-center gap-4 rounded-xl bg-surface-low px-4 py-3 text-center md:min-w-[260px]">
          <div>
            <p class="text-lg font-bold text-text">${item.departure_time}</p>
            <p class="text-xs text-muted">Đi</p>
          </div>
          <div>
            <p class="text-xs font-semibold text-muted">${item.duration}</p>
            <div class="my-1 h-px bg-outline"></div>
            <p class="text-xs text-muted">Thời lượng</p>
          </div>
          <div>
            <p class="text-lg font-bold text-text">${item.arrival_time}</p>
            <p class="text-xs text-muted">Đến</p>
          </div>
        </div>

        <div class="flex items-center justify-between gap-4 md:block md:text-right">
          <p class="text-xl font-bold text-primary">${item.price}</p>
          <button class="mt-0 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-container md:mt-2">Chọn vé</button>
        </div>
      </div>
    </article>
  `;
}

function attachDynamicHandlers() {
  document.querySelectorAll(".quick-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const field = button.dataset.quickField;
      const value = button.dataset.quickValue;
      updateSlot(field, value);
    });
  });

  document.querySelectorAll(".edit-btn").forEach((button) => {
    button.addEventListener("click", () => openEditSheet(button.dataset.editField));
  });

  const searchBtn = document.getElementById("searchBtn");
  if (searchBtn) {
    searchBtn.addEventListener("click", showResults);
  }

  document.querySelectorAll(".show-more-btn").forEach((button) => {
    button.addEventListener("click", () => {
      state.expandedResults[button.dataset.mode] = true;
      render();
    });
  });

  document.querySelectorAll(".show-less-btn").forEach((button) => {
    button.addEventListener("click", () => {
      state.expandedResults[button.dataset.mode] = false;
      render();
    });
  });
}

function handleUserMessage(message) {
  if (!message.trim()) return;
  state.resultVisible = false;
  addMessage("user", message);
  setTyping();
  setTimeout(() => {
    removeTyping();
    const slots = parseUserMessage(message);
    state.currentSlots = slots;
    if (slots.intent !== "search_trip") {
      addMessage("bot", "Hiện demo này tập trung vào luồng tìm chuyến đi. Tôi sẽ chuyển câu hỏi này sang FAQ thông thường.");
      return;
    }
    if (slots.missing_fields.length > 0) {
      addMessage("bot", "Tôi cần thêm thông tin để tìm chuyến chính xác hơn.");
      addMessage("clarify", "", { slots });
      return;
    }
    addMessage("bot", "Tôi đã tìm thấy thông tin chuyến đi của bạn. Vui lòng kiểm tra trước khi tìm kiếm.");
    addMessage("widget", "", { slots });
  }, 500);
}

function updateSlot(field, value) {
  if (!state.currentSlots) {
    state.currentSlots = {
      intent: "search_trip",
      origin: null,
      destination: "Đà Nẵng",
      date: "2026-06-10",
      date_label: "10/06/2026",
      transport_mode: null,
      passengers: 1,
      confidence: 0.9,
      missing_fields: [],
      warning: ""
    };
  }

  if (field === "transport_mode") {
    state.currentSlots.transport_mode = value;
  } else if (field === "date") {
    state.currentSlots.date = value === "2026-06-11" ? "2026-06-11" : "2026-06-10";
    state.currentSlots.date_label = value === "2026-06-11" ? "11/06/2026" : "10/06/2026";
  } else if (field === "passengers") {
    state.currentSlots.passengers = Number(value);
  } else {
    state.currentSlots[field] = value;
  }

  state.currentSlots.warning = "";
  state.currentSlots.confidence = 0.94;
  state.currentSlots.missing_fields = ["origin", "destination", "date", "transport_mode"].filter((key) => !state.currentSlots[key]);

  if (state.currentSlots.missing_fields.length === 0) {
    removeClarificationMessages();
    addOrReplaceWidget();
  } else {
    render();
  }
}

function removeClarificationMessages() {
  state.messages = state.messages.filter((msg) => msg.type !== "clarify");
}

function addOrReplaceWidget() {
  state.messages = state.messages.filter((msg) => msg.type !== "widget" && msg.type !== "results");
  addMessage("bot", "Thông tin đã được cập nhật. Bạn kiểm tra lại trước khi tìm chuyến nhé.");
  addMessage("widget", "", { slots: state.currentSlots });
}

function showResults() {
  state.resultVisible = true;
  state.expandedResults = { flight: false, train: false };
  state.messages = state.messages.filter((msg) => msg.type !== "results");
  addMessage("results", "", { slots: state.currentSlots });
}

function openEditSheet(field) {
  if (!state.currentSlots) return;
  state.selectedEditField = field === "all" ? "transport_mode" : field;
  state.pendingValue = null;
  sheetTitle.textContent = titleForField(state.selectedEditField);
  sheetOptions.innerHTML = optionsForField(state.selectedEditField);
  sheet.classList.remove("hidden");
  sheetBackdrop.classList.remove("hidden");
  document.querySelectorAll(".option-btn").forEach((button) => {
    button.addEventListener("click", () => {
      state.pendingValue = button.dataset.value;
      document.querySelectorAll(".option-btn").forEach((btn) => btn.classList.remove("border-primary", "text-primary", "bg-secondary-container"));
      button.classList.add("border-primary", "text-primary", "bg-secondary-container");
    });
  });
}

function closeEditSheet() {
  sheet.classList.add("hidden");
  sheetBackdrop.classList.add("hidden");
  state.selectedEditField = null;
  state.pendingValue = null;
}

function titleForField(field) {
  const map = {
    origin: "Chỉnh sửa điểm đi",
    destination: "Chỉnh sửa điểm đến",
    date: "Chỉnh sửa ngày đi",
    transport_mode: "Chỉnh sửa phương tiện",
    passengers: "Chỉnh sửa hành khách"
  };
  return map[field] || "Chỉnh sửa";
}

function optionsForField(field) {
  const button = (value, label) => `<button data-value="${value}" class="option-btn rounded-xl border border-outline bg-surface px-4 py-3 text-left text-sm font-semibold text-text transition hover:border-primary hover:text-primary">${label}</button>`;
  if (field === "transport_mode") {
    return button("flight", "Máy bay") + button("train", "Tàu hỏa");
  }
  if (field === "origin" || field === "destination") {
    return button("Hà Nội", "Hà Nội") + button("TP.HCM", "TP.HCM") + button("Đà Nẵng", "Đà Nẵng");
  }
  if (field === "date") {
    return button("2026-06-10", "10/06/2026") + button("2026-06-11", "11/06/2026");
  }
  if (field === "passengers") {
    return button("1", "1 người") + button("2", "2 người") + button("3", "3 người");
  }
  return "";
}

function runScenario(name) {
  resetConversation();
  const message = scenarios[name];
  input.value = "";
  if (name === "correction") {
    handleUserMessage(message);
    setTimeout(() => openEditSheet("transport_mode"), 900);
    return;
  }
  handleUserMessage(message);
}

function resetConversation() {
  closeEditSheet();
  state.messages = [];
  state.currentSlots = null;
  state.resultVisible = false;
  render();
  addMessage("bot", "Xin chào, tôi là AI Đi Không. Hãy nhập nhu cầu chuyến đi, tôi sẽ trích xuất thông tin và tạo widget xác nhận cho bạn.");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const message = input.value;
  input.value = "";
  handleUserMessage(message);
});

resetBtn.addEventListener("click", resetConversation);
closeSheetBtn.addEventListener("click", closeEditSheet);
sheetBackdrop.addEventListener("click", closeEditSheet);
applyEditBtn.addEventListener("click", () => {
  if (state.selectedEditField && state.pendingValue !== null) {
    updateSlot(state.selectedEditField, state.pendingValue);
  }
  closeEditSheet();
});

document.querySelectorAll(".scenario-btn").forEach((button) => {
  button.addEventListener("click", () => runScenario(button.dataset.scenario));
});

resetConversation();


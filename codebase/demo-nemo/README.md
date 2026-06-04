# 🏝️ Demo Nemo - Trip.com VN Clone with AI Assistant Neo

Welcome to **Demo Nemo**, a modern demonstration clone of the Vietnamese version of **Trip.com** (`vn.trip.com`). Styled with an elegant **Clean Minimalism** aesthetic, this app integrates search flows for flights, hotels, trains, and ticket bookings, paired with **Neo**—a powerful, context-aware AI Travel Assistant.

---

## 🤖 Meet Neo: Your Premium AI Travel Companion

**Neo** is more than just a chatbot; he is a fully-integrated AI Travel Planner powered by the state-of-the-art **Gemini API** via a secure server-side proxy. Neo knows the best resort guidelines, local restaurants, check-in spots, and detailed itineraries across Vietnam (including Phu Quoc, Sapa, Da Lat, Hanoi, Da Nang, and more).

### ✨ Core Capabilities of Neo

1. **Structured Flight & Train Search Flows:** Neo converts natural language requests into custom, editable travel configurations. Using zero manual forms, users can specify departures, dates, transport types (flight/train), and passenger counts via free text.
2. **Interactive In-Chat Trip Widgets:** Once travel intent is detected, Neo populates a beautiful, embedded metadata widget in the chat box. Travelers can edit trip details (dates, cities, transport, passenger counts) directly on page.
3. **Flight vs Train Comparison Deck:** Allows users to compare pricing and travel duration side-by-side between **Flights (Fastest)** and **Trains (Scenic & Budget)** directly in the chat widget! It computes live prices multiplied by passenger counts.
4. **Smart Slot Filling & Refinement:** Neo remembers travel parameters across turns. If search requirements are incomplete (e.g. "Tìm vé đi Phú Quốc ngày mai"), Neo prompts for clarifications while holding the other fields.
5. **Instant Main-App Integration:** Clicking on any flight/train option or tapping "Tìm vé chuyến đi ngay 💎" instantly syncs the settings, switches the main app view, and updates the query.
5. **Rich Markdown Parsing:** Unlike generic chat widgets, Neo's answers are rendered as beautiful, responsive semantic documents with proportional headers and highlights.
6. **Dynamic Full Screen Mode:** Deep research deserves space. Toggle the full-screen mode icon in the assistant's header to transform the floating chat bubble into an immersive, focused workspace.
7. **Smart Quick Recommendations:** Interactive prompt chips above the chat box help kickstart flight/train search queries with a single tap.
8. **Security Safeguards against Injection:** Robust safeguards protect backend instructions from prompt injection, system-leak attacks, and unsafe content requests.

---

## 🗺️ How to Use the Neo AI Assistant

### Step 1: Launch the Assistant
Look for the floating blue star bubble styled in our modern theme at the **bottom-right corner** of any screen.
* Click the **"Tư vấn AI Neo"** badge to slide up the interactive chat panel.

### Step 2: Query Natural Search Flows (The Happy & Low-Confidence Paths)
Neo will greet you with a welcoming intro!
* Type any custom Vietnamese sentence containing travel goals—for example:
  > *"Tìm giúp mình 2 vé máy bay từ Hà Nội đi Phú Quốc vào tuần sau"*
* Hit **Enter** or tap the **Send** icon to watch Neo analyze the text, extract search parameters, and display your interactive trip widget!
* If you query with incomplete details (e.g. *"Cần tìm vé tàu đi Đà Nẵng"*), Neo will ask clarifying context (*"Bạn đi từ đâu và ngày nào ạ?"*) while presenting the widget with blank states so you can select them directly in the UI!

### Step 3: Correct or Refine on the Slide (The Correction Path)
You don't need to re-type or cancel!
* Change departure cities, arrival cities, passenger numbers, or calendar dates directly on the inline search card.
* Changes sync immediately with the app's global state and live search filters.

### Step 4: Execute on the Main Page
* Tap **"TÌM VÉ CHUYẾN ĐI NGAY 💎"** to instantly render the corresponding results (Volar Flights or Express Rails) on the background page!

### Step 5: Expand to Immersive Fullscreen (Highly Recommended!)
Planning a long vacation requires maximum legibility.
* Click the **Maximize** (`Maximize2`) icon in the top right of the Chat Header to take Neo into full screen. Click the **Minimize** (`Minimize2`) icon anytime to return to standard floating layout.

### Step 6: Interact via Quick-Topic Chips
Speed up your navigation by clicking on the dynamic quick-suggestions:
* `Tìm 2 vé máy bay HN đi Phú Quốc cuối tuần này`
* `Đặt vé tàu hỏa từ Sài Gòn đi Nha Trang 10/6`
* `Tìm vé đi Đà Nẵng ngày mai`
* `Tìm chuyến bay TP.HCM đi Đà Lạt`

---

## 🛠️ Tech Stack & Architecture

- **Frontend:** React 18, Vite, Tailwind CSS, Lucide React (vector assets), and `motion` (layout transitions).
- **Markdown Processing:** Powered by `react-markdown` with strict typography configurations (proportional spacing, high-contrast dark-blue headings, and wavy highlighted structures).
- **Backend Proxy & AI Core:** Express Node.js framework utilizing the modern `@google/genai` TypeScript SDK to securely communicate with Gemini models.
- **State Engine:** Persistent context tracking with localized virtual checkout validation for hotels, flights, and packages.

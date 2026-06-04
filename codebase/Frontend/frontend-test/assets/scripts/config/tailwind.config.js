tailwind.config = {
  theme: {
    extend: {
      colors: {
        background: "#f8f9fb",
        surface: "#ffffff",
        "surface-low": "#f2f4f6",
        "surface-high": "#e7e8ea",
        primary: "#0058be",
        "primary-container": "#0570ec",
        secondary: "#485f86",
        "secondary-container": "#bbd2ff",
        text: "#191c1e",
        muted: "#414754",
        outline: "#c1c6d7",
        success: "#12B76A",
        warning: "#F79009",
        error: "#F04438"
      },
      fontFamily: {
        inter: ["Inter", "sans-serif"]
      },
      boxShadow: {
        ambient: "0 4px 12px rgba(15, 41, 77, 0.05)",
        floating: "0 12px 24px rgba(15, 41, 77, 0.12)"
      }
    }
  }
};


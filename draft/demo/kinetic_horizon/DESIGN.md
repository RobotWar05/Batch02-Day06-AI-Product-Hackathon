---
name: Kinetic Horizon
colors:
  surface: '#f8f9fb'
  surface-dim: '#d9dadc'
  surface-bright: '#f8f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#edeef0'
  surface-container-high: '#e7e8ea'
  surface-container-highest: '#e1e2e4'
  on-surface: '#191c1e'
  on-surface-variant: '#414754'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f3'
  outline: '#727786'
  outline-variant: '#c1c6d7'
  surface-tint: '#005ac2'
  primary: '#0058be'
  on-primary: '#ffffff'
  primary-container: '#0570ec'
  on-primary-container: '#fefcff'
  inverse-primary: '#aec6ff'
  secondary: '#485f86'
  on-secondary: '#ffffff'
  secondary-container: '#bbd2ff'
  on-secondary-container: '#435a81'
  tertiary: '#004ae7'
  on-tertiary: '#ffffff'
  tertiary-container: '#3666ff'
  on-tertiary-container: '#fffbff'
  error: '#F04438'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#aec6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#d6e3ff'
  secondary-fixed-dim: '#b0c7f4'
  on-secondary-fixed: '#001b3d'
  on-secondary-fixed-variant: '#30476d'
  tertiary-fixed: '#dce1ff'
  tertiary-fixed-dim: '#b7c4ff'
  on-tertiary-fixed: '#001552'
  on-tertiary-fixed-variant: '#0038b6'
  background: '#f8f9fb'
  on-background: '#191c1e'
  surface-variant: '#e1e2e4'
  success: '#12B76A'
  warning: '#F79009'
  slate-text: '#455873'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md-mobile:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-margin-desktop: 32px
  container-margin-mobile: 16px
  gutter: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
---

## Brand & Style

The design system is engineered for a high-performance AI travel assistant that balances the clinical efficiency of a search engine with the approachability of a personal concierge. It targets frequent travelers who value speed, accuracy, and clarity.

The visual style is **Corporate Modern with Tactile Elements**. It utilizes a card-based architecture to organize complex travel data (flights, hotels, itineraries) into digestible units. The interface leans heavily into a "Soft Tech" aesthetic—incorporating generous whitespace, refined typography, and subtle depth cues to ensure the user feels guided rather than overwhelmed by information.

## Colors

The palette is anchored by a high-frequency blue, optimized for digital interfaces. 

- **Primary Blue (#287DFA):** Used for primary actions, active states, and AI identity markers.
- **Deep Navy (#0F294D):** Reserved for primary headings and critical navigation elements to provide grounding and authority.
- **Neutral Surface (#F7F8FA):** The foundation for all background layers, providing a soft, low-strain canvas for white cards to sit upon.
- **Semantic Accents:** Success and Warning colors are used sparingly for status indicators (e.g., "Flight Confirmed" or "Price Change").

## Typography

This design system utilizes **Inter** for its neutral, highly legible characteristics and excellent performance at small sizes (essential for ticket details).

- **Headlines:** Use tighter letter spacing and Semi-Bold/Bold weights to create a strong hierarchy against body text.
- **Body Text:** Uses a 1.5x line height ratio to ensure readability during long-form AI responses.
- **Labels:** Small labels use a medium weight and slight tracking increase to maintain legibility on denser cards and metadata tags.

## Layout & Spacing

The layout follows a **Fluid-Fixed Hybrid** model. While the container adapts to the screen width, content modules (cards) observe a 12-column grid on desktop and a single-column stack on mobile.

- **Vertical Rhythm:** A strict 4px baseline grid ensures alignment across varied components like chat bubbles and data tables.
- **Safe Zones:** Mobile views implement a 16px horizontal margin. Desktop views expand to 32px or center-align at a 1200px max-width.
- **AI Chat Thread:** The central chat column is capped at 800px on desktop to prevent excessive line lengths, maintaining a focused "assistant" experience.

## Elevation & Depth

This design system uses a **Tonal Layering** approach combined with **Ambient Shadows** to define the z-axis.

1.  **Level 0 (Base):** Neutral background (`#F7F8FA`).
2.  **Level 1 (Cards/Bubbles):** Pure white surfaces (`#FFFFFF`) with a subtle 1px border (`#E4E7EC`) and a soft, diffused shadow: `0px 4px 12px rgba(15, 41, 77, 0.05)`.
3.  **Level 2 (Active/Floating):** Bottom sheets and Toast notifications use a more pronounced shadow: `0px 12px 24px rgba(15, 41, 77, 0.12)` to signal immediate priority.

Interactive elements (like result cards) should lift slightly on hover, increasing shadow spread and reducing Y-offset.

## Shapes

The shape language is "Friendly Professional." 

- **Standard Cards:** Use a **16px (1rem)** radius (`rounded-lg`) to feel modern and accessible.
- **Chat Bubbles:** AI bubbles follow the standard 16px, but user bubbles utilize a larger **24px (1.5rem)** radius (`rounded-xl`) for a softer, distinct appearance.
- **Interactive Elements:** Buttons and input fields use a **8px (0.5rem)** radius to maintain a sense of precision and utility.

## Components

### Chat Interaction
- **AI Bubbles:** Left-aligned, white background, subtle border. Icons for "Copy" or "Regenerate" appear on hover.
- **User Bubbles:** Right-aligned, primary blue background, white text. No border.
- **Suggestion Chips:** Horizontal scrolling list of pills. White background, primary blue border, 32px height.

### Trip & Result Cards
- **Trip Widget:** A master card containing trip overview (Dates, Destination). Features a distinct "Edit" icon in the top right using a 32px circular ghost button.
- **Transport Cards:** High-density layout. Airline logo (left), times/duration (center), price/CTA (right). Use divider lines (`#F2F4F7`) to separate segments within a single card.

### UI Feedback
- **Bottom Sheets:** Mobile-only. Smooth slide-up transition. Includes a 40x4px handle at the top.
- **Loading States:** Use "Skeleton" shimmer effects on cards rather than spinners to maintain the layout structure while data fetches.
- **Input Field:** Features a trailing "Send" icon (Primary Blue) and a leading "Plus" icon for attachments (Deep Navy).
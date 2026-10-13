/**
 * ELKYNO Enterprise Design System Tokens
 * Brand Positioning: «Web | Apps | Technology Solutions»
 * Style Direction: Quiet Enterprise Technology (70% Neutral / 20% Deep Navy / 10% Blue-Cyan Accent)
 */

export const ELKYNO_TOKENS = {
  // Brand Colors
  colors: {
    // Deep Technology Navy
    brandNavyDarkest: '#0B1728', // Sidebar, dark sections, primary navigation
    brandNavyDark: '#101D30',    // Secondary dark container, header panels
    brandNavyMedium: '#15263A',  // Navy borders, dark card backgrounds

    // Electric Technology Blue
    brandBlue: '#009FE3',        // Primary action, active navigation, key links
    brandBlueHover: '#0087C2',   // Hover state for primary action
    brandBlueLight: '#EBF7FC',   // 5% tint for selection / active tabs
    brandBlueFocus: '#00A8F0',   // Focus rings

    // Secondary Cyan / Teal (Used sparingly for positive highlights / technical accents)
    brandCyan: '#00D5C8',
    brandCyanHover: '#18D8C5',
    brandCyanLight: '#E6FAF8',

    // Neutrals
    bgMain: '#F5F7FA',           // Page background
    surface: '#FFFFFF',          // Card & container surface
    surfaceMuted: '#EEF2F6',     // Table headers, secondary input backgrounds
    border: '#E4E8EE',           // Default enterprise border
    borderSubtle: '#EDF1F5',     // Subtle dividers

    // Typography
    textPrimary: '#172033',      // Primary heading and body
    textSecondary: '#667085',    // Secondary descriptions, column headers
    textMuted: '#98A2B3',        // Captions, timestamps, disabled text
    textInverted: '#FFFFFF',

    // Semantic States (Preserved standard meanings)
    success: '#027A48',
    successBg: '#ECFDF3',
    successBorder: '#ABEFC6',

    warning: '#B54708',
    warningBg: '#FFFAEB',
    warningBorder: '#FEDF89',

    danger: '#B42318',
    dangerBg: '#FEF3F2',
    dangerBorder: '#FECDCA',

    info: '#026AA2',
    infoBg: '#F0F9FF',
    infoBorder: '#B9E6FE',
  },

  // Component Border Radius (Strict 6px - 10px discipline)
  radii: {
    button: 'rounded-[6px]',
    input: 'rounded-[6px]',
    badge: 'rounded-[4px]',
    card: 'rounded-[8px]',
    table: 'rounded-[8px]',
    modal: 'rounded-[10px]',
    dropdown: 'rounded-[8px]',
  },

  // Enterprise Shadows (prefer border > shadow)
  shadows: {
    subtle: 'shadow-[0_1px_2px_rgba(16,24,40,0.05)]',
    dropdown: 'shadow-[0_4px_16px_rgba(11,23,40,0.12)]',
    modal: 'shadow-[0_12px_32px_rgba(11,23,40,0.18)]',
  },
} as const;

export default ELKYNO_TOKENS;

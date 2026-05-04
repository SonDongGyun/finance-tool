// Single source of truth for CSS color tokens used across components.
// PPTX/PDF exports keep their own hex constants because those formats use
// '#'-less hex and target print-style accuracy that may diverge from screen.

export const COLORS = {
  // Text
  text: '#e2e8f0',
  textHigh: '#ffffff',
  sub: '#94a3b8',
  dim: '#64748b',
  mute: '#cbd5e1',

  // Brand
  blue: '#60a5fa',
  blueAccent: '#3b82f6',
  blueDeep: '#2563eb',
  cyan: '#22d3ee',
  purple: '#a78bfa',
  purpleAccent: '#8b5cf6',

  // Semantic / status
  red: '#f87171',
  redAccent: '#ef4444',
  green: '#34d399',
  greenAccent: '#10b981',
  orange: '#fb923c',
  orangeAccent: '#f97316',
  yellow: '#fbbf24',

  // Surface
  cardBg: 'rgba(30,41,59,0.6)',
  cardBgLight: 'rgba(51,65,85,0.4)',
  surface: 'rgba(15,23,42,0.6)',
  surfaceDeep: 'rgba(15,23,42,0.8)',
  surfaceMid: 'rgba(30,41,59,0.8)',
  surfaceFloat: 'rgba(30,41,59,0.95)',
  panel: 'rgba(15,23,42,0.5)',

  // Border
  border: 'rgba(100,116,139,0.3)',
  borderLight: 'rgba(100,116,139,0.2)',
  borderSlate: 'rgba(51,65,85,0.5)',
  borderSlateDim: 'rgba(51,65,85,0.3)',
  borderRow: 'rgba(30,41,59,0.5)',
};

// Status comparison colors — used by SummaryCards, AnalysisSummary,
// DetailTable, VendorTable. Centralized so a status-color tweak hits one place.
export const STATUS_COLORS = {
  new:        { fg: '#60a5fa', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)', soft: 'rgba(59,130,246,0.08)', softBorder: 'rgba(59,130,246,0.2)' },
  removed:    { fg: '#fb923c', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)', soft: 'rgba(249,115,22,0.08)', softBorder: 'rgba(249,115,22,0.2)' },
  increased:  { fg: '#f87171', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  soft: 'rgba(239,68,68,0.08)',  softBorder: 'rgba(239,68,68,0.2)' },
  decreased:  { fg: '#34d399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', soft: 'rgba(16,185,129,0.08)', softBorder: 'rgba(16,185,129,0.2)' },
  unchanged:  { fg: '#94a3b8', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.3)', soft: 'rgba(148,163,184,0.08)', softBorder: 'rgba(148,163,184,0.2)' },
};

// Gradients — most cards/buttons use the same primary 135° pair; collecting
// them here lets us evolve the visual language in one place.
export const GRADIENTS = {
  primary:        'linear-gradient(135deg, #3b82f6, #8b5cf6)',
  primaryReverse: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
  cool:           'linear-gradient(135deg, #3b82f6, #06b6d4)',
  vivid:          'linear-gradient(135deg, #8b5cf6, #ec4899)',
  warm:           'linear-gradient(135deg, #f59e0b, #ef4444)',
  warmReverse:    'linear-gradient(135deg, #ef4444, #f97316)',
  success:        'linear-gradient(135deg, #10b981, #14b8a6)',
  blueDeep:       'linear-gradient(135deg, #3b82f6, #2563eb)',
  slate:          'linear-gradient(135deg, #64748b, #475569)',
  primarySoft:    'linear-gradient(135deg, rgba(59,130,246,0.35), rgba(139,92,246,0.35))',
};

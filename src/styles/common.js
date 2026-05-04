import { COLORS, GRADIENTS } from '../constants/colors';

// Default frosted card frame: pair with className="glass" or "glass-light".
// Components compose it with extra props (textAlign, maxWidth) when needed.
export const cardStyle = {
  borderRadius: '16px',
  padding: '32px',
};

export const selectStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '8px',
  background: COLORS.surfaceMid,
  border: `1px solid ${COLORS.border}`,
  fontSize: '14px',
  color: COLORS.text,
  outline: 'none',
  cursor: 'pointer',
  appearance: 'none',
};

export const labelStyle = {
  display: 'block',
  fontSize: '13px',
  color: COLORS.sub,
  marginBottom: '6px',
  fontWeight: 500,
};

export const thStyle = {
  textAlign: 'left',
  padding: '14px 16px',
  fontSize: '12px',
  fontWeight: 700,
  color: COLORS.sub,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  whiteSpace: 'nowrap',
  userSelect: 'none',
};

export const tdStyle = {
  padding: '14px 16px',
  fontSize: '14px',
};

export const sectionTitleStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  fontSize: '18px',
  fontWeight: 700,
  color: COLORS.text,
};

export function btnPrimary(enabled) {
  return {
    width: '100%',
    padding: '12px',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: 600,
    border: 'none',
    cursor: enabled ? 'pointer' : 'not-allowed',
    background: enabled ? GRADIENTS.primaryReverse : COLORS.cardBgLight,
    color: enabled ? COLORS.textHigh : COLORS.dim,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  };
}

export const btnSecondary = {
  padding: '8px 16px',
  borderRadius: '8px',
  fontSize: '13px',
  fontWeight: 600,
  border: `1px solid ${COLORS.borderLight}`,
  background: 'rgba(15,23,42,0.4)',
  color: COLORS.sub,
  cursor: 'pointer',
};

// Pagination / list-action button (used by AnalysisSummary, VendorTable).
export const listBtnStyle = {
  padding: '10px 16px',
  borderRadius: '8px',
  fontSize: '13px',
  fontWeight: 600,
  flex: 1,
  background: 'rgba(100,116,139,0.1)',
  color: COLORS.sub,
  border: '1px solid rgba(100,116,139,0.15)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
};

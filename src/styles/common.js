import { COLORS } from '../constants/colors';

export const selectStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '8px',
  background: 'rgba(30,41,59,0.8)',
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
    background: enabled
      ? 'linear-gradient(135deg, #8b5cf6, #3b82f6)'
      : COLORS.cardBgLight,
    color: enabled ? 'white' : COLORS.dim,
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
  border: `1px solid rgba(100,116,139,0.2)`,
  background: 'rgba(15,23,42,0.4)',
  color: COLORS.sub,
  cursor: 'pointer',
};

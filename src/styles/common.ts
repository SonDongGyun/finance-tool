import type { CSSProperties } from 'react';
import { COLORS, GRADIENTS } from '../constants/colors';

// Default frosted card frame: pair with className="glass" or "glass-light".
// Components compose it with extra props (textAlign, maxWidth) when needed.
export const cardStyle: CSSProperties = {
  borderRadius: '16px',
  padding: '32px',
};

export const selectStyle: CSSProperties = {
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

export const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: '13px',
  color: COLORS.sub,
  marginBottom: '6px',
  fontWeight: 500,
};

// thStyle / tdStyle / listBtnStyle were unused here — moved to styles/table.ts
// as functions (size/align variants). Import from there directly.

export const sectionTitleStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  fontSize: '18px',
  fontWeight: 700,
  color: COLORS.text,
};

export function btnPrimary(enabled: boolean): CSSProperties {
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

export const btnSecondary: CSSProperties = {
  padding: '8px 16px',
  borderRadius: '8px',
  fontSize: '13px',
  fontWeight: 600,
  border: `1px solid ${COLORS.borderLight}`,
  background: 'rgba(15,23,42,0.4)',
  color: COLORS.sub,
  cursor: 'pointer',
};

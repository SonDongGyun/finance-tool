import { motion } from 'framer-motion';
import { Calendar, Layers, ArrowRight } from 'lucide-react';
import { MODE_MONTHLY, MODE_SHEET } from '../constants/steps';
import { useWindowSize } from '../hooks/useWindowSize';

export default function LandingPage({ onSelectMode }) {
  const { isMobile } = useWindowSize();

  const modes = [
    {
      key: MODE_MONTHLY,
      icon: <Calendar style={{ width: '32px', height: '32px' }} />,
      title: '월별 비교',
      desc: '한 시트 내의 월 또는 기간을 비교합니다. 단일 시트 파일이거나 월 단위 증감이 관심이라면 선택하세요.',
      example: '예) 2025년 3월 vs 2025년 4월',
      gradient: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
      shadow: '0 8px 24px rgba(59,130,246,0.25)',
    },
    {
      key: MODE_SHEET,
      icon: <Layers style={{ width: '32px', height: '32px' }} />,
      title: '시트별 비교',
      desc: '시트마다 다른 연도의 데이터를 담은 파일을 업로드해 연도 간 비교를 수행합니다. 비교할 월은 체크박스로 직접 선택합니다.',
      example: '예) 2025년 1~2월 vs 2026년 1~2월',
      gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
      shadow: '0 8px 24px rgba(245,158,11,0.25)',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        maxWidth: '960px',
        marginLeft: 'auto',
        marginRight: 'auto',
        marginTop: isMobile ? '24px' : '40px',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: isMobile ? '24px' : '32px' }}>
        <h2 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 700, color: '#e2e8f0', marginBottom: '10px' }}>
          어떤 방식으로 비교할까요?
        </h2>
        <p style={{ fontSize: isMobile ? '13px' : '14px', color: '#94a3b8' }}>
          파일 형식에 맞는 비교 모드를 선택해주세요.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: isMobile ? '16px' : '24px',
        }}
      >
        {modes.map((m, i) => (
          <motion.button
            key={m.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
            whileHover={isMobile ? {} : { y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectMode(m.key)}
            className="glass"
            style={{
              borderRadius: '20px',
              padding: isMobile ? '24px 20px' : '32px 28px',
              textAlign: 'left',
              border: 'none',
              cursor: 'pointer',
              color: '#e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: m.gradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                boxShadow: m.shadow,
              }}
            >
              {m.icon}
            </div>

            <div>
              <h3 style={{ fontSize: isMobile ? '17px' : '19px', fontWeight: 700, color: '#e2e8f0', marginBottom: '6px' }}>
                {m.title}
              </h3>
              <p style={{ fontSize: isMobile ? '13px' : '14px', color: '#94a3b8', lineHeight: 1.7 }}>
                {m.desc}
              </p>
            </div>

            <div
              style={{
                marginTop: 'auto',
                paddingTop: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid rgba(100,116,139,0.2)',
              }}
            >
              <span style={{ fontSize: '12px', color: '#64748b' }}>{m.example}</span>
              <ArrowRight style={{ width: '18px', height: '18px', color: '#a78bfa' }} />
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

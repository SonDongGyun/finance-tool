import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileDown, FileText, Presentation, Loader2 } from 'lucide-react';

export default function ExportButtons({ result }) {
  const [loading, setLoading] = useState(null);

  const handlePdf = async () => {
    setLoading('pdf');
    try {
      const { exportPdf } = await import('../utils/exportPdf');
      exportPdf(result);
    } catch (err) {
      console.error('PDF export failed:', err);
    }
    setLoading(null);
  };

  const handlePptx = async () => {
    setLoading('pptx');
    try {
      const { exportPptx } = await import('../utils/exportPptx');
      exportPptx(result);
    } catch (err) {
      console.error('PPTX export failed:', err);
    }
    setLoading(null);
  };

  const btnStyle = (color, hoverColor) => ({
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 20px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    color: 'white',
    background: color,
    transition: 'background 0.2s',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      style={{ marginTop: '32px' }}
    >
      <div className="glass" style={{
        borderRadius: '16px', padding: '24px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileDown style={{ width: '20px', height: '20px', color: '#60a5fa' }} />
          <span style={{ fontSize: '16px', fontWeight: 600, color: '#e2e8f0' }}>분석 결과 내보내기</span>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handlePdf}
            disabled={loading === 'pdf'}
            style={btnStyle('#dc2626')}
          >
            {loading === 'pdf'
              ? <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
              : <FileText style={{ width: '16px', height: '16px' }} />
            }
            PDF 다운로드
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handlePptx}
            disabled={loading === 'pptx'}
            style={btnStyle('#c2410c')}
          >
            {loading === 'pptx'
              ? <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
              : <Presentation style={{ width: '16px', height: '16px' }} />
            }
            PPTX 다운로드
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileDown, FileText, Presentation, Loader2 } from 'lucide-react';

export default function ExportButtons({ result }) {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handlePdf = async () => {
    setLoading('pdf');
    setError(null);
    try {
      const { exportPdf } = await import('../utils/exportPdf');
      await exportPdf(result);
    } catch (err) {
      console.error('PDF export failed:', err);
      setError('PDF 내보내기에 실패했습니다. 다시 시도해주세요.');
    }
    setLoading(null);
  };

  const handlePptx = async () => {
    setLoading('pptx');
    setError(null);
    try {
      const { exportPptx } = await import('../utils/exportPptx');
      await exportPptx(result);
    } catch (err) {
      console.error('PPTX export failed:', err);
      setError('PPTX 내보내기에 실패했습니다. 다시 시도해주세요.');
    }
    setLoading(null);
  };

  const btnStyle = {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 500,
    border: '1px solid rgba(100,116,139,0.3)',
    cursor: 'pointer',
    color: '#94a3b8',
    background: 'rgba(30,41,59,0.5)',
    transition: 'all 0.2s',
  };

  return (
    <div style={{ marginTop: '24px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        gap: '10px',
      }}>
        <span style={{ fontSize: '12px', color: '#64748b', marginRight: '4px' }}>
          <FileDown style={{ width: '13px', height: '13px', display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
          내보내기
        </span>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handlePdf}
          disabled={loading === 'pdf'}
          style={btnStyle}
        >
          {loading === 'pdf'
            ? <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />
            : <FileText style={{ width: '14px', height: '14px' }} />
          }
          PDF
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handlePptx}
          disabled={loading === 'pptx'}
          style={btnStyle}
        >
          {loading === 'pptx'
            ? <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />
            : <Presentation style={{ width: '14px', height: '14px' }} />
          }
          PPTX
        </motion.button>
      </div>

      {error && (
        <p style={{
          fontSize: '13px', color: '#f87171',
          marginTop: '8px', textAlign: 'right',
        }}>
          {error}
        </p>
      )}
    </div>
  );
}

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useWindowSize } from '../hooks/useWindowSize';

export default function FileUpload({ onFileLoaded, isLoaded }) {
  const { isMobile } = useWindowSize();
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');

  const handleFile = useCallback(async (file) => {
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      setError('엑셀 파일(.xlsx, .xls) 또는 CSV 파일만 업로드 가능합니다.');
      return;
    }

    setIsLoading(true);
    setError('');
    setFileName(file.name);

    try {
      await onFileLoaded(file);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [onFileLoaded]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      style={{
        position: 'relative', zIndex: 10,
        maxWidth: '720px',
        margin: '0 auto',
      }}
    >
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isLoaded && document.getElementById('file-input').click()}
        className={
          isDragging
            ? 'glass'
            : isLoaded
              ? 'glass'
              : 'glass upload-pulse'
        }
        style={{
          borderRadius: '20px',
          padding: isMobile ? '36px 20px' : '56px 40px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.5s ease-out',
          border: isDragging
            ? '2px solid #60a5fa'
            : isLoaded
              ? '1px solid rgba(16,185,129,0.3)'
              : '2px dashed rgba(100,116,139,0.3)',
        }}
      >
        <input
          id="file-input"
          type="file"
          accept=".xlsx,.xls,.csv"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files[0])}
        />

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 style={{ width: '48px', height: '48px', color: '#60a5fa' }} />
              </motion.div>
              <p style={{ color: '#cbd5e1', fontWeight: 500, fontSize: '16px' }}>파일 분석 중...</p>
              <p style={{ fontSize: '14px', color: '#64748b' }}>{fileName}</p>
            </motion.div>
          ) : isLoaded ? (
            <motion.div
              key="loaded"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 10 }}
              >
                <CheckCircle2 style={{ width: '48px', height: '48px', color: '#34d399' }} />
              </motion.div>
              <div>
                <p style={{ color: '#6ee7b7', fontWeight: 500, fontSize: '16px' }}>파일 로드 완료</p>
                <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <FileSpreadsheet style={{ width: '16px', height: '16px' }} />
                  {fileName}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  document.getElementById('file-input').click();
                }}
                style={{
                  marginTop: '8px', padding: '8px 16px', borderRadius: '8px',
                  fontSize: '14px', background: 'rgba(51,65,85,0.5)', color: '#cbd5e1',
                  border: 'none', cursor: 'pointer',
                }}
              >
                다른 파일 업로드
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Upload style={{ width: isMobile ? '44px' : '56px', height: isMobile ? '44px' : '56px', color: '#60a5fa' }} />
              </motion.div>
              <div>
                <p style={{ fontSize: isMobile ? '16px' : '20px', fontWeight: 600, color: '#e2e8f0' }}>
                  재무 데이터 엑셀 파일을 업로드하세요
                </p>
                <p style={{ fontSize: isMobile ? '13px' : '15px', color: '#94a3b8', marginTop: '12px' }}>
                  {isMobile ? '클릭하여 파일 선택 (.xlsx, .xls, .csv)' : '드래그 앤 드롭 또는 클릭하여 파일 선택 (.xlsx, .xls, .csv)'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                marginTop: '20px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '8px', color: '#f87171', fontSize: '14px',
              }}
            >
              <AlertCircle style={{ width: '16px', height: '16px' }} />
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

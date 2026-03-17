import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function FileUpload({ onFileLoaded, isLoaded }) {
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
      className="relative z-10 max-w-3xl mx-auto px-6"
    >
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isLoaded && document.getElementById('file-input').click()}
        className={`
          relative rounded-2xl p-10 text-center cursor-pointer
          transition-all duration-500 ease-out
          ${isDragging
            ? 'glass border-2 border-blue-400 scale-[1.02] shadow-lg shadow-blue-500/20'
            : isLoaded
              ? 'glass border border-emerald-500/30'
              : 'glass border-2 border-dashed border-slate-500/30 upload-pulse hover:border-blue-400/50 hover:shadow-lg hover:shadow-blue-500/10'
          }
        `}
      >
        <input
          id="file-input"
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center gap-4"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 className="w-12 h-12 text-blue-400" />
              </motion.div>
              <p className="text-slate-300 font-medium">파일 분석 중...</p>
              <p className="text-sm text-slate-500">{fileName}</p>
            </motion.div>
          ) : isLoaded ? (
            <motion.div
              key="loaded"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center gap-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 10 }}
              >
                <CheckCircle2 className="w-12 h-12 text-emerald-400" />
              </motion.div>
              <div>
                <p className="text-emerald-300 font-medium">파일 로드 완료</p>
                <p className="text-sm text-slate-400 mt-1 flex items-center justify-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  {fileName}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  document.getElementById('file-input').click();
                }}
                className="mt-2 px-4 py-2 rounded-lg text-sm bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 transition-colors"
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
              className="flex flex-col items-center gap-4"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Upload className="w-12 h-12 text-blue-400" />
              </motion.div>
              <div>
                <p className="text-lg font-medium text-slate-200">
                  재무 데이터 엑셀 파일을 업로드하세요
                </p>
                <p className="text-sm text-slate-400 mt-2">
                  드래그 앤 드롭 또는 클릭하여 파일 선택 (.xlsx, .xls, .csv)
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
              className="mt-4 flex items-center justify-center gap-2 text-red-400 text-sm"
            >
              <AlertCircle className="w-4 h-4" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

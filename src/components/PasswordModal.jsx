import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Loader2, X } from 'lucide-react';

export default function PasswordModal({ isOpen, onSubmit, onClose, error, isLoading }) {
  const [password, setPassword] = useState('');
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!isLoading) {
      submittingRef.current = false;
    }
  }, [isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    if (password.trim()) {
      submittingRef.current = true;
      onSubmit(password);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="glass"
          style={{
            borderRadius: '20px', padding: '36px',
            width: '100%', maxWidth: '420px',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Lock style={{ width: '22px', height: '22px', color: 'white' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>
                  암호가 설정된 파일
                </h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                  파일 열기 암호를 입력해주세요
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#64748b', padding: '4px',
              }}
            >
              <X style={{ width: '20px', height: '20px' }} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="암호 입력"
              autoFocus
              style={{
                width: '100%', padding: '14px 16px',
                borderRadius: '10px',
                background: 'rgba(15,23,42,0.8)',
                border: error ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(100,116,139,0.3)',
                color: '#e2e8f0', fontSize: '15px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />

            {error && (
              <p style={{ fontSize: '13px', color: '#f87171', marginTop: '10px' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              style={{
                marginTop: '20px', width: '100%', padding: '14px',
                borderRadius: '10px', fontSize: '15px', fontWeight: 600,
                border: 'none', cursor: isLoading ? 'wait' : 'pointer',
                background: password.trim()
                  ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
                  : 'rgba(51,65,85,0.4)',
                color: password.trim() ? 'white' : '#64748b',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 style={{ width: '18px', height: '18px', animation: 'spin 1s linear infinite' }} />
                  복호화 중...
                </>
              ) : '암호 확인 및 파일 열기'}
            </button>
          </form>

          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '16px', textAlign: 'center' }}>
            암호는 서버에 저장되지 않습니다
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

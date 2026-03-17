import { motion } from 'framer-motion';
import { BarChart3, Sparkles } from 'lucide-react';

export default function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="relative z-10 py-8 px-6"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.6 }}
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25"
          >
            <BarChart3 className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="gradient-text">다비치 재무팀 분석 툴</span>
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">Financial Analysis System</p>
          </div>
        </div>
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex items-center gap-2 text-sm text-slate-400"
        >
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="hidden sm:inline">월별 비용 증감 분석</span>
        </motion.div>
      </div>
    </motion.header>
  );
}

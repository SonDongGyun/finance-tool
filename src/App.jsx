import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import ColumnMapper from './components/ColumnMapper';
import MonthSelector from './components/MonthSelector';
import SummaryCards from './components/SummaryCards';
import AnalysisCharts from './components/AnalysisCharts';
import DetailTable from './components/DetailTable';
import VendorTable from './components/VendorTable';
import { parseExcelFile, extractMonths, analyzeMonthlyChanges } from './utils/excelParser';
import './App.css';

function App() {
  const [step, setStep] = useState('upload'); // upload, mapping, select, result
  const [fileData, setFileData] = useState(null);
  const [columnConfig, setColumnConfig] = useState(null);
  const [months, setMonths] = useState([]);
  const [month1, setMonth1] = useState('');
  const [month2, setMonth2] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);

  const handleFileLoaded = useCallback(async (file) => {
    const parsed = await parseExcelFile(file);
    setFileData(parsed);
    setStep('mapping');
    setAnalysisResult(null);
  }, []);

  const handleColumnConfirm = useCallback((config) => {
    setColumnConfig(config);
    const monthList = extractMonths(fileData.rows, config.dateColumn);
    setMonths(monthList);

    if (monthList.length >= 2) {
      setMonth1(monthList[monthList.length - 2]);
      setMonth2(monthList[monthList.length - 1]);
    }

    setStep('select');
  }, [fileData]);

  const handleAnalyze = useCallback(() => {
    if (!month1 || !month2 || month1 === month2) return;

    const result = analyzeMonthlyChanges(fileData.rows, {
      ...columnConfig,
      month1,
      month2,
    });

    setAnalysisResult(result);
    setStep('result');
  }, [fileData, columnConfig, month1, month2]);

  const handleReset = useCallback(() => {
    setStep('select');
    setAnalysisResult(null);
  }, []);

  return (
    <div className="min-h-screen relative">
      <div className="bg-particles" />

      <Header />

      <main className="pb-16">
        <FileUpload
          onFileLoaded={handleFileLoaded}
          isLoaded={!!fileData}
        />

        <AnimatePresence mode="wait">
          {step === 'mapping' && fileData && (
            <motion.div
              key="mapping"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ColumnMapper
                headers={fileData.headers}
                onConfirm={handleColumnConfirm}
              />

              {/* Data preview */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="relative z-10 max-w-3xl mx-auto px-6 mt-6"
              >
                <div className="glass-light rounded-xl p-4">
                  <p className="text-sm text-slate-400 mb-3">
                    데이터 미리보기 (총 {fileData.totalRows}행)
                  </p>
                  <div className="overflow-x-auto text-xs">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-700/30">
                          {fileData.headers.slice(0, 8).map(h => (
                            <th key={h} className="py-2 px-3 text-left text-slate-400 font-medium whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {fileData.rows.slice(0, 5).map((row, i) => (
                          <tr key={i} className="border-b border-slate-800/20">
                            {fileData.headers.slice(0, 8).map(h => (
                              <td key={h} className="py-2 px-3 text-slate-300 whitespace-nowrap max-w-[150px] truncate">
                                {String(row[h] || '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {step === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <MonthSelector
                months={months}
                month1={month1}
                month2={month2}
                onMonth1Change={setMonth1}
                onMonth2Change={setMonth2}
                onAnalyze={handleAnalyze}
              />
            </motion.div>
          )}

          {step === 'result' && analysisResult && (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Back button */}
              <div className="relative z-10 max-w-7xl mx-auto px-6 mt-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleReset}
                  className="px-4 py-2 rounded-lg text-sm bg-slate-700/40 hover:bg-slate-600/40 text-slate-300 transition-colors"
                >
                  ← 다른 월 비교하기
                </motion.button>
              </div>

              <SummaryCards result={analysisResult} />
              <AnalysisCharts result={analysisResult} />
              <DetailTable result={analysisResult} />
              <VendorTable result={analysisResult} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 text-sm text-slate-500">
        <p>다비치 재무팀 분석 툴 &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

export default App;

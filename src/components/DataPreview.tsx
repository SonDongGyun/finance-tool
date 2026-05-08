import { motion } from 'framer-motion';
import type { ParsedFile } from '../types';

const PREVIEW_COLUMNS = 8;
const PREVIEW_ROWS = 5;

interface DataPreviewProps {
  file: ParsedFile;
}

// Read-only sample shown next to ColumnMapper so the user can sanity-check the
// detected columns against the actual data before confirming. Capped at the
// first 8 columns × 5 rows to keep the card compact even on wide sheets.
export default function DataPreview({ file }: DataPreviewProps) {
  const previewHeaders = file.headers.slice(0, PREVIEW_COLUMNS);
  const previewRows = file.rows.slice(0, PREVIEW_ROWS);
  const sheetCountLabel = (file.sheetNames?.length ?? 0) > 1
    ? ` · 시트 ${file.sheetNames.length}개`
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      style={{
        position: 'relative', zIndex: 10,
        maxWidth: '720px', marginLeft: 'auto', marginRight: 'auto',
        marginTop: '24px',
      }}
    >
      <div className="glass-light" style={{ borderRadius: '16px', padding: '20px' }}>
        <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '12px' }}>
          데이터 미리보기 (총 {file.totalRows}행{sheetCountLabel})
        </p>
        <div style={{ overflowX: 'auto', fontSize: '12px' }}>
          <table style={{ width: '100%' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(51,65,85,0.3)' }}>
                {previewHeaders.map(h => (
                  <th
                    key={h}
                    style={{
                      padding: '8px 12px', textAlign: 'left',
                      color: '#94a3b8', fontWeight: 500, whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, i) => (
                <tr
                  key={`preview-${i}-${String(row[file.headers[0]] ?? '')}`}
                  style={{ borderBottom: '1px solid rgba(15,23,42,0.2)' }}
                >
                  {previewHeaders.map(h => (
                    <td
                      key={h}
                      style={{
                        padding: '8px 12px', color: '#cbd5e1', whiteSpace: 'nowrap',
                        maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}
                    >
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
  );
}

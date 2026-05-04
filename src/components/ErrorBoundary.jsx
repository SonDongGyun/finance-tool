import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { GRADIENTS } from '../constants/colors';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 20px',
      }}>
        <div className="glass" style={{
          borderRadius: '16px', padding: '40px', maxWidth: '520px', textAlign: 'center',
        }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '14px',
            background: GRADIENTS.warmReverse,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '20px',
          }}>
            <AlertTriangle style={{ width: '28px', height: '28px', color: 'white' }} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#e2e8f0', marginBottom: '10px' }}>
            예기치 않은 오류가 발생했습니다
          </h2>
          <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '24px', lineHeight: 1.6 }}>
            화면을 다시 불러오거나, 문제가 지속되면 파일을 다시 업로드해 주세요.
          </p>
          {/* Internal error text only in dev — production users see the
              friendly heading above and the action buttons below, while the
              full trace stays in the console for debugging. */}
          {import.meta.env.DEV && this.state.error?.message && (
            <pre style={{
              fontSize: '12px', color: '#fca5a5', background: 'rgba(15,23,42,0.6)',
              padding: '12px', borderRadius: '8px', textAlign: 'left',
              overflowX: 'auto', marginBottom: '24px',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {this.state.error.message}
            </pre>
          )}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                background: 'rgba(51,65,85,0.6)', color: '#cbd5e1',
                border: '1px solid rgba(100,116,139,0.3)', cursor: 'pointer',
              }}
            >
              다시 시도
            </button>
            <button
              onClick={this.handleReload}
              style={{
                padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                background: GRADIENTS.primary, color: 'white',
                border: 'none', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: '6px',
              }}
            >
              <RefreshCw style={{ width: '14px', height: '14px' }} />
              페이지 새로고침
            </button>
          </div>
        </div>
      </div>
    );
  }
}

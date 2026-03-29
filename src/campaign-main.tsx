import { StrictMode, Component, ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import CampaignBuilder from '../parser-versions/campaign-builder'

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, background: '#0f172a', color: '#f87171', fontFamily: 'monospace', minHeight: '100vh' }}>
          <h2 style={{ color: '#fca5a5' }}>Campaign Builder Error</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{this.state.error.message}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 11, color: '#94a3b8', marginTop: 16 }}>{this.state.error.stack}</pre>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <CampaignBuilder />
    </ErrorBoundary>
  </StrictMode>
)

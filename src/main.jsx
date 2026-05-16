/**
 * ChainLens v2.0.0 — Entry Point
 * React 18 root with Error Boundary
 */
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

/** Error Boundary — prevents blank screen on runtime errors */
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: "100vh", background: "#050810", display: "flex",
          alignItems: "center", justifyContent: "center", flexDirection: "column",
          gap: 16, fontFamily: "'IBM Plex Mono', monospace", padding: 32,
        }}>
          <div style={{ fontSize: 32, opacity: 0.5 }}>⚠</div>
          <div style={{ color: "#ff3366", fontSize: 14, letterSpacing: "0.05em" }}>
            RUNTIME ERROR
          </div>
          <pre style={{
            color: "#4a6080", fontSize: 11, background: "#080d1a",
            padding: 16, borderRadius: 8, maxWidth: 600,
            overflow: "auto", border: "1px solid #0f2040",
          }}>
            {this.state.error.message}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "8px 20px", background: "transparent",
              border: "1px solid #1a3a60", borderRadius: 6,
              color: "#4a6080", cursor: "pointer", fontSize: 11,
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            RELOAD
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

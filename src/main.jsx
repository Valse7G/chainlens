import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) return (
      <div style={{ minHeight:"100vh", background:"#030912", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16, fontFamily:"monospace", padding:32 }}>
        <div style={{ fontSize:32 }}>⚠</div>
        <div style={{ color:"#ef4444", fontSize:14 }}>Erreur de rendu — ouvre la console (F12) pour les détails</div>
        <pre style={{ color:"#475569", fontSize:11, background:"#0f172a", padding:16, borderRadius:8, maxWidth:600, overflow:"auto" }}>
          {this.state.error.message}
        </pre>
      </div>
    );
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

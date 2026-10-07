import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { StoreProvider } from "./store/store.jsx";
import "./styles.css";

/** Last line of defense: a render error shows a way out instead of a blank page. Saved work is untouched. */
class ErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="main" style={{ paddingTop: 80 }}>
        <div className="head">
          <h1>Something went wrong on this screen.</h1>
          <p>Your saved projects are still in this browser. Reload to pick up where you left off.</p>
          <div className="row" style={{ marginTop: 16 }}>
            <button className="btn primary" onClick={() => window.location.reload()}>
              Reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}

createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <StoreProvider>
      <App />
    </StoreProvider>
  </ErrorBoundary>,
);

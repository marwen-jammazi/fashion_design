import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error(error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="login-page">
        <div className="apply-card">
          <h2>Something went wrong</h2>
          <p className="meta" style={{ margin: "8px 0 20px" }}>
            An unexpected error happened. Reloading the page usually fixes it.
          </p>
          <button className="btn" onClick={() => window.location.reload()}>
            Reload page
          </button>
        </div>
      </div>
    );
  }
}
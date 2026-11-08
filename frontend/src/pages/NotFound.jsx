import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="hero">
      <h1>404</h1>
      <p className="hero-sub">This page doesn't exist.</p>
      <Link to="/" className="btn">Back to home</Link>
    </section>
  );
}
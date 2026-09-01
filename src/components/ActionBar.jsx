// Sticky bottom toolbar (Reset / Step / Execute, Reset / Step Back / Auto Run / Step Fwd, …)
// matching the fixed dark control strip in the mockups. Purely presentational —
// pages pass in whatever buttons/controls belong on that page.
export default function ActionBar({ children }) {
  return <div className="action-bar">{children}</div>;
}

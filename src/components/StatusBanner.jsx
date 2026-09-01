export default function StatusBanner({ status }) {
  if (!status) return null;
  return <div className={`status-banner ${status.type}`}>{status.message}</div>;
}

import Icon from "./Icons";

export default function StatCard({ title, value, icon }) {
  return (
    <div className="stat-card">
      <div>
        <p>{title}</p>
        <h2>{value}</h2>
      </div>
      <div className="stat-icon"><Icon name={icon} size={20} /></div>
    </div>
  );
}

import Icon from "./Icons";

const MENU = [
  ["home", "Home"],
  ["cpu", "CPU Simulator"],
  ["alu", "ALU Simulator"],
  ["registers", "Registers"],
  ["memory", "Memory"],
  ["cache", "Cache Simulator"],
  ["instructions", "Instruction Execution"],
  ["performance", "Performance Analysis"],
  ["info", "About"]
];

export default function Sidebar({ activePage, setActivePage }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon"><Icon name="cpu" size={18} /></div>
        <div>
          <h2>Computer Architecture Simulator</h2>
          <p>Learn • Simulate • Understand</p>
        </div>
      </div>

      <nav className="nav">
        {MENU.map(([icon, name]) => (
          <button
            key={name}
            className={`nav-item ${activePage === name ? "active" : ""}`}
            onClick={() => setActivePage(name)}
          >
            <Icon name={icon} />
            <span>{name}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-avatar"><Icon name="info" size={18} /></div>
        <div>
          <p className="sidebar-user-name">ARCH-LAB</p>
          <p className="sidebar-user-role">Open Access — No Login</p>
        </div>
      </div>
    </aside>
  );
}

import Icon from "./Icons";

const MENU = [
  ["home", "Home"],
  ["alu", "ALU Simulator"],
  ["registers", "Registers"],
  ["memory", "Memory"],
  ["cache", "Cache Simulator"],
  ["instructions", "Instruction Execution"],
  ["documentation", "Documentation"],
  ["info", "About"]
];

export default function Sidebar({ activePage, setActivePage }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon"><Icon name="cpu" size={18} /></div>
        <div>
          <h2>ARCH-LAB</h2>
          <p>Learn • Simulate • Understand</p>
        </div>
      </div>

      <nav className="nav">
        {MENU.map(([icon, name]) => (
          <div key={name} className="nav-entry">
            {name === "Documentation" && <div className="nav-section-label">Resources</div>}
            <button
              className={`nav-item ${activePage === name ? "active" : ""}`}
              onClick={() => setActivePage(name)}
            >
              <Icon name={icon} />
              <span>{name}</span>
            </button>
          </div>
        ))}
      </nav>
    </aside>
  );
}

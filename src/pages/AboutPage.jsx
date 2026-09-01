import Icon from "../components/Icons";

function ChipHero() {
  // Decorative isometric-chip illustration — pure inline SVG, no image assets.
  return (
    <svg className="chip-hero" viewBox="0 0 760 300" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <defs>
        <radialGradient id="chipGlow" cx="50%" cy="45%" r="65%">
          <stop offset="0%" stopColor="#123047" />
          <stop offset="100%" stopColor="#050b14" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="760" height="300" fill="url(#chipGlow)" />

      {/* trace lines radiating from the die */}
      <g stroke="#2dd4bf" strokeWidth="1.4" opacity="0.55" fill="none">
        <path d="M380 70 L230 70 L170 110" />
        <path d="M380 70 L530 70 L590 110" />
        <path d="M260 150 L120 150 L80 130" />
        <path d="M260 150 L120 150 L80 175" />
        <path d="M500 150 L640 150 L680 130" />
        <path d="M500 150 L640 150 L680 175" />
      </g>
      <g stroke="#e2a53a" strokeWidth="1.4" opacity="0.55" fill="none">
        <path d="M300 220 L230 220 L170 190" />
        <path d="M300 220 L230 220 L170 250" />
        <path d="M460 220 L530 220 L590 190" />
        <path d="M460 220 L530 220 L590 250" />
      </g>
      <g fill="#2dd4bf" opacity="0.8">
        <circle cx="170" cy="110" r="2.5" /><circle cx="590" cy="110" r="2.5" />
        <circle cx="80" cy="130" r="2.5" /><circle cx="80" cy="175" r="2.5" />
        <circle cx="680" cy="130" r="2.5" /><circle cx="680" cy="175" r="2.5" />
      </g>
      <g fill="#e2a53a" opacity="0.8">
        <circle cx="170" cy="190" r="2.5" /><circle cx="170" cy="250" r="2.5" />
        <circle cx="590" cy="190" r="2.5" /><circle cx="590" cy="250" r="2.5" />
      </g>

      {/* isometric die */}
      <g transform="translate(380 150)">
        <polygon points="0,-95 165,-15 0,65 -165,-15" fill="#0e1c2c" stroke="#2dd4bf" strokeWidth="1.5" opacity="0.9" />
        <polygon points="0,-70 130,-10 0,50 -130,-10" fill="none" stroke="#2dd4bf" strokeWidth="1" opacity="0.4" />
        <polygon points="0,-40 70,-6 0,28 -70,-6" fill="#123047" stroke="#e2a53a" strokeWidth="1" opacity="0.7" />
        <g stroke="#2dd4bf" strokeWidth="1" opacity="0.5">
          <line x1="-165" y1="-15" x2="-130" y2="-10" />
          <line x1="165" y1="-15" x2="130" y2="-10" />
          <line x1="0" y1="-95" x2="0" y2="-70" />
          <line x1="0" y1="65" x2="0" y2="50" />
        </g>
      </g>
    </svg>
  );
}

export default function AboutPage() {
  return (
    <section className="about-page">
      <h1 className="about-title">About the Project</h1>
      <p className="about-intro">
        The Architecture Simulator is a high-fidelity educational tool designed to demystify the
        internal workings of modern processors. It provides a visual, interactive environment for
        exploring computer architecture concepts, from basic logic gates to complex pipelined
        execution.
      </p>

      <div className="about-hero panel">
        <ChipHero />
      </div>

      <div className="about-cards">
        <div className="panel about-card">
          <h3><Icon name="target" size={18} /> Objectives</h3>
          <ul className="about-list">
            <li>Visualize the complete Fetch-Decode-Execute cycle in real-time.</li>
            <li>Demonstrate the interaction between CPU registers, ALU, and Main Memory.</li>
            <li>Provide a clear understanding of cache hierarchy and hit/miss mechanics.</li>
            <li>Allow step-by-step execution of custom assembly instructions.</li>
          </ul>
        </div>

        <div className="panel about-card">
          <h3><Icon name="cap" size={18} /> Educational Purpose</h3>
          <p>
            Built for students and educators, this simulator bridges the gap between abstract
            textbook theory and practical hardware operation. By exposing the data paths and
            control signals, it transforms hidden hardware processes into observable phenomena,
            fostering deeper comprehension of architectural design principles.
          </p>
        </div>
      </div>

      <div className="panel about-card about-card-wide">
        <h3><Icon name="cpu" size={18} /> Tech Stack</h3>
        <p>
          React + Vite for the interface, a hand-written JavaScript engine for the CPU/ALU/cache
          simulation, a Node.js + Express REST API, and a MySQL database for saved programs,
          cache presets and performance reports.
        </p>
      </div>
    </section>
  );
}

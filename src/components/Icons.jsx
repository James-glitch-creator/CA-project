// Small, consistent stroke-icon set (24x24, currentColor) so the UI doesn't rely on emoji glyphs.
const paths = {
  home: "M4 11.5 12 4l8 7.5M6 10v9a1 1 0 0 0 1 1h4v-6h2v6h4a1 1 0 0 0 1-1v-9",
  cpu: "M9 3v2M15 3v2M9 19v2M15 19v2M3 9h2M3 15h2M19 9h2M19 15h2M7 7h10v10H7z M10 10h4v4h-4z",
  alu: "M5 4h6l4 8-4 8H5l4-8-4-8zM15 8h4M15 16h4",
  registers: "M4 5h16v4H4zM4 10h16v4H4zM4 15h16v4H4z",
  memory: "M4 5h16v14H4zM8 5v14M12 5v14M16 5v14",
  cache: "M4 6h16v4H4zM4 10v4h16v-4M6 18h12",
  instructions: "M5 4h14v16H5zM8 8h8M8 12h8M8 16h5",
  performance: "M4 19h16M7 19V9M12 19V5M17 19v7",
  info: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 8v.01M11 11h1v6h1",
  sun: "M12 4V2M12 22v-2M4 12H2M22 12h-2M5 5 3.5 3.5M20.5 20.5 19 19M5 19l-1.5 1.5M20.5 3.5 19 5",
  moon: "M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z",
  reset: "M4 12a8 8 0 1 1 2.6 5.9M4 12V6M4 12h6",
  play: "M6 4l14 8-14 8V4z",
  step: "M6 4v16M11 4l9 8-9 8V4z",
  pause: "M7 4h4v16H7zM13 4h4v16h-4z",
  target: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2z",
  cap: "M12 4 2 9l10 5 8-4v6M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5"
};

export default function Icon({ name, size = 16 }) {
  const d = paths[name];
  if (!d) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

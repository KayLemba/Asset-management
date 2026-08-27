import React from "react";

const PATHS = {
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  list: <><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><circle cx="4" cy="6" r="1" /><circle cx="4" cy="12" r="1" /><circle cx="4" cy="18" r="1" /></>,
  plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
  transfer: <><path d="M4 7h13l-3-3" /><path d="M20 17H7l3 3" /></>,
  requirements: <><path d="M5 6h14" /><path d="M5 12h14" /><path d="M5 18h14" /><circle cx="3" cy="6" r=".7" fill="currentColor" /><circle cx="3" cy="12" r=".7" fill="currentColor" /><circle cx="3" cy="18" r=".7" fill="currentColor" /></>,
  alert: <><path d="M12 3 2.8 20h18.4L12 3Z" /><line x1="12" y1="9" x2="12" y2="14" /><circle cx="12" cy="17" r=".8" fill="currentColor" /></>,
  users: <><path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20" /><circle cx="9.5" cy="7" r="3.5" /><path d="M17 11a3.5 3.5 0 1 0 0-7" /><path d="M21 20v-1.5a4 4 0 0 0-2.7-3.8" /></>,
  trash: <><path d="M4 7h16" /><path d="M9 7V4h6v3" /><path d="m7 7 1 14h8l1-14" /><line x1="10" y1="11" x2="10" y2="18" /><line x1="14" y1="11" x2="14" y2="18" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  moon: <path d="M20.5 15.2A8.5 8.5 0 0 1 8.8 3.5 8.5 8.5 0 1 0 20.5 15.2Z" />,
  download: <><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M4 20h16" /></>,
  upload: <><path d="M12 15V3" /><path d="m7 8 5-5 5 5" /><path d="M4 20h16" /></>,
  logout: <><path d="M10 4H5v16h5" /><path d="M14 8l4 4-4 4" /><path d="M18 12H8" /></>,
  history: <><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /><path d="M12 7v5l3 2" /></>,
  checkout: <><path d="M4 7h12" /><path d="m12 3 4 4-4 4" /><path d="M20 17H8" /><path d="m12 13-4 4 4 4" /></>,
  checkin: <><path d="M20 12H8" /><path d="m12 8-4 4 4 4" /><path d="M4 5h5" /><path d="M4 19h5" /></>,
  edit: <><path d="m4 16-.8 4.8L8 20l11.5-11.5a2.1 2.1 0 0 0-3-3L5 17" /><path d="m14.5 7.5 3 3" /></>,
  close: <><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  arrowRight: <><line x1="4" y1="12" x2="19" y2="12" /><path d="m13 6 6 6-6 6" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
  laptop: <><rect x="4" y="5" width="16" height="11" rx="1" /><path d="M2 19h20" /></>,
  server: <><rect x="4" y="4" width="16" height="6" rx="1" /><rect x="4" y="14" width="16" height="6" rx="1" /><circle cx="8" cy="7" r=".7" fill="currentColor" /><circle cx="8" cy="17" r=".7" fill="currentColor" /></>,
  monitor: <><rect x="3" y="4" width="18" height="13" rx="1" /><path d="M8 21h8M12 17v4" /></>,
  printer: <><path d="M6 9V4h12v5" /><path d="M6 17H4a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="7" /></>,
  network: <><circle cx="12" cy="5" r="2" /><circle cx="5" cy="19" r="2" /><circle cx="19" cy="19" r="2" /><path d="M12 7v5M12 12 5 17M12 12l7 5" /></>,
  phone: <><rect x="7" y="2" width="10" height="20" rx="2" /><line x1="10" y1="5" x2="14" y2="5" /><circle cx="12" cy="18" r="1" /></>,
  camera: <><path d="M4 8h3l2-3h6l2 3h3v11H4Z" /><circle cx="12" cy="13" r="3" /></>,
  projector: <><rect x="3" y="7" width="18" height="10" rx="2" /><path d="M7 17v3M17 17v3M21 10h1" /><circle cx="8" cy="12" r="1" /></>,
  battery: <><rect x="3" y="7" width="17" height="10" rx="2" /><path d="M20 10h2v4h-2M7 12h3M8.5 10.5v3" /></>,
  storage: <><ellipse cx="12" cy="6" rx="8" ry="3" /><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6" /><path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" /></>,
  power: <><path d="M12 2v10" /><path d="M18.4 5.6a8 8 0 1 1-12.8 0" /></>,
  shield: <path d="M12 3 20 6v5c0 5-3.4 8.7-8 10-4.6-1.3-8-5-8-10V6l8-3Z" />,
  tools: <><path d="m14 6 4-4 4 4-4 4" /><path d="M18 10 8 20" /><path d="M5 4 3 6l5 5 3-3Z" /></>,
  box: <><path d="m4 7 8-4 8 4-8 4-8-4Z" /><path d="M4 7v10l8 4 8-4V7M12 11v10" /></>,
  chart: <><path d="M4 19V5M4 19h17" /><path d="m7 15 4-4 3 2 5-6" /></>,
  tag: <><path d="M3 5v6l10 10 8-8L11 3H5a2 2 0 0 0-2 2Z" /><circle cx="7" cy="7" r="1" /></>,
};

export default function Icon({ name, size = 18, strokeWidth = 1.8, className = "" }) {
  return (
    <svg className={`ui-icon ${className}`.trim()} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {PATHS[name] || PATHS.box}
    </svg>
  );
}

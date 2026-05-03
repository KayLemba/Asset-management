import { useEffect } from "react";

export default function Toast({ message, onClose }) {
  useEffect(()=>{
    if (!message) return;
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [message, onClose]);

  return (
    <div className="toast" role="status" aria-live="polite">
      <span className="toast-icon">✓</span>
      <span className="toast-text">{message}</span>
      <button className="toast-close" onClick={onClose} aria-label="Close">×</button>
    </div>
  );
}

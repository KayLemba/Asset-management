import { useState } from "react";

export default function CheckoutModal({ asset, onCheckout, onClose }) {
  const [assignedTo, setAssignedTo] = useState(asset.assignedTo || "");
  const [dueBack, setDueBack] = useState(asset.dueBack || "");
  const [error, setError] = useState("");

  const submit = (event) => {
    event.preventDefault();
    if (!assignedTo.trim()) {
      setError("Assigned To is required.");
      return;
    }
    onCheckout(asset.id, { assignedTo: assignedTo.trim(), dueBack: dueBack || null });
  };

  return (
    <div className="modal" role="dialog" aria-modal="true" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <form className="card modal-card" onSubmit={submit}>
        <div className="card-header">
          <h2>Check Out Asset</h2>
          <p className="muted">{asset.name} · {asset.serial || "No serial"}</p>
        </div>
        {error && <div className="alert">{error}</div>}
        <div>
          <label htmlFor="checkout-assignee">Assigned To *</label>
          <input id="checkout-assignee" value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)} autoFocus />
        </div>
        <div style={{ marginTop: 12 }}>
          <label htmlFor="checkout-due">Due Back (optional)</label>
          <input id="checkout-due" type="date" value={dueBack} onChange={(event) => setDueBack(event.target.value)} />
        </div>
        <div className="modal-actions">
          <button className="btn green">Check Out</button>
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

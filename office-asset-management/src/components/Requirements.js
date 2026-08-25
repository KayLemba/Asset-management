import { useState } from "react";

const PRIORITIES = ["low", "normal", "high", "urgent"];

function StatusBadge({ status }) {
  const cls = {
    pending: "warn",
    approved: "info",
    fulfilled: "success",
    rejected: "danger",
  }[status] || "muted";
  return <span className={`badge ${cls}`}>{status}</span>;
}

export default function Requirements({ assets, requirements, onSubmit, onSetStatus }) {
  const [assetId, setAssetId] = useState("");
  const [itemName, setItemName] = useState("");
  const [quantityNeeded, setQuantityNeeded] = useState(1);
  const [priority, setPriority] = useState("normal");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);

    const result = onSubmit({ assetId, itemName, quantityNeeded, priority, reason });

    setBusy(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    setAssetId(""); setItemName(""); setQuantityNeeded(1); setPriority("normal"); setReason("");
  };

  return (
    <div>
      <form className="card" onSubmit={submit}>
        <div className="card-header">
          <h2>Request Inventory</h2>
          <p className="muted">Tell the team what type of inventory is needed.</p>
        </div>

        {error ? <div className="alert">{error}</div> : null}

        <div className="grid-2">
          <div>
            <label>Existing Asset (optional)</label>
            <select value={assetId} onChange={(e) => setAssetId(e.target.value)}>
              <option value="">— Not in registry —</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label>Item Needed (if not listed)</label>
            <input
              placeholder="e.g., HDMI cables"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              disabled={!!assetId}
            />
          </div>

          <div>
            <label>Quantity Needed</label>
            <input
              type="number"
              min="1"
              value={quantityNeeded}
              onChange={(e) => setQuantityNeeded(e.target.value)}
            />
          </div>

          <div>
            <label>Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label>Reason</label>
            <input
              placeholder="Why is this needed?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        <div className="form-actions">
          <button className="btn green" disabled={busy}>
            {busy ? "Submitting…" : "Submit Request"}
          </button>
        </div>
      </form>

      <div className="table-card">
        <table className="asset-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Requested</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requirements.length === 0 ? (
              <tr><td colSpan={6} className="empty">No requests yet.</td></tr>
            ) : requirements.map((r) => (
              <tr key={r.id}>
                <td>{r.itemName || assets.find((a) => a.id === r.assetId)?.name || "—"}</td>
                <td className="col-num">{r.quantityNeeded}</td>
                <td><span className="badge muted">{r.priority}</span></td>
                <td><StatusBadge status={r.status} /></td>
                <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                <td className="col-actions">
                  {r.status === "pending" && (
                    <>
                      <button className="tbl-btn blue" onClick={() => onSetStatus(r.id, "approved")}>Approve</button>
                      <button className="tbl-btn red" onClick={() => onSetStatus(r.id, "rejected")}>Reject</button>
                    </>
                  )}
                  {r.status === "approved" && (
                    <button className="tbl-btn blue" onClick={() => onSetStatus(r.id, "fulfilled")}>Fulfill</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

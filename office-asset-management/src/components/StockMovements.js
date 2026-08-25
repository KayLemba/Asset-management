import { useState, useCallback } from "react";

export default function StockMovements({ assets, movements, onRecordMovement }) {
  const [assetId, setAssetId] = useState("");
  const [type, setType] = useState("in");
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const assetName = useCallback(
    (id) => assets.find((a) => a.id === id)?.name || "Deleted Asset",
    [assets]
  );

  const submit = (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);

    const result = onRecordMovement({ assetId, type, quantity, note });

    setBusy(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    setQuantity(1);
    setNote("");
  };

  return (
    <div>
      <form className="card" onSubmit={submit}>
        <div className="card-header">
          <h2>Stock In / Out</h2>
          <p className="muted">Record inventory movements against an existing asset.</p>
        </div>

        {error ? <div className="alert">{error}</div> : null}

        <div className="grid-2">
          <div>
            <label>Asset *</label>
            <select value={assetId} onChange={(e) => setAssetId(e.target.value)}>
              <option value="">Select Asset</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.quantity} in stock)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Movement</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="in">Stock In</option>
              <option value="out">Stock Out</option>
            </select>
          </div>

          <div>
            <label>Quantity</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          <div>
            <label>Note</label>
            <input
              placeholder="e.g., Received PO-2201"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <div className="form-actions">
          <button className="btn green" disabled={busy}>
            {busy ? "Recording…" : "Record Movement"}
          </button>
        </div>
      </form>

      <div className="table-card">
        <table className="asset-table">
          <thead>
            <tr>
              <th>Asset</th>
              <th>Type</th>
              <th>Qty</th>
              <th>Note</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {movements.length === 0 ? (
              <tr><td colSpan={5} className="empty">No movements recorded yet.</td></tr>
            ) : movements.map((m) => (
              <tr key={m.id}>
                <td>{assetName(m.assetId)}</td>
                <td>
                  <span className={`badge ${m.type === "in" ? "success" : "danger"}`}>
                    {m.type === "in" ? "Stock In" : "Stock Out"}
                  </span>
                </td>
                <td className="col-num">{m.quantity}</td>
                <td>{m.note || "—"}</td>
                <td>{new Date(m.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

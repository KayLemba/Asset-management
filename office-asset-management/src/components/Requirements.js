import { useState } from "react";
import TableScroll from "./TableScroll";

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

export default function Requirements({ assets, requirements, currentUserId, canReview, onSubmit, onSetStatus, onUpdate, onDelete }) {
  const [assetId, setAssetId] = useState("");
  const [itemName, setItemName] = useState("");
  const [quantityNeeded, setQuantityNeeded] = useState(1);
  const [priority, setPriority] = useState("normal");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editError, setEditError] = useState("");
  const [editBusy, setEditBusy] = useState(false);

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

  const canManageRequest = (request) => canReview || request.createdBy === currentUserId;

  const beginEdit = (request) => {
    setEditing(request.id);
    setEditForm({
      assetId: request.assetId || "",
      itemName: request.itemName || "",
      quantityNeeded: request.quantityNeeded || 1,
      priority: request.priority || "normal",
      reason: request.reason || "",
    });
    setEditError("");
  };

  const updateEditField = (field) => (event) => {
    const value = event.target.value;
    setEditForm((previous) => ({ ...previous, [field]: value, ...(field === "itemName" && value.trim() ? { assetId: "" } : {}) }));
  };

  const submitEdit = (event) => {
    event.preventDefault();
    setEditBusy(true);
    const result = onUpdate(editing, editForm);
    setEditBusy(false);
    if (result?.error) {
      setEditError(result.error);
      return;
    }
    setEditing(null);
    setEditForm(null);
  };

  const removeRequest = (request) => {
    if (!window.confirm("Delete this pending request?")) return;
    const result = onDelete(request.id);
    if (result?.error) setError(result.error);
  };

  return (
    <div>
      <form className="card" onSubmit={submit}>
        <div className="card-header">
          <h2>Request Inventory</h2>
          <p className="muted">Tell the team what type of inventory is needed. Requesters can edit or delete their own pending requests; Admins and Supervisors review them.</p>
        </div>

        {error ? <div className="alert">{error}</div> : null}

        <div className="grid-2">
          <div>
            <label htmlFor="requirement-existing-asset">Existing Asset (optional)</label>
            <select id="requirement-existing-asset" value={assetId} onChange={(e) => setAssetId(e.target.value)}>
              <option value="">— Not in registry —</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            {assetId && <button type="button" className="inline-clear-btn" onClick={() => setAssetId("")}>Request a new item instead</button>}
          </div>

          <div>
            <label htmlFor="requirement-item-name">Item Needed (new item)</label>
            <input
              id="requirement-item-name"
              placeholder="e.g., HDMI cables"
              value={itemName}
              onChange={(e) => {
                const value = e.target.value;
                setItemName(value);
                if (value.trim()) setAssetId("");
              }}
              autoComplete="off"
            />
            <p className="field-hint">Leave Existing Asset blank to request something not yet in the registry.</p>
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

      <TableScroll minWidth="980px" className="requirements-table-scroll">
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
                  {r.status === "pending" && canManageRequest(r) && (
                    <>
                      <button type="button" className="tbl-btn ghost" onClick={() => beginEdit(r)}>Edit</button>
                      <button type="button" className="tbl-btn red" onClick={() => removeRequest(r)}>Delete</button>
                    </>
                  )}
                  {canReview && r.status === "pending" && (
                    <>
                      <button type="button" className="tbl-btn blue" onClick={() => onSetStatus(r.id, "approved")}>Approve</button>
                      <button type="button" className="tbl-btn red" onClick={() => onSetStatus(r.id, "rejected")}>Reject</button>
                    </>
                  )}
                  {canReview && r.status === "approved" && (
                    <button type="button" className="tbl-btn blue" onClick={() => onSetStatus(r.id, "fulfilled")}>Fulfill</button>
                  )}
                  {!canReview && !(r.status === "pending" && canManageRequest(r)) && <span className="muted">View only</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableScroll>

      {editing && editForm && (
        <div className="modal" role="dialog" aria-modal="true" aria-label="Edit requirement" onClick={(event) => { if (event.target === event.currentTarget) setEditing(null); }}>
          <form className="card modal-card requirement-edit-modal" onSubmit={submitEdit}>
            <div className="card-header">
              <h2>Edit Request</h2>
              <p className="muted">Only pending requests can be edited.</p>
            </div>
            {editError && <div className="alert">{editError}</div>}
            <div className="grid-2">
              <div>
                <label htmlFor="edit-requirement-asset">Existing Asset (optional)</label>
                <select id="edit-requirement-asset" value={editForm.assetId} onChange={updateEditField("assetId")}>
                  <option value="">— Not in registry —</option>
                  {assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="edit-requirement-item">Item Needed (new item)</label>
                <input id="edit-requirement-item" value={editForm.itemName} onChange={updateEditField("itemName")} placeholder="e.g., HDMI cables" autoComplete="off" />
              </div>
              <div>
                <label htmlFor="edit-requirement-quantity">Quantity Needed</label>
                <input id="edit-requirement-quantity" type="number" min="1" value={editForm.quantityNeeded} onChange={updateEditField("quantityNeeded")} />
              </div>
              <div>
                <label htmlFor="edit-requirement-priority">Priority</label>
                <select id="edit-requirement-priority" value={editForm.priority} onChange={updateEditField("priority")}>
                  {PRIORITIES.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label htmlFor="edit-requirement-reason">Reason</label>
                <input id="edit-requirement-reason" value={editForm.reason} onChange={updateEditField("reason")} placeholder="Why is this needed?" />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" className="btn green" disabled={editBusy}>{editBusy ? "Saving…" : "Save Changes"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

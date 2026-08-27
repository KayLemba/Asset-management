import { useState } from "react";

export default function BulkEditModal({ count, categories, statuses, onApply, onClose }) {
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [location, setLocation] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  const submit = (event) => {
    event.preventDefault();
    const patch = {};
    if (category) patch.category = category;
    if (status) patch.status = status;
    if (location.trim()) patch.location = location.trim();
    if (assignedTo.trim()) patch.assignedTo = assignedTo.trim();
    if (Object.keys(patch).length === 0) {
      onClose();
      return;
    }
    onApply(patch);
  };

  return (
    <div className="modal" role="dialog" aria-modal="true" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <form className="card modal-card" onSubmit={submit}>
        <div className="card-header">
          <h2>Bulk Edit</h2>
          <p className="muted">{count} asset(s) selected. Leave a field blank to leave it unchanged.</p>
        </div>
        <div className="grid-2">
          <div>
            <label htmlFor="bulk-category">Category</label>
            <select id="bulk-category" value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">— No change —</option>
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="bulk-status">Status</label>
            <select id="bulk-status" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">— No change —</option>
              {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="bulk-location">Location</label>
            <input id="bulk-location" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="— No change —" />
          </div>
          <div>
            <label htmlFor="bulk-assignee">Assigned To</label>
            <input id="bulk-assignee" value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)} placeholder="— No change —" />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn green">Apply to {count}</button>
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

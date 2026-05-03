import { useEffect, useState } from "react";

export default function EditModal({ asset, categories, statuses, onSave, onClose }) {
  const [form, setForm]   = useState(asset);
  const [error, setError] = useState("");

  useEffect(()=>{ setForm(asset); setError(""); },[asset]);

  const update       = key => e => setForm(p=>({...p,[key]:e?.target?.value}));
  const updateNumber = key => e => { const r=e?.target?.value; setForm(p=>({...p,[key]:r===""?"":Number(r)})); };

  const submit = e => {
    e.preventDefault(); setError("");
    const payload = {
      ...form, name:String(form.name??"").trim(), serial:String(form.serial??"").trim(),
      assignedTo:String(form.assignedTo??"").trim(), location:String(form.location??"").trim(),
      comments:String(form.comments??"").trim(), quantity:Math.max(1,Number(form.quantity||1)),
      value:Math.max(0,Number(form.value||0)),
    };
    if (!payload.name||!payload.category) { setError("Asset Name and Category are required."); return; }
    onSave(payload);
  };

  return (
    <div className="modal" role="dialog" aria-modal="true" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <form className="card modal-card" onSubmit={submit}>
        <div className="card-header">
          <h2>Edit Asset</h2>
          <p className="muted">Update asset details then save your changes.</p>
        </div>
        {error && <div className="alert">{error}</div>}
        <div className="grid-2">
          <div><label>Asset Name *</label><input value={form.name} onChange={update("name")}/></div>
          <div><label>Category *</label>
            <select value={form.category} onChange={update("category")}>
              {categories.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div><label>Serial / Asset Tag</label><input value={form.serial||""} onChange={update("serial")}/></div>
          <div><label>Status</label>
            <select value={form.status||"In Use"} onChange={update("status")}>
              {statuses.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div><label>Assigned To</label><input value={form.assignedTo||""} onChange={update("assignedTo")}/></div>
          <div><label>Location</label><input value={form.location||""} onChange={update("location")}/></div>
          <div><label>Comments</label><input value={form.comments||""} onChange={update("comments")}/></div>
          <div><label>Quantity</label><input type="number" min="1" value={form.quantity} onChange={updateNumber("quantity")}/></div>
          <div><label>Unit Value (ZMW)</label><input type="number" min="0" step="0.01" value={form.value} onChange={updateNumber("value")}/></div>
        </div>
        <div className="modal-actions">
          <button className="btn green">Save Changes</button>
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

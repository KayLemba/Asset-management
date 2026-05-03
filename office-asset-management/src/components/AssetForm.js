import { useMemo, useState } from "react";

const DEFAULT_FORM = {
  name:"",category:"",serial:"",status:"In Use",
  assignedTo:"",location:"",comments:"",quantity:1,value:0,
};

export default function AssetForm({ onAdd, categories, statuses }) {
  const [form, setForm]   = useState(DEFAULT_FORM);
  const [error, setError] = useState("");

  const canSubmit = useMemo(()=>form.name.trim().length>0&&form.category.trim().length>0,[form.name,form.category]);

  const update       = key => e => setForm(p=>({...p,[key]:e?.target?.value}));
  const updateNumber = key => e => { const r=e?.target?.value; setForm(p=>({...p,[key]:r===""?"":Number(r)})); };

  const submit = e => {
    e.preventDefault(); setError("");
    const payload = {
      ...form, name:form.name.trim(), serial:form.serial.trim(),
      assignedTo:form.assignedTo.trim(), location:form.location.trim(),
      comments:form.comments.trim(), quantity:Math.max(1,Number(form.quantity||1)),
      value:Math.max(0,Number(form.value||0)),
    };
    if (!payload.name||!payload.category) { setError("Asset Name and Category are required."); return; }
    onAdd(payload);
    setForm(DEFAULT_FORM);
  };

  return (
    <form className="card asset-form" onSubmit={submit}>
      <div className="card-header">
        <h2>Add New Asset</h2>
        <p className="muted">Fill in the details below to register a new IT asset.</p>
      </div>
      {error && <div className="alert">{error}</div>}
      <div className="grid-2">
        <div><label>Asset Name *</label><input placeholder="e.g., Dell Latitude 5420" value={form.name} onChange={update("name")} autoComplete="off"/></div>
        <div><label>Category *</label>
          <select value={form.category} onChange={update("category")}>
            <option value="">Select Category</option>
            {categories.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div><label>Serial / Asset Tag</label><input placeholder="e.g., SN12345" value={form.serial} onChange={update("serial")} autoComplete="off"/></div>
        <div><label>Status</label>
          <select value={form.status} onChange={update("status")}>
            {statuses.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div><label>Assigned To</label><input placeholder="e.g., Kalolo Lemba" value={form.assignedTo} onChange={update("assignedTo")} autoComplete="off"/></div>
        <div><label>Location</label><input placeholder="e.g., MTN HQ Kitwe" value={form.location} onChange={update("location")} autoComplete="off"/></div>
        <div><label>Comments</label><input placeholder="e.g., Screen cracked, assigned with charger" value={form.comments} onChange={update("comments")} autoComplete="off"/></div>
        <div><label>Quantity</label><input type="number" min="1" value={form.quantity} onChange={updateNumber("quantity")}/></div>
        <div><label>Unit Value (ZMW)</label><input type="number" min="0" step="0.01" value={form.value} onChange={updateNumber("value")}/></div>
      </div>
      <div className="form-actions">
        <button className="btn green" disabled={!canSubmit}>Add Asset</button>
        <button type="button" className="btn ghost" onClick={()=>{setError("");setForm(DEFAULT_FORM);}}>Clear</button>
      </div>
    </form>
  );
}

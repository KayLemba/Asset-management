import React, { useState } from "react";

function AssetForm({ onAdd, categories }) {
  const [form, setForm] = useState({
    name: "",
    category: "",
    serial: "",
    status: "",
    location: "",
    assignedTo: "",
    value: ""
  });

  const submit = e => {
    e.preventDefault();
    if (!form.name || !form.category || !form.value) return;
    onAdd(form);
    setForm({
      name: "",
      category: "",
      serial: "",
      status: "",
      location: "",
      assignedTo: "",
      value: ""
    });
  };

  return (
    <form className="card asset-form" onSubmit={submit}>
      <h2>Add Asset</h2>

      <div className="grid">
        <input placeholder="Asset Name"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
        />

        <select
          value={form.category}
          onChange={e => setForm({ ...form, category: e.target.value })}
        >
          <option value="">Select Category</option>
          {categories.map(c => (
            <option key={c}>{c}</option>
          ))}
        </select>

        <input placeholder="Serial Number"
          value={form.serial}
          onChange={e => setForm({ ...form, serial: e.target.value })}
        />

        <input placeholder="Status"
          value={form.status}
          onChange={e => setForm({ ...form, status: e.target.value })}
        />

        <input placeholder="Location"
          value={form.location}
          onChange={e => setForm({ ...form, location: e.target.value })}
        />

        <input placeholder="Assigned To"
          value={form.assignedTo}
          onChange={e => setForm({ ...form, assignedTo: e.target.value })}
        />

        <input type="number"
          placeholder="Asset Value (ZMW)"
          value={form.value}
          onChange={e => setForm({ ...form, value: e.target.value })}
        />
      </div>

      <div className="form-actions">
        <button className="btn green">Add Asset</button>
      </div>
    </form>
  );
}

export default AssetForm;

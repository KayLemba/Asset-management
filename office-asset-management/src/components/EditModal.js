import React, { useState } from "react";

function EditModal({ asset, categories, onSave, onClose }) {
  const [form, setForm] = useState(asset);

  const submit = e => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="modal">
      <form className="card" onSubmit={submit}>
        <h2>Edit Asset</h2>

        <input
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
        />

        <select
          value={form.category}
          onChange={e => setForm({ ...form, category: e.target.value })}
        >
          {categories.map(c => (
            <option key={c}>{c}</option>
          ))}
        </select>

        <input
          value={form.serial}
          onChange={e => setForm({ ...form, serial: e.target.value })}
        />

        <input
          value={form.status}
          onChange={e => setForm({ ...form, status: e.target.value })}
        />

        <input
          value={form.location}
          onChange={e => setForm({ ...form, location: e.target.value })}
        />

        <input
          value={form.assignedTo}
          onChange={e => setForm({ ...form, assignedTo: e.target.value })}
        />

        <input
          type="number"
          value={form.value}
          onChange={e => setForm({ ...form, value: e.target.value })}
        />

        <div className="form-actions">
          <button className="btn green">Save</button>
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditModal;

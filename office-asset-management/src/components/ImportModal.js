import { useState } from "react";
import { mapImportRows, parseImportFile } from "../utils/importExcel";

export default function ImportModal({ categories, statuses, onImport, onClose }) {
  const [rows, setRows] = useState(null);
  const [errors, setErrors] = useState([]);
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    setFileName(file.name);
    try {
      const rawRows = await parseImportFile(file);
      const result = mapImportRows(rawRows, categories, statuses);
      setRows(result.valid);
      setErrors(result.errors);
    } catch (parseError) {
      setError(parseError.message || "Could not read this file.");
      setRows(null);
    } finally {
      setBusy(false);
    }
  };

  const confirm = () => {
    if (rows?.length) onImport(rows);
  };

  return (
    <div className="modal" role="dialog" aria-modal="true" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="card modal-card">
        <div className="card-header">
          <h2>Bulk Import</h2>
          <p className="muted">Upload a CSV or Excel file with columns such as Name, Category, Serial, Status, Quantity, Unit_Value_ZMW, Purchase_Date, and Warranty_Expiry.</p>
        </div>
        {error && <div className="alert">{error}</div>}
        <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFile} disabled={busy} />
        {busy && <p className="muted" style={{ marginTop: 12 }}>Reading {fileName}…</p>}
        {rows && (
          <div style={{ marginTop: 16 }}>
            <p className="muted">{fileName}: {rows.length} valid row(s){errors.length ? `, ${errors.length} skipped` : ""}</p>
            {errors.length > 0 && (
              <ul className="empty-hint import-errors">
                {errors.map((item, index) => <li key={`${item.row}-${index}`}>Row {item.row}: {item.reason}</li>)}
              </ul>
            )}
          </div>
        )}
        <div className="modal-actions">
          <button className="btn green" onClick={confirm} disabled={!rows || rows.length === 0}>Import {rows?.length || 0} Asset(s)</button>
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

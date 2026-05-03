function fmtMoney(value) {
  const n = Number(value || 0);
  // Compact format: K for thousands, M for millions
  if (n >= 1_000_000) return `ZMW ${(n/1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `ZMW ${(n/1_000).toFixed(1)}K`;
  return `ZMW ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function statusClass(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("use"))    return "badge success";
  if (s.includes("store"))  return "badge info";
  if (s.includes("repair")) return "badge warn";
  if (s.includes("retired"))return "badge muted";
  if (s.includes("lost"))   return "badge danger";
  if (s.includes("cant"))   return "badge danger";
  if (s.includes("fixed"))  return "badge purple";
  return "badge";
}

// Truncate long strings for compact display
function trunc(str, len = 16) {
  if (!str || str === "—") return str || "—";
  return str.length > len ? str.slice(0, len) + "…" : str;
}

export default function AssetTable({ assets, onEdit, onDelete, onHistory }) {
  return (
    <div className="table-card">
      <table className="asset-table">
        <thead>
          <tr>
            <th>Asset Name</th>
            <th>Category</th>
            <th>Serial</th>
            <th>Status</th>
            <th>Assigned To</th>
            <th>Location</th>
            <th>Qty</th>
            <th>Unit Val</th>
            <th>Total Val</th>
            <th>Comments</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {assets.length === 0 ? (
            <tr>
              <td colSpan={11} className="empty">
                No assets found. Add an asset or adjust your filters.
              </td>
            </tr>
          ) : assets.map(asset => {
            const qty   = Number(asset.quantity ?? 1);
            const unit  = Number(asset.value ?? 0);
            const total = qty * unit;
            return (
              <tr key={asset.id}>
                <td className="col-name" title={asset.name}>{trunc(asset.name, 18)}</td>
                <td className="col-cat"  title={asset.category}>{trunc(asset.category, 14)}</td>
                <td className="col-serial">{asset.serial || "—"}</td>
                <td className="col-status"><span className={statusClass(asset.status)}>{asset.status}</span></td>
                <td className="col-person" title={asset.assignedTo}>{trunc(asset.assignedTo, 14) || "—"}</td>
                <td className="col-loc"    title={asset.location}>{trunc(asset.location, 14) || "—"}</td>
                <td className="col-num">{qty}</td>
                <td className="col-val">{fmtMoney(unit)}</td>
                <td className="col-val">{fmtMoney(total)}</td>
                <td className="col-comment" title={asset.comments || ""}>{trunc(asset.comments, 14) || "—"}</td>
                <td className="col-actions">
                  <button className="tbl-btn blue"  onClick={() => onEdit(asset)}>Edit</button>
                  <button className="tbl-btn ghost" onClick={() => onHistory(asset)} title="View history">🕐</button>
                  <button className="tbl-btn red"   onClick={() => onDelete(asset.id)}>Del</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

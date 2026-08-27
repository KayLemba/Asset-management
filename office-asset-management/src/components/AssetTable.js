import Icon from "./Icon";

function fmtMoney(value) {
  const number = Number(value || 0);
  if (number >= 1_000_000) return `ZMW ${(number / 1_000_000).toFixed(1)}M`;
  if (number >= 1_000) return `ZMW ${(number / 1_000).toFixed(1)}K`;
  return `ZMW ${number.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function statusClass(status) {
  const value = String(status || "").toLowerCase();
  if (value.includes("use")) return "badge success";
  if (value.includes("store")) return "badge info";
  if (value.includes("repair")) return "badge warn";
  if (value.includes("retired")) return "badge muted";
  if (value.includes("lost") || value.includes("cant")) return "badge danger";
  if (value.includes("fixed")) return "badge purple";
  return "badge";
}

function WarrantyBadge({ expiry }) {
  if (!expiry) return <span className="badge muted">—</span>;
  const days = Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000);
  if (Number.isNaN(days)) return <span className="badge muted">Invalid</span>;
  if (days < 0) return <span className="badge danger">Expired</span>;
  if (days <= 30) return <span className="badge warn">{days}d left</span>;
  return <span className="badge success">{new Date(expiry).toLocaleDateString()}</span>;
}

export default function AssetTable({
  assets,
  onEdit,
  onDelete,
  onHistory,
  onCheckout,
  onCheckin,
  canWrite = true,
  selectedIds = new Set(),
  onToggleSelect = () => {},
  onToggleSelectAll = () => {},
}) {
  const allSelected = assets.length > 0 && assets.every((asset) => selectedIds.has(asset.id));
  return (
    <div className="table-card registry-table-card">
      <div className="table-scroll-caption"><Icon name="transfer" size={14} /> All registry columns are available; scroll horizontally on smaller screens.</div>
      <div className="table-scroll-region">
      <table className={`asset-table ${canWrite ? "with-select" : "without-select"}`}>
        <colgroup>
          {canWrite && <col style={{ width: "44px" }} />}
          <col style={{ width: "150px" }} />
          <col style={{ width: "260px" }} />
          <col style={{ width: "150px" }} />
          <col style={{ width: "160px" }} />
          <col style={{ width: "155px" }} />
          <col style={{ width: "190px" }} />
          <col style={{ width: "180px" }} />
          <col style={{ width: "70px" }} />
          <col style={{ width: "110px" }} />
          <col style={{ width: "125px" }} />
          <col style={{ width: "140px" }} />
          <col style={{ width: "240px" }} />
          <col style={{ width: "230px" }} />
        </colgroup>
        <thead>
          <tr>
            {canWrite && <th className="head-select"><input type="checkbox" aria-label="Select all visible assets" checked={allSelected} onChange={() => onToggleSelectAll(assets)} /></th>}
            <th className="head-id">Asset ID</th><th className="head-name">Asset Name</th><th className="head-category">Category</th><th className="head-serial">Serial</th><th className="head-status">Status</th><th className="head-person">Assigned To</th>
            <th className="head-location">Location</th><th className="head-qty">Qty</th><th className="head-unit-value">Unit Val</th><th className="head-total-value">Total Val</th><th className="head-warranty">Warranty</th><th className="head-comments">Comments</th><th className="head-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {assets.length === 0 ? (
            <tr><td colSpan={canWrite ? 14 : 13} className="empty">No assets found. Add an asset or adjust your filters.</td></tr>
          ) : assets.map((asset) => {
            const quantity = Number(asset.quantity ?? 1);
            const unitValue = Number(asset.value ?? 0);
            return (
              <tr key={asset.id}>
                {canWrite && <td><input type="checkbox" aria-label={`Select ${asset.name}`} checked={selectedIds.has(asset.id)} onChange={() => onToggleSelect(asset.id)} /></td>}
                <td className="col-id" title={asset.assetId || asset.id}>{asset.assetId || asset.id}</td>
                <td className="col-name" title={asset.name}>{asset.name || "—"}</td>
                <td className="col-cat" title={asset.category}>{asset.category || "—"}</td>
                <td className="col-serial" title={asset.serial || ""}>{asset.serial || "—"}</td>
                <td className="col-status"><span className={statusClass(asset.status)}>{asset.status}</span></td>
                <td className="col-person" title={asset.assignedTo}>{asset.assignedTo || "—"}</td>
                <td className="col-loc" title={asset.location}>{asset.location || "—"}</td>
                <td className="col-num">{quantity}</td>
                <td className="col-val">{fmtMoney(unitValue)}</td>
                <td className="col-val">{fmtMoney(quantity * unitValue)}</td>
                <td className="col-warranty"><WarrantyBadge expiry={asset.warrantyExpiry} /></td>
                <td className="col-comment" title={asset.comments || ""}>{asset.comments || "—"}</td>
                <td className="col-actions">
                  <button className="tbl-btn ghost icon-btn" onClick={() => onHistory(asset)} title="View history" aria-label={`View history for ${asset.name}`}><Icon name="history" size={14} /></button>
                  {canWrite && (asset.checkedOutAt
                    ? <button className="tbl-btn blue" onClick={() => onCheckin(asset.id)}>Check In</button>
                    : <button className="tbl-btn ghost" onClick={() => onCheckout(asset)}>Check Out</button>)}
                  {canWrite && <button className="tbl-btn blue" onClick={() => onEdit(asset)}>Edit</button>}
                  {canWrite && <button className="tbl-btn red" onClick={() => onDelete(asset.id)}>Trash</button>}
                </td>
              </tr>
            );
          })}
          </tbody>
      </table>
      </div>
    </div>
  );
}
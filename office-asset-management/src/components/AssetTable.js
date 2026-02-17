function formatMoneyZMW(value) {
  const n = Number(value || 0);
  return `ZMW ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function statusClass(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("use")) return "badge success";
  if (s.includes("store")) return "badge info";
  if (s.includes("repair")) return "badge warn";
  if (s.includes("retired")) return "badge muted";
  return "badge";
}

function AssetTable({ assets, onEdit, onDelete }) {
  return (
    <div className="card">
      <div className="card-header row">
        <div>
          <h2>Assets</h2>
          <p className="muted">
            Showing <strong>{assets.length}</strong> record(s)
          </p>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Serial</th>
              <th>Status</th>
              <th>Assigned To</th>
              <th>Location</th>
              <th>Qty</th>
              <th>Unit Value</th>
              <th>Total Value</th>
              <th className="actions-col">Actions</th>
            </tr>
          </thead>

          <tbody>
            {assets.length === 0 ? (
              <tr>
                <td colSpan={10} className="empty">
                  No assets found. Add an asset above or change your search.
                </td>
              </tr>
            ) : (
              assets.map((asset) => {
                const qty = Number(asset.quantity ?? 1);
                const unit = Number(asset.value ?? 0);
                const total = qty * unit;

                return (
                  <tr key={asset.id}>
                    <td className="cell-strong">{asset.name}</td>
                    <td>{asset.category}</td>
                    <td>{asset.serial || "—"}</td>
                    <td>
                      <span className={statusClass(asset.status)}>{asset.status}</span>
                    </td>
                    <td>{asset.assignedTo || "—"}</td>
                    <td>{asset.location || "—"}</td>
                    <td>{qty}</td>
                    <td>{formatMoneyZMW(unit)}</td>
                    <td>{formatMoneyZMW(total)}</td>
                    <td className="actions">
                      <button className="btn blue" onClick={() => onEdit(asset)}>
                        Edit
                      </button>
                      <button className="btn red" onClick={() => onDelete(asset.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AssetTable;

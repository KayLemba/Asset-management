import TableScroll from "./TableScroll";

export default function TrashView({ assets, onRestore, onPermanentDelete }) {
  return (
    <TableScroll minWidth="900px" className="trash-table-scroll">
      <table className="asset-table">
        <thead>
          <tr><th>Asset Name</th><th>Category</th><th>Serial</th><th>Deleted At</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {assets.length === 0 ? (
            <tr><td colSpan={5} className="empty">Trash is empty.</td></tr>
          ) : assets.map((asset) => (
            <tr key={asset.id}>
              <td className="col-name" title={asset.name}>{asset.name || "—"}</td>
              <td className="col-cat" title={asset.category}>{asset.category || "—"}</td>
              <td className="col-serial">{asset.serial || "—"}</td>
              <td>{asset.deletedAt ? new Date(asset.deletedAt).toLocaleString() : "—"}</td>
              <td className="col-actions">
                <button className="tbl-btn blue" onClick={() => onRestore(asset.id)}>Restore</button>
                <button className="tbl-btn red" onClick={() => onPermanentDelete(asset.id)}>Delete Forever</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableScroll>
  );
}

import { useMemo, useState } from "react";
import TableScroll from "./TableScroll";

const TYPE_LABEL = {
  low_stock: "Low Stock",
  deadstock: "Deadstock",
  requirement: "Requirement",
  warranty_expiring: "Warranty Expiring",
  warranty_expired: "Warranty Expired",
  overdue_checkout: "Overdue Checkout",
};

const TYPE_CLASS = {
  low_stock: "warn",
  deadstock: "muted",
  requirement: "info",
  warranty_expiring: "warn",
  warranty_expired: "danger",
  overdue_checkout: "danger",
};

export default function AlertsPanel({ alerts, onMarkRead, onRunChecks }) {
  const [filter, setFilter] = useState("unread");

  const visible = useMemo(() => {
    const sorted = [...alerts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (filter === "all") return sorted;
    return sorted.filter((a) => a.status === filter);
  }, [alerts, filter]);

  return (
    <div>
      <div className="card">
        <div className="card-header row">
          <div>
            <h2>Alerts</h2>
            <p className="muted">Low stock, deadstock, warranty, overdue checkout, and inventory request alerts.</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button className="btn ghost" onClick={onRunChecks} title="Scan assets for deadstock, warranty expiry, and overdue checkouts">
              Run Alert Scan
            </button>
            <select className="cat-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
              <option value="all">All</option>
            </select>
          </div>
        </div>
      </div>

      <TableScroll minWidth="820px" className="alerts-table-scroll">
        <table className="asset-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Message</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr><td colSpan={4} className="empty">No alerts.</td></tr>
            ) : visible.map((a) => (
              <tr key={a.id}>
                <td><span className={`badge ${TYPE_CLASS[a.type] || "muted"}`}>{TYPE_LABEL[a.type] || a.type}</span></td>
                <td>{a.message}</td>
                <td>{new Date(a.createdAt).toLocaleString()}</td>
                <td className="col-actions">
                  {a.status === "unread" && (
                    <button className="tbl-btn blue" onClick={() => onMarkRead(a.id)}>Mark Read</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableScroll>
    </div>
  );
}

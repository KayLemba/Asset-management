import Icon from "./Icon";

const FIELD_LABELS = {
  assetId:   "Asset ID",
  status:     "Status",
  assignedTo: "Assigned To",
  location:   "Location",
  category:   "Category",
  name:       "Asset Name",
  serial:     "Serial / Tag",
  quantity:   "Quantity",
  value:      "Unit Value",
  comments:       "Comments",
  purchaseDate:   "Purchase Date",
  warrantyExpiry: "Warranty Expiry",
  checkedOutAt:   "Checked Out",
  dueBack:        "Due Back",
  Created:        "Created",
  Deleted:        "Deleted",
  Restored:       "Restored",
  Imported:       "Imported",
};

export default function HistoryModal({ asset, history, onClose }) {
  const sorted = [...history].sort((a,b)=>new Date(b.date)-new Date(a.date));

  return (
    <div className="modal" role="dialog" aria-modal="true" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div className="modal-card history-modal">
        <div className="history-header">
          <div>
            <h2>Device History</h2>
            <p className="muted">{asset.name} · {asset.serial || "No serial"}</p>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close history"><Icon name="close" size={15} /></button>
        </div>

        {sorted.length === 0 ? (
          <p className="empty-hint" style={{padding:"24px 0"}}>No history recorded for this asset yet.</p>
        ) : (
          <div className="history-timeline">
            {sorted.map((e,i)=>(
              <div key={i} className="history-event">
                <div className="history-line">
                  <div className="history-dot"/>
                  {i < sorted.length-1 && <div className="history-connector"/>}
                </div>
                <div className="history-content">
                  <div className="history-field">{FIELD_LABELS[e.field]||e.field}</div>
                  <div className="history-change">
                    <span className="from-badge">{e.from}</span>
                    <span className="arrow"><Icon name="arrowRight" size={13} /></span>
                    <span className="to-badge">{e.to}</span>
                  </div>
                  <div className="history-date">{new Date(e.date).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

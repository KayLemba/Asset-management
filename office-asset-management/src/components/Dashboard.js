import { useMemo } from "react";

const STATUS_COLORS = {
  "In Use":               "#22c55e",
  "In Storage":           "#60a5fa",
  "Repair":               "#f59e0b",
  "Retired":              "#94a3b8",
  "Lost":                 "#ef4444",
  "Cant be fixed":        "#dc2626",
  "Fixed and ready for Use": "#a78bfa",
};

const CAT_ICONS = {
  Laptop:"💻", CPU:"🖥", Desktop:"🖥", Workstation:"🖥", Monitor:"🖥",
  Server:"🖧", Printer:"🖨", Router:"📡", Switch:"🔀", Tablet:"📱",
  "Mobile Phone":"📱", Camera:"📷", Projector:"📽", UPS:"🔋",
  "IP Phone":"☎️", Headset:"🎧", Keyboard:"⌨️", Mouse:"🖱",
  "NAS Storage":"💾", "External Hard Drive":"💾", Battery:"🔋",
  Inverter:"⚡", Firewall:"🛡", Webcam:"📸", Scanner:"🖨",
  Photocopier:"📠", TV:"📺", NVR:"📹", Modem:"📶",
  "Access Point":"📡", Charger:"🔌", "Docking Station":"🔌", Other:"📦",
};

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="stat-card" style={{"--accent": accent}}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

function DonutChart({ segments, size=120 }) {
  const R = 40, cx = 60, cy = 60;
  const circ = 2 * Math.PI * R;
  let offset = 0;
  const total = segments.reduce((s,seg)=>s+seg.value,0);
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--border)" strokeWidth="16"/>
      {total === 0 ? (
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--border)" strokeWidth="16"/>
      ) : segments.map((seg,i) => {
        const pct = seg.value / total;
        const dash = pct * circ;
        const gap = circ - dash;
        const el = (
          <circle key={i} cx={cx} cy={cy} r={R} fill="none"
            stroke={seg.color} strokeWidth="16"
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset * circ / total + circ * 0.25}
            style={{transform:"rotate(-90deg)", transformOrigin:"60px 60px"}}
          />
        );
        offset += seg.value;
        return el;
      })}
      <text x={cx} y={cy+1} textAnchor="middle" dominantBaseline="middle"
        style={{fontSize:13,fontWeight:900,fill:"var(--text)"}}>
        {total}
      </text>
      <text x={cx} y={cy+14} textAnchor="middle" dominantBaseline="middle"
        style={{fontSize:8,fill:"var(--muted)"}}>
        devices
      </text>
    </svg>
  );
}

function BarRow({ label, value, max, color }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="bar-row">
      <span className="bar-label">{label}</span>
      <div className="bar-track">
        <div className="bar-fill" style={{width:`${pct}%`, background:color}}/>
      </div>
      <span className="bar-val">{value}</span>
    </div>
  );
}

export default function Dashboard({ assets, history, onNavigate }) {
  const totalDevices = assets.reduce((s,a)=>s+Number(a.quantity??1),0);
  const totalValue   = assets.reduce((s,a)=>s+Number(a.value??0)*Number(a.quantity??1),0);
  const totalRecords = assets.length;

  // Status breakdown
  const byStatus = useMemo(()=>{
    const acc = {};
    for (const a of assets) {
      const s = a.status || "Unknown";
      acc[s] = (acc[s]||0) + Number(a.quantity??1);
    }
    return Object.entries(acc).sort((a,b)=>b[1]-a[1]);
  },[assets]);

  // Category breakdown (top 8)
  const byCategory = useMemo(()=>{
    const acc = {};
    for (const a of assets) {
      const c = a.category||"Other";
      acc[c] = (acc[c]||0) + Number(a.quantity??1);
    }
    return Object.entries(acc).sort((a,b)=>b[1]-a[1]).slice(0,8);
  },[assets]);

  const maxCat = byCategory[0]?.[1] || 1;

  // Recent activity from history
  const recentActivity = useMemo(()=>{
    const all = [];
    for (const [id, entries] of Object.entries(history)) {
      const asset = assets.find(a=>String(a.id)===String(id));
      for (const e of entries) {
        all.push({ ...e, assetName: asset?.name || "Deleted Asset" });
      }
    }
    return all.sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,10);
  },[history, assets]);

  // Donut segments for status
  const donutSegments = byStatus.map(([s,v])=>({ color: STATUS_COLORS[s]||"#64748b", value:v }));

  const inUse    = byStatus.find(([s])=>s==="In Use")?.[1]||0;
  const inRepair = byStatus.find(([s])=>s==="Repair")?.[1]||0;
  const retired  = byStatus.find(([s])=>s==="Retired")?.[1]||0;

  return (
    <div className="dashboard">
      {/* KPI row */}
      <div className="kpi-row">
        <StatCard label="Total Records"  value={totalRecords}  sub="asset entries"           accent="#60a5fa"/>
        <StatCard label="Total Devices"  value={totalDevices}  sub="across all categories"   accent="#22c55e"/>
        <StatCard label="Total Value"    value={`ZMW ${totalValue.toLocaleString()}`} sub="portfolio value" accent="#a78bfa"/>
        <StatCard label="In Use"         value={inUse}         sub="actively deployed"       accent="#22c55e"/>
        <StatCard label="Under Repair"   value={inRepair}      sub="maintenance queue"       accent="#f59e0b"/>
        <StatCard label="Retired"        value={retired}       sub="end of life"             accent="#94a3b8"/>
      </div>

      <div className="dash-grid">
        {/* Status donut */}
        <div className="dash-card">
          <div className="dash-card-header">Status Overview</div>
          <div className="donut-wrap">
            <DonutChart segments={donutSegments} size={140}/>
            <div className="donut-legend">
              {byStatus.map(([s,v])=>(
                <div key={s} className="legend-row">
                  <span className="legend-dot" style={{background:STATUS_COLORS[s]||"#64748b"}}/>
                  <span className="legend-label">{s}</span>
                  <span className="legend-val">{v}</span>
                </div>
              ))}
              {byStatus.length===0 && <p className="empty-hint">No data yet</p>}
            </div>
          </div>
        </div>

        {/* Category bars */}
        <div className="dash-card">
          <div className="dash-card-header">Top Categories</div>
          <div className="bars-wrap">
            {byCategory.map(([cat,val],i)=>(
              <BarRow key={cat} label={`${CAT_ICONS[cat]||"📦"} ${cat}`} value={val} max={maxCat}
                color={`hsl(${(i*37)%360},70%,55%)`}/>
            ))}
            {byCategory.length===0 && <p className="empty-hint">No data yet</p>}
          </div>
        </div>

        {/* Recent activity */}
        <div className="dash-card activity-card">
          <div className="dash-card-header">Recent Activity</div>
          {recentActivity.length === 0 ? (
            <p className="empty-hint">No activity recorded yet. Add or edit assets to track changes.</p>
          ) : (
            <div className="activity-list">
              {recentActivity.map((e,i)=>(
                <div key={i} className="activity-item">
                  <div className="activity-dot"/>
                  <div className="activity-body">
                    <div className="activity-title">
                      <strong>{e.assetName}</strong>
                      <span className="activity-field"> — {e.field}</span>
                    </div>
                    <div className="activity-change">
                      <span className="from-badge">{e.from}</span>
                      <span className="arrow">→</span>
                      <span className="to-badge">{e.to}</span>
                    </div>
                    <div className="activity-date">{new Date(e.date).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="dash-card quick-card">
          <div className="dash-card-header">Quick Actions</div>
          <div className="quick-actions">
            <button className="quick-btn" onClick={()=>onNavigate("add")}>
              <span className="quick-icon">➕</span>
              <span>Add Asset</span>
            </button>
            <button className="quick-btn" onClick={()=>onNavigate("assets")}>
              <span className="quick-icon">📋</span>
              <span>View All Assets</span>
            </button>
          </div>

          {/* Value breakdown by top categories */}
          <div className="dash-card-header" style={{marginTop:20}}>Value by Category</div>
          <div className="value-list">
            {assets.reduce((acc,a)=>{
              const c=a.category||"Other";
              const existing=acc.find(x=>x.cat===c);
              const v=Number(a.value??0)*Number(a.quantity??1);
              if(existing) existing.val+=v; else acc.push({cat:c,val:v});
              return acc;
            },[]).sort((a,b)=>b.val-a.val).slice(0,5).map(({cat,val})=>(
              <div key={cat} className="value-row">
                <span>{CAT_ICONS[cat]||"📦"} {cat}</span>
                <strong>ZMW {val.toLocaleString()}</strong>
              </div>
            ))}
            {assets.length===0 && <p className="empty-hint">No assets yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

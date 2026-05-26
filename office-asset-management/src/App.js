import { useEffect, useMemo, useState, useCallback } from "react";
import AssetForm from "./components/AssetForm";
import AssetTable from "./components/AssetTable";
import EditModal from "./components/EditModal";
import Toast from "./components/Toast";
import Dashboard from "./components/Dashboard";
import HistoryModal from "./components/HistoryModal";
import { exportToExcel } from "./utils/exportExcel";
import logo from "./assets/exponent-logo.png";

export const CATEGORIES = [
  "Laptop","CPU","Desktop","Workstation","Monitor","Server","NAS Storage",
  "External Hard Drive","UPS","IP Phone","Headset","Keyboard","TV","Mouse",
  "Charger","Docking Station","Webcam","Printer","Scanner","Photocopier",
  "Router","Switch","Firewall","Access Point","Modem","Projector","Camera",
  "NVR","Tablet","Mobile Phone","Battery","Inverter","Other",
];

export const STATUSES = [
  "In Use","In Storage","Repair","Retired","Lost","Cant be fixed","Fixed and ready for Use",
];

function safeParseJSON(value, fallback) {
  try {
    if (!value) return fallback;
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch { return fallback; }
}

function safeParseObj(value, fallback) {
  try {
    if (!value) return fallback;
    const parsed = JSON.parse(value);
    return typeof parsed === "object" && !Array.isArray(parsed) ? parsed : fallback;
  } catch { return fallback; }
}

function normalizeAsset(a) {
  return {
    id: a?.id ?? Date.now(),
    name: String(a?.name ?? "").trim(),
    category: String(a?.category ?? ""),
    serial: String(a?.serial ?? "").trim(),
    status: String(a?.status ?? "In Use"),
    assignedTo: String(a?.assignedTo ?? "").trim(),
    location: String(a?.location ?? "").trim(),
    comments: String(a?.comments ?? "").trim(),
    quantity: Number(a?.quantity ?? 1) || 1,
    value: Number(a?.value ?? 0) || 0,
    createdAt: a?.createdAt ?? new Date().toISOString(),
    updatedAt: a?.updatedAt ?? new Date().toISOString(),
  };
}

export default function App() {
  const [assets, setAssets] = useState(() =>
    safeParseJSON(localStorage.getItem("assets"), []).map(normalizeAsset)
  );
  const [history, setHistory] = useState(() =>
    safeParseObj(localStorage.getItem("assetHistory"), {})
  );
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [editAsset, setEditAsset] = useState(null);
  const [toast, setToast] = useState(null);
  const [historyAsset, setHistoryAsset] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") return true;
    if (saved === "light") return false;
    return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;
  });

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => { localStorage.setItem("assets", JSON.stringify(assets)); }, [assets]);
  useEffect(() => { localStorage.setItem("assetHistory", JSON.stringify(history)); }, [history]);

  const addHistoryEntry = useCallback((assetId, entries) => {
    setHistory(prev => ({ ...prev, [assetId]: [...(prev[assetId] || []), ...entries] }));
  }, []);

  const filteredAssets = useMemo(() => {
    let list = assets;
    if (selectedCategory !== "All") list = list.filter(a => a.category === selectedCategory);
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(a =>
      [a.name,a.category,a.serial,a.status,a.location,a.assignedTo,a.comments]
        .filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }, [assets, search, selectedCategory]);

  const totalValue   = filteredAssets.reduce((s,a)=>s+Number(a.value??0)*Number(a.quantity??1),0);

  const addAsset = (asset) => {
    const normalized = normalizeAsset({ ...asset, id: Date.now(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    if (!normalized.name || !normalized.category) { setToast("Please fill in Asset Name and Category."); return; }
    setAssets(prev => [normalized, ...prev]);
    addHistoryEntry(normalized.id, [{ date: new Date().toISOString(), field: "Created", from: "—", to: normalized.status }]);
    setToast("Asset added successfully");
    setActiveTab("assets");
  };

  const updateAsset = (asset) => {
    const normalized = normalizeAsset({ ...asset, updatedAt: new Date().toISOString() });
    if (!normalized.name || !normalized.category) { setToast("Asset Name and Category are required."); return; }
    const old = assets.find(a => a.id === normalized.id);
    const changes = [];
    if (old) {
      for (const f of ["status","assignedTo","location","category","name","serial","quantity","value","comments"]) {
        if (String(old[f]) !== String(normalized[f]))
          changes.push({ date: new Date().toISOString(), field: f, from: String(old[f]||"—"), to: String(normalized[f]||"—") });
      }
    }
    setAssets(prev => prev.map(a => a.id === normalized.id ? normalized : a));
    if (changes.length) addHistoryEntry(normalized.id, changes);
    setEditAsset(null);
    setToast("Asset updated successfully");
  };

  const deleteAsset = (id) => {
    if (!window.confirm("Delete this asset? This cannot be undone.")) return;
    setAssets(prev => prev.filter(a => a.id !== id));
    setHistory(prev => { const n={...prev}; delete n[id]; return n; });
    setToast("Asset deleted");
  };

  const NAV = [
    { id:"dashboard", icon:"▦",  label:"Dashboard" },
    { id:"assets",    icon:"☰",  label:"Asset Registry" },
    { id:"add",       icon:"+",  label:"Add Asset" },
  ];

  return (
    <div className={`app-shell${sidebarOpen ? " sidebar-expanded" : " sidebar-collapsed"}`}>

      {/* ── SIDEBAR ── */}
      <aside className="sidebar">
        {/* Top: toggle button */}
        <div className="sidebar-top">
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(o => !o)}
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <span className="toggle-bar"/><span className="toggle-bar"/><span className="toggle-bar"/>
          </button>
          {sidebarOpen && <span className="sidebar-app-name">IT Asset Manager</span>}
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {sidebarOpen && <div className="nav-section-label">Menu</div>}
          {NAV.map(t => (
            <button
              key={t.id}
              className={`nav-item${activeTab===t.id?" active":""}`}
              onClick={() => setActiveTab(t.id)}
              title={!sidebarOpen ? t.label : undefined}
            >
              <span className="nav-icon">{t.icon}</span>
              {sidebarOpen && <span className="nav-label">{t.label}</span>}
            </button>
          ))}
        </nav>

        {/* Footer: theme toggle */}
        <div className="sidebar-footer">
          <button className="theme-toggle" onClick={() => setDarkMode(d => !d)}>
            <span className="nav-icon">{darkMode ? "☀️" : "🌙"}</span>
            {sidebarOpen && <span className="nav-label">{darkMode ? "Light Mode" : "Dark Mode"}</span>}
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="main-content">

        {/* Header — logo lives here top-right */}
        <header className="top-header">
          <div className="header-left">
            <h1 className="page-title">
              {activeTab === "dashboard" && "Dashboard"}
              {activeTab === "assets"    && "Asset Registry"}
              {activeTab === "add"       && "Add New Asset"}
            </h1>
            <span className="page-sub">
              {activeTab === "dashboard" && "Overview of your IT inventory"}
              {activeTab === "assets"    && `${filteredAssets.length} record(s) · ZMW ${totalValue.toLocaleString()}`}
              {activeTab === "add"       && "Register a new IT asset"}
            </span>
          </div>

          {/* Controls + Logo */}
          <div className="header-right">
            {activeTab === "assets" && (
              <>
                <input
                  className="search-input"
                  placeholder="🔍  Search…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <select className="cat-select" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                  <option value="All">All Categories</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button className="hdr-btn green" onClick={() => exportToExcel(filteredAssets)}>⬇ Export</button>
              </>
            )}
            {/* Logo — always top-right */}
            <div className="header-logo-wrap">
              <img src={logo} alt="Exponent Bizolution" className="header-logo" />
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="content-area">
          {activeTab === "dashboard" && (
            <Dashboard assets={assets} history={history} onNavigate={setActiveTab} />
          )}
          {activeTab === "assets" && (
            <AssetTable
              assets={filteredAssets}
              onEdit={setEditAsset}
              onDelete={deleteAsset}
              onHistory={a => setHistoryAsset(a)}
            />
          )}
          {activeTab === "add" && (
            <AssetForm onAdd={addAsset} categories={CATEGORIES} statuses={STATUSES} />
          )}
        </div>
      </main>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {editAsset && (
        <EditModal
          asset={editAsset}
          categories={CATEGORIES}
          statuses={STATUSES}
          onSave={updateAsset}
          onClose={() => setEditAsset(null)}
        />
      )}

      {historyAsset && (
        <HistoryModal
          asset={historyAsset}
          history={history[historyAsset.id] || []}
          onClose={() => setHistoryAsset(null)}
        />
      )}
    </div>
  );
}
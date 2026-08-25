import { useEffect, useMemo, useState, useCallback } from "react";
import AssetForm from "./components/AssetForm";
import AssetTable from "./components/AssetTable";
import EditModal from "./components/EditModal";
import Toast from "./components/Toast";
import Dashboard from "./components/Dashboard";
import HistoryModal from "./components/HistoryModal";
import StockMovements from "./components/StockMovements";
import Requirements from "./components/Requirements";
import AlertsPanel from "./components/AlertsPanel";
import { exportToExcel } from "./utils/exportExcel";
import logo from "./assets/tactivo-logo.png";

export const CATEGORIES = [
  "Laptop","CPU","Desktop","Workstation","Monitor","Server","NAS Storage",
  "External Hard Drive","UPS","IP Phone","Headset","Keyboard","TV","Mouse",
  "Charger","Docking Station","Webcam","Printer","Scanner","Photocopier",
  "Router","Switch","Firewall","Access Point","Modem","Projector","Camera",
  "NVR","Tablet","Mobile Phone","Battery","Inverter",

  // Tools
  "Drill","Grinder","Probe","Multimeter","Soldering Iron","Screwdriver Set",
  "Crimping Tool","Cable Tester","Power Tool",

  // Networking
  "LAN Cable","Fiber Optic Cable","Patch Panel","Network Rack","PoE Injector",

  // Fuel Automation
  "Fuel Dispenser","Fuel Level Probe","ATG (Automatic Tank Gauge)",
  "Fuel Flow Meter","Fuel Pump Controller","Solenoid Valve",
  "Fuel Management System","Tank Sensor",

  "Other",
];

export const STATUSES = [
  "In Use","In Storage","Repair","Retired","Lost","Cant be fixed","Fixed and ready for Use",
];

const STORAGE_KEY = "tactivo_data_v1";
const DEADSTOCK_DAYS = 90;

function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function emptyState() {
  return { assets: [], history: {}, stockMovements: [], requirements: [], alerts: [] };
}

function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    return {
      assets: Array.isArray(parsed.assets) ? parsed.assets : [],
      history: parsed.history && typeof parsed.history === "object" ? parsed.history : {},
      stockMovements: Array.isArray(parsed.stockMovements) ? parsed.stockMovements : [],
      requirements: Array.isArray(parsed.requirements) ? parsed.requirements : [],
      alerts: Array.isArray(parsed.alerts) ? parsed.alerts : [],
    };
  } catch {
    return emptyState();
  }
}

function makeAlert(type, assetId, message, requirementId = null) {
  return {
    id: uid(),
    type,
    assetId: assetId || null,
    requirementId: requirementId || null,
    message,
    status: "unread",
    createdAt: nowIso(),
  };
}

function hasUnreadAlert(alerts, type, assetId) {
  return alerts.some((a) => a.type === type && a.assetId === assetId && a.status === "unread");
}

export default function App() {
  const [state, setState] = useState(loadState);
  const { assets, history, stockMovements, requirements, alerts } = state;

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [editAsset, setEditAsset] = useState(null);
  const [toast, setToast] = useState(null);
  const [historyAsset, setHistoryAsset] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [darkMode, setDarkMode] = useState(() => {
    const saved = window.localStorage.getItem("theme");
    if (saved === "dark") return true;
    if (saved === "light") return false;
    return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;
  });

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
    window.localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // Persist all app data to localStorage any time it changes.
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      // Storage can fail (quota, private browsing). Surface it once rather than silently losing data.
      console.error("Failed to save data locally:", err);
    }
  }, [state]);

  // ---------- Deadstock scan (client-side, no cron) ----------
  const runDeadstockCheck = useCallback(() => {
    setState((prev) => {
      const cutoffMs = DEADSTOCK_DAYS * 24 * 60 * 60 * 1000;
      const now = Date.now();
      const newAlerts = [];
      for (const a of prev.assets) {
        const lastMoved = a.lastMovementAt ? new Date(a.lastMovementAt).getTime() : new Date(a.createdAt).getTime();
        if (now - lastMoved >= cutoffMs && !hasUnreadAlert(prev.alerts, "deadstock", a.id)) {
          newAlerts.push(makeAlert("deadstock", a.id, `${a.name} has had no stock movement in 90+ days`));
        }
      }
      if (!newAlerts.length) return prev;
      return { ...prev, alerts: [...prev.alerts, ...newAlerts] };
    });
  }, []);

  useEffect(() => { runDeadstockCheck(); }, [runDeadstockCheck]);

  // ---------- Assets ----------
  const addAsset = (payload) => {
    if (!payload.name || !payload.category) {
      setToast("Please fill in Asset Name and Category.");
      return;
    }
    const now = nowIso();
    const asset = {
      id: uid(),
      name: payload.name,
      category: payload.category,
      serial: payload.serial || "",
      status: payload.status || "In Use",
      assignedTo: payload.assignedTo || "",
      location: payload.location || "",
      comments: payload.comments || "",
      quantity: Number(payload.quantity || 1),
      minQuantity: Number(payload.minQuantity || 0),
      value: Number(payload.value || 0),
      lastMovementAt: null,
      createdAt: now,
      updatedAt: now,
    };

    setState((prev) => {
      const newHistory = { ...prev.history, [asset.id]: [{ date: now, field: "Created", from: "—", to: asset.status }] };
      let newAlerts = prev.alerts;
      if (asset.quantity < asset.minQuantity) {
        newAlerts = [...newAlerts, makeAlert("low_stock", asset.id, `${asset.name} is below minimum stock (${asset.quantity}/${asset.minQuantity})`)];
      }
      return { ...prev, assets: [asset, ...prev.assets], history: newHistory, alerts: newAlerts };
    });

    setToast("Asset added successfully");
    setActiveTab("assets");
  };

  const updateAsset = (asset) => {
    if (!asset.name || !asset.category) {
      setToast("Asset Name and Category are required.");
      return;
    }
    const now = nowIso();

    setState((prev) => {
      const old = prev.assets.find((a) => a.id === asset.id);
      if (!old) return prev;

      const updated = {
        ...old,
        ...asset,
        quantity: Number(asset.quantity || 1),
        minQuantity: Number(asset.minQuantity || 0),
        value: Number(asset.value || 0),
        updatedAt: now,
      };

      const trackedFields = [
        "status", "assignedTo", "location", "category", "name",
        "serial", "quantity", "minQuantity", "value", "comments",
      ];
      const newEntries = [];
      for (const field of trackedFields) {
        if (String(old[field] ?? "") !== String(updated[field] ?? "")) {
          newEntries.push({ date: now, field, from: String(old[field] ?? "—"), to: String(updated[field] ?? "—") });
        }
      }

      const newHistory = newEntries.length
        ? { ...prev.history, [asset.id]: [...(prev.history[asset.id] || []), ...newEntries] }
        : prev.history;

      let newAlerts = prev.alerts;
      if (updated.quantity < updated.minQuantity && !hasUnreadAlert(prev.alerts, "low_stock", asset.id)) {
        newAlerts = [...newAlerts, makeAlert("low_stock", asset.id, `${updated.name} is below minimum stock (${updated.quantity}/${updated.minQuantity})`)];
      }

      return {
        ...prev,
        assets: prev.assets.map((a) => (a.id === asset.id ? updated : a)),
        history: newHistory,
        alerts: newAlerts,
      };
    });

    setEditAsset(null);
    setToast("Asset updated successfully");
  };

  const deleteAsset = (id) => {
    if (!window.confirm("Delete this asset? This cannot be undone.")) return;
    setState((prev) => {
      const { [id]: _removed, ...restHistory } = prev.history;
      return {
        ...prev,
        assets: prev.assets.filter((a) => a.id !== id),
        history: restHistory,
      };
    });
    setToast("Asset deleted");
  };

  // ---------- Stock movements ----------
  const recordMovement = ({ assetId, type, quantity, note }) => {
    if (!assetId) return { error: "Select an asset." };
    const qty = Number(quantity);
    if (!qty || qty <= 0) return { error: "Quantity must be greater than 0." };

    const asset = assets.find((a) => a.id === assetId);
    if (!asset) return { error: "Asset not found." };
    if (type === "out" && qty > asset.quantity) {
      return { error: `Only ${asset.quantity} in stock — cannot remove ${qty}.` };
    }

    const now = nowIso();
    const newQty = asset.quantity + (type === "in" ? qty : -qty);

    setState((prev) => {
      const updatedAssets = prev.assets.map((a) =>
        a.id === assetId ? { ...a, quantity: newQty, lastMovementAt: now, updatedAt: now } : a
      );
      const histEntry = { date: now, field: type === "in" ? "stock_in" : "stock_out", from: "—", to: String(qty) };
      const newHistory = { ...prev.history, [assetId]: [...(prev.history[assetId] || []), histEntry] };

      let newAlerts = prev.alerts;
      if (newQty < asset.minQuantity && !hasUnreadAlert(prev.alerts, "low_stock", assetId)) {
        newAlerts = [...newAlerts, makeAlert("low_stock", assetId, `${asset.name} is below minimum stock (${newQty}/${asset.minQuantity})`)];
      }

      const movement = { id: uid(), assetId, type, quantity: qty, note: note || null, createdAt: now };

      return {
        ...prev,
        assets: updatedAssets,
        history: newHistory,
        alerts: newAlerts,
        stockMovements: [movement, ...prev.stockMovements],
      };
    });

    return { ok: true };
  };

  // ---------- Requirements ----------
  const submitRequirement = ({ assetId, itemName, quantityNeeded, priority, reason }) => {
    if (!assetId && !String(itemName || "").trim()) {
      return { error: "Select an existing asset or type what's needed." };
    }
    const qty = Number(quantityNeeded);
    if (!qty || qty <= 0) return { error: "Quantity must be greater than 0." };

    const now = nowIso();
    const req = {
      id: uid(),
      assetId: assetId || null,
      itemName: assetId ? null : String(itemName).trim(),
      quantityNeeded: qty,
      priority,
      reason: String(reason || "").trim() || null,
      status: "pending",
      createdAt: now,
      resolvedAt: null,
    };

    setState((prev) => {
      const label = req.itemName || assets.find((a) => a.id === assetId)?.name || "item";
      const alert = makeAlert("requirement", assetId || null, `New stock request: ${label} x${qty}`, req.id);
      return { ...prev, requirements: [req, ...prev.requirements], alerts: [...prev.alerts, alert] };
    });

    return { ok: true };
  };

  const setRequirementStatus = (id, status) => {
    const now = nowIso();
    setState((prev) => ({
      ...prev,
      requirements: prev.requirements.map((r) => (r.id === id ? { ...r, status, resolvedAt: now } : r)),
    }));
  };

  // ---------- Alerts ----------
  const markAlertRead = (id) => {
    setState((prev) => ({
      ...prev,
      alerts: prev.alerts.map((a) => (a.id === id ? { ...a, status: "read" } : a)),
    }));
  };

  // ---------- Reset ----------
  const resetAllData = () => {
    if (!window.confirm("Clear ALL local data (assets, history, movements, requirements, alerts)? This cannot be undone.")) return;
    setState(emptyState());
    setToast("All local data cleared");
  };

  // ---------- Derived ----------
  const filteredAssets = useMemo(() => {
    let list = assets;
    if (selectedCategory !== "All") list = list.filter((a) => a.category === selectedCategory);
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((a) =>
      [a.name, a.category, a.serial, a.status, a.location, a.assignedTo, a.comments]
        .filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }, [assets, search, selectedCategory]);

  const totalValue = filteredAssets.reduce((s, a) => s + Number(a.value ?? 0) * Number(a.quantity ?? 1), 0);

  const NAV = [
    { id: "dashboard", icon: "▦", label: "Dashboard" },
    { id: "assets", icon: "☰", label: "Asset Registry" },
    { id: "add", icon: "+", label: "Add Asset" },
    { id: "stock", icon: "🔄", label: "Stock In/Out" },
    { id: "requirements", icon: "🧾", label: "Requirements" },
    { id: "alerts", icon: "🔔", label: "Alerts" },
  ];

  const TITLES = {
    dashboard: ["Dashboard", "Overview of your IT inventory"],
    assets: ["Asset Registry", `${filteredAssets.length} record(s) · ZMW ${totalValue.toLocaleString()}`],
    add: ["Add New Asset", "Register a new IT asset"],
    stock: ["Stock In / Out", "Record inventory movements"],
    requirements: ["Requirements", "Request or review inventory needs"],
    alerts: ["Alerts", "Low stock, deadstock, and requests"],
  };

  return (
    <div className={`app-shell${sidebarOpen ? " sidebar-expanded" : " sidebar-collapsed"}`}>

      {/* ── SIDEBAR ── */}
      <aside className="sidebar">
        <div className="sidebar-top">
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen((o) => !o)}
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <span className="toggle-bar" /><span className="toggle-bar" /><span className="toggle-bar" />
          </button>
        </div>

        <nav className="sidebar-nav">
          {sidebarOpen && <div className="nav-section-label">Menu</div>}
          {NAV.map((t) => (
            <button
              key={t.id}
              className={`nav-item${activeTab === t.id ? " active" : ""}`}
              onClick={() => setActiveTab(t.id)}
              title={!sidebarOpen ? t.label : undefined}
            >
              <span className="nav-icon">{t.icon}</span>
              {sidebarOpen && <span className="nav-label">{t.label}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="theme-toggle" onClick={() => setDarkMode((d) => !d)}>
            <span className="nav-icon">{darkMode ? "☀️" : "🌙"}</span>
            {sidebarOpen && <span className="nav-label">{darkMode ? "Light Mode" : "Dark Mode"}</span>}
          </button>
          <button className="theme-toggle" onClick={resetAllData} title="Clear all local data">
            <span className="nav-icon">🗑</span>
            {sidebarOpen && <span className="nav-label">Reset Data</span>}
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="main-content">

        <header className="top-header">
          <div className="header-left">
            <h1 className="page-title">{TITLES[activeTab]?.[0]}</h1>
            <span className="page-sub">{TITLES[activeTab]?.[1]}</span>
          </div>

          <div className="header-right">
            {activeTab === "assets" && (
              <>
                <input
                  className="search-input"
                  placeholder="🔍  Search…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select className="cat-select" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                  <option value="All">All Categories</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <button className="hdr-btn green" onClick={() => exportToExcel(filteredAssets)}>⬇ Export</button>
              </>
            )}
          </div>

          <img src={logo} alt="Tactivo Technologies" className="header-logo" />
        </header>

        <div className="content-area">
          {activeTab === "dashboard" && (
            <Dashboard assets={assets} history={history} onNavigate={setActiveTab} />
          )}
          {activeTab === "assets" && (
            <AssetTable
              assets={filteredAssets}
              onEdit={setEditAsset}
              onDelete={deleteAsset}
              onHistory={(a) => setHistoryAsset(a)}
              canWrite={true}
            />
          )}
          {activeTab === "add" && (
            <AssetForm onAdd={addAsset} categories={CATEGORIES} statuses={STATUSES} />
          )}
          {activeTab === "stock" && (
            <StockMovements assets={assets} movements={stockMovements} onRecordMovement={recordMovement} />
          )}
          {activeTab === "requirements" && (
            <Requirements
              assets={assets}
              requirements={requirements}
              onSubmit={submitRequirement}
              onSetStatus={setRequirementStatus}
            />
          )}
          {activeTab === "alerts" && (
            <AlertsPanel alerts={alerts} onMarkRead={markAlertRead} onRunDeadstockCheck={runDeadstockCheck} />
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
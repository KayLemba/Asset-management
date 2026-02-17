import { useEffect, useMemo, useState } from "react";
import AssetForm from "./components/AssetForm";
import AssetTable from "./components/AssetTable";
import EditModal from "./components/EditModal";
import Toast from "./components/Toast";
import { exportToExcel } from "./utils/exportExcel";
import logo from "./assets/logo.png";

const CATEGORIES = [
  "Laptop",
  "CPU",
  "Desktop",
  "Workstation",
  "Monitor",
  "Server",
  "NAS Storage",
  "External Hard Drive",
  "UPS",
  "IP Phone",
  "Headset",
  "Keyboard",
  "Mouse",
  "Charger",
  "Docking Station",
  "Webcam",
  "Printer",
  "Scanner",
  "Photocopier",
  "Router",
  "Switch",
  "Firewall",
  "Access Point",
  "Modem",
  "Projector",
  "Camera",
  "NVR",
  "Tablet",
  "Mobile Phone",
  "Battery",
  "Inverter",
  "Other",
];

const STATUSES = ["In Use", "In Store", "Repair", "Retired", "Stolen", "Cant be fixed", "Fixed and ready for Use"];

function safeParseJSON(value, fallback) {
  try {
    if (!value) return fallback;
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
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
    quantity: Number(a?.quantity ?? 1) || 1,
    value: Number(a?.value ?? 0) || 0,
    createdAt: a?.createdAt ?? new Date().toISOString(),
    updatedAt: a?.updatedAt ?? new Date().toISOString(),
  };
}

function App() {
  const [assets, setAssets] = useState(() => {
    const saved = safeParseJSON(localStorage.getItem("assets"), []);
    return saved.map(normalizeAsset);
  });

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [editAsset, setEditAsset] = useState(null);
  const [toast, setToast] = useState(null);

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

  useEffect(() => {
    localStorage.setItem("assets", JSON.stringify(assets));
  }, [assets]);

  // Category counts (sum of quantities per category)
  const categoryCounts = useMemo(() => {
    const acc = {};
    for (const a of assets) {
      const cat = (a.category || "Other").trim() || "Other";
      acc[cat] = (acc[cat] || 0) + Number(a.quantity ?? 1);
    }
    return acc;
  }, [assets]);

  // Filter = category + search
  const filteredAssets = useMemo(() => {
    let list = assets;

    if (selectedCategory !== "All") {
      list = list.filter((a) => a.category === selectedCategory);
    }

    const q = search.trim().toLowerCase();
    if (!q) return list;

    return list.filter((a) => {
      const haystack = [
        a.name,
        a.category,
        a.serial,
        a.status,
        a.location,
        a.assignedTo,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [assets, search, selectedCategory]);

  // Totals reflect the current filter
  const totalRecords = filteredAssets.length;
  const totalDevices = filteredAssets.reduce(
    (sum, a) => sum + Number(a.quantity ?? 1),
    0
  );
  const totalValue = filteredAssets.reduce(
    (sum, a) => sum + Number(a.value ?? 0) * Number(a.quantity ?? 1),
    0
  );

  // Extra: category-specific record count (for the selected category)
  const selectedCategoryRecords =
    selectedCategory === "All"
      ? assets.length
      : assets.filter((a) => a.category === selectedCategory).length;

  const selectedCategoryDevices =
    selectedCategory === "All"
      ? assets.reduce((s, a) => s + Number(a.quantity ?? 1), 0)
      : categoryCounts[selectedCategory] || 0;

  const addAsset = (asset) => {
    const normalized = normalizeAsset({
      ...asset,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (!normalized.name || !normalized.category) {
      setToast("Please fill in Asset Name and Category.");
      return;
    }

    setAssets((prev) => [normalized, ...prev]);
    setToast("Asset added successfully");
  };

  const updateAsset = (asset) => {
    const normalized = normalizeAsset({
      ...asset,
      updatedAt: new Date().toISOString(),
    });

    if (!normalized.name || !normalized.category) {
      setToast("Asset Name and Category are required.");
      return;
    }

    setAssets((prev) =>
      prev.map((a) => (a.id === normalized.id ? normalized : a))
    );
    setEditAsset(null);
    setToast("Asset updated successfully");
  };

  const deleteAsset = (id) => {
    const ok = window.confirm("Delete this asset? This cannot be undone.");
    if (!ok) return;

    setAssets((prev) => prev.filter((a) => a.id !== id));
    setToast("Asset deleted");
  };

  return (
    <div className="container">
      <img src={logo} alt="Logo" className="top-logo" />
      <h1>💻 Office Asset Management</h1>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* Totals now match the selected category + search */}
      <div className="dashboard-cards">
        <div className="card summary">
          <h3>
            Total Records {selectedCategory !== "All" ? `(${selectedCategory})` : ""}
          </h3>
          <p>{totalRecords}</p>
        </div>

        <div className="card summary">
          <h3>
            Total Devices {selectedCategory !== "All" ? `(${selectedCategory})` : ""}
          </h3>
          <p>{totalDevices}</p>
        </div>

        <div className="card summary">
          <h3>
            Total Asset Value {selectedCategory !== "All" ? `(${selectedCategory})` : ""}
          </h3>
          <p>ZMW {totalValue.toLocaleString()}</p>
        </div>
      </div>

      {/* ✅ NEW PROFESSIONAL CATEGORY SELECTOR (replaces tiles) */}
      <div className="card">
        <div className="category-header">
          <h2>Category Filter</h2>

          <div className="category-controls">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Select category"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <button
              className="btn ghost"
              onClick={() => setSelectedCategory("All")}
              disabled={selectedCategory === "All"}
              title="Clear category filter"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="category-selected">
          <div>
            <div className="muted">Selected Category</div>
            <div className="selected-title">
              {selectedCategory === "All" ? "All Categories" : selectedCategory}
            </div>
          </div>

          <div className="selected-metrics">
            <div className="metric">
              <span className="muted">Devices</span>
              <strong>{selectedCategoryDevices}</strong>
            </div>

            <div className="metric">
              <span className="muted">Records</span>
              <strong>{selectedCategoryRecords}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="top-bar">
        <input
          placeholder="Search (name, serial, status, location...)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button
          className="btn ghost"
          onClick={() => setDarkMode((d) => !d)}
          aria-pressed={darkMode}
          title="Toggle dark mode"
        >
          {darkMode ? "☀️ Light" : "🌙 Dark"}
        </button>

        <button className="btn green" onClick={() => exportToExcel(filteredAssets)}>
          Export Excel
        </button>
      </div>

      <AssetForm onAdd={addAsset} categories={CATEGORIES} statuses={STATUSES} />

      <AssetTable assets={filteredAssets} onEdit={setEditAsset} onDelete={deleteAsset} />

      {editAsset && (
        <EditModal
          asset={editAsset}
          categories={CATEGORIES}
          statuses={STATUSES}
          onSave={updateAsset}
          onClose={() => setEditAsset(null)}
        />
      )}
    </div>
  );
}

export default App;

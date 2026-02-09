import { useEffect, useState } from "react";
import AssetForm from "./components/AssetForm";
import AssetTable from "./components/AssetTable";
import EditModal from "./components/EditModal";
import Toast from "./components/Toast";
import { exportToExcel } from "./utils/exportExcel";
import logo from "./assets/logo.png";

const CATEGORIES = [
  "Laptop","Desktop","Monitor","Server","IP Phone","Headset",
  "Keyboard","Mouse","Charger","Router","Switch","Printer",
  "Scanner","UPS","Tablet","Projector","Camera","Docking Station","Other"
];

function App() {
  const [assets, setAssets] = useState(
    JSON.parse(localStorage.getItem("assets")) || []
  );
  const [search, setSearch] = useState("");
  const [editAsset, setEditAsset] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    localStorage.setItem("assets", JSON.stringify(assets));
  }, [assets]);

  const filteredAssets = assets.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalValue = filteredAssets.reduce(
    (sum, a) =>
      sum + Number(a.value || 0) * Number(a.quantity || 1),
    0
  );

  const addAsset = asset => {
    setAssets([...assets, { ...asset, id: Date.now() }]);
    setToast("Asset added successfully");
  };

  const updateAsset = asset => {
    setAssets(assets.map(a => (a.id === asset.id ? asset : a)));
    setEditAsset(null);
    setToast("Asset updated successfully");
  };

  const deleteAsset = id => {
    setAssets(assets.filter(a => a.id !== id));
    setToast("Asset deleted");
  };

  return (
    <div className="container">
      <img src={logo} alt="Logo" className="top-logo" />
      <h1>📦 Office Asset Management</h1>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      <div className="top-bar">
        <input
          placeholder="Search by asset name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <button
          className="btn ghost"
          onClick={() => document.body.classList.toggle("dark")}
        >
          🌙 Dark Mode
        </button>

        <button
          className="btn green"
          onClick={() => exportToExcel(filteredAssets)}
        >
          Export Excel
        </button>
      </div>

      <AssetForm onAdd={addAsset} categories={CATEGORIES} />

      <AssetTable
        assets={filteredAssets}
        onEdit={setEditAsset}
        onDelete={deleteAsset}
        totalValue={totalValue}
      />

      {editAsset && (
        <EditModal
          asset={editAsset}
          categories={CATEGORIES}
          onSave={updateAsset}
          onClose={() => setEditAsset(null)}
        />
      )}
    </div>
  );
}

export default App;

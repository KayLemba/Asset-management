import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AssetForm from "./components/AssetForm";
import AssetTable from "./components/AssetTable";
import EditModal from "./components/EditModal";
import Toast from "./components/Toast";
import Dashboard from "./components/Dashboard";
import HistoryModal from "./components/HistoryModal";
import StockMovements from "./components/StockMovements";
import Requirements from "./components/Requirements";
import AlertsPanel from "./components/AlertsPanel";
import TrashView from "./components/TrashView";
import CheckoutModal from "./components/CheckoutModal";
import BulkEditModal from "./components/BulkEditModal";
import ImportModal from "./components/ImportModal";
import Login from "./components/Login";
import Signup from "./components/Signup";
import ManageUsers from "./components/ManageUsers";
import { useAuth } from "./context/AuthContext";
import { downloadBackup, parseBackupFile } from "./utils/backup";
import { exportToExcel } from "./utils/exportExcel";
import { replaceUsers } from "./lib/localAuth";
import mark from "./assets/tactivo-mark.png";
import Icon from "./components/Icon";

export const CATEGORIES = [
  "Laptop", "CPU", "Desktop", "Workstation", "Monitor", "Server", "NAS Storage",
  "External Hard Drive", "UPS", "IP Phone", "Headset", "Keyboard", "TV", "Mouse",
  "Charger", "Docking Station", "Webcam", "Printer", "Scanner", "Photocopier",
  "Router", "Switch", "Firewall", "Access Point", "Modem", "Projector", "Camera",
  "NVR", "Tablet", "Mobile Phone", "Battery", "Inverter",
  "Drill", "Grinder", "Probe", "Multimeter", "Soldering Iron", "Screwdriver Set",
  "Crimping Tool", "Cable Tester", "Power Tool",
  "LAN Cable", "Fiber Optic Cable", "Patch Panel", "Network Rack", "PoE Injector",
  "Fuel Dispenser", "Fuel Level Probe", "ATG (Automatic Tank Gauge)",
  "Fuel Flow Meter", "Fuel Pump Controller", "Solenoid Valve", "Fuel Management System", "Tank Sensor",
  "Other",
];

export const STATUSES = [
  "In Use", "In Storage", "Repair", "Retired", "Lost", "Cant be fixed", "Fixed and ready for Use",
];

const STORAGE_KEY = "tactivo_data_v1";
const DEADSTOCK_DAYS = 90;
const WARRANTY_WARNING_DAYS = 30;
const TRASH_ROLES = ["admin", "supervisor"];

function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function nextSingleDigit(used) {
  for (let digit = 1; digit <= 9; digit += 1) {
    if (!used.has(String(digit))) return String(digit);
  }
  return String((used.size % 9) + 1);
}

function normalizeVisibleAssetIds(assets) {
  const used = new Set();
  return (assets || []).map((asset) => {
    const supplied = String(asset.assetId || "").trim();
    const assetId = /^[1-9]$/.test(supplied) && !used.has(supplied) ? supplied : nextSingleDigit(used);
    used.add(assetId);
    return { ...asset, assetId };
  });
}

function nextAssetId(assets) {
  const used = new Set((assets || []).map((asset) => String(asset.assetId || "").trim()).filter((value) => /^[1-9]$/.test(value)));
  return nextSingleDigit(used);
}

function emptyState() {
  return { assets: [], history: {}, stockMovements: [], requirements: [], alerts: [] };
}

function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    return normalizeState(parsed);
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
  return alerts.some((alert) => alert.type === type && alert.assetId === assetId && alert.status === "unread");
}

function normalizeState(state) {
  const source = state || emptyState();
  return {
    assets: normalizeVisibleAssetIds(Array.isArray(source.assets) ? source.assets : []),
    history: source.history && typeof source.history === "object" ? source.history : {},
    stockMovements: Array.isArray(source.stockMovements) ? source.stockMovements : [],
    requirements: Array.isArray(source.requirements) ? source.requirements : [],
    alerts: Array.isArray(source.alerts) ? source.alerts : [],
  };
}

export default function App() {
  const { user, role, loading: authLoading, signOut } = useAuth();
  const [authScreen, setAuthScreen] = useState("login");
  const [state, setState] = useState(loadState);
  const { assets, history, stockMovements, requirements, alerts } = state;

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [editAsset, setEditAsset] = useState(null);
  const [toast, setToast] = useState(null);
  const [historyAsset, setHistoryAsset] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [checkoutTarget, setCheckoutTarget] = useState(null);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [requestPopup, setRequestPopup] = useState(null);
  const backupFileRef = useRef(null);
  const handledRequestRef = useRef(null);
  const canReviewRequirements = role === "admin" || role === "supervisor";

  const playRequestNotificationSound = () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const context = new AudioContextClass();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(740, context.currentTime);
      oscillator.frequency.setValueAtTime(980, context.currentTime + 0.12);
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.16, context.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.32);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.34);
      oscillator.addEventListener("ended", () => context.close());
    } catch (e) {}
  };

  useEffect(() => {
    if (!canReviewRequirements) return undefined;
    const receiveRequest = (data) => {
      if (!data || !data.id || handledRequestRef.current === data.id) return;
      handledRequestRef.current = data.id;
      setRequestPopup(data);
      playRequestNotificationSound();
    };
    const storageHandler = (event) => {
      if (event.key !== "tactivo_request_signal" || !event.newValue) return;
      try { receiveRequest(JSON.parse(event.newValue)); } catch (e) {}
    };
    window.addEventListener("storage", storageHandler);
    let channel = null;
    if (typeof window.BroadcastChannel !== "undefined") {
      channel = new window.BroadcastChannel("tactivo_request_notifications");
      channel.onmessage = (event) => receiveRequest(event.data);
    }
    return () => {
      window.removeEventListener("storage", storageHandler);
      if (channel) channel.close();
    };
  }, [canReviewRequirements]);

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

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save data locally:", error);
    }
  }, [state]);

  const canWrite = role === "admin" || role === "supervisor";
  const canManageTrash = TRASH_ROLES.includes(role);
  const isAdmin = role === "admin";

  const runChecks = useCallback(() => {
    setState((previous) => {
      const now = Date.now();
      const deadstockCutoff = DEADSTOCK_DAYS * 24 * 60 * 60 * 1000;
      const warrantyWarning = WARRANTY_WARNING_DAYS * 24 * 60 * 60 * 1000;
      const newAlerts = [];

      for (const asset of previous.assets) {
        if (asset.deletedAt) continue;
        const lastMoved = asset.lastMovementAt
          ? new Date(asset.lastMovementAt).getTime()
          : new Date(asset.createdAt).getTime();
        if (Number.isFinite(lastMoved) && now - lastMoved >= deadstockCutoff && !hasUnreadAlert(previous.alerts, "deadstock", asset.id)) {
          newAlerts.push(makeAlert("deadstock", asset.id, `${asset.name} has had no stock movement in 90+ days`));
        }

        if (asset.warrantyExpiry) {
          const expiry = new Date(asset.warrantyExpiry).getTime();
          if (Number.isFinite(expiry) && expiry < now && !hasUnreadAlert(previous.alerts, "warranty_expired", asset.id)) {
            newAlerts.push(makeAlert("warranty_expired", asset.id, `${asset.name} warranty expired on ${new Date(asset.warrantyExpiry).toLocaleDateString()}`));
          } else if (Number.isFinite(expiry) && expiry >= now && expiry - now <= warrantyWarning && !hasUnreadAlert(previous.alerts, "warranty_expiring", asset.id)) {
            newAlerts.push(makeAlert("warranty_expiring", asset.id, `${asset.name} warranty expires ${new Date(asset.warrantyExpiry).toLocaleDateString()}`));
          }
        }

        if (asset.checkedOutAt && asset.dueBack) {
          const due = new Date(asset.dueBack).getTime();
          if (Number.isFinite(due) && due < now && !hasUnreadAlert(previous.alerts, "overdue_checkout", asset.id)) {
            newAlerts.push(makeAlert("overdue_checkout", asset.id, `${asset.name} checked out to ${asset.assignedTo} is overdue (was due ${new Date(asset.dueBack).toLocaleDateString()})`));
          }
        }
      }
      return newAlerts.length ? { ...previous, alerts: [...previous.alerts, ...newAlerts] } : previous;
    });
  }, []);

  useEffect(() => { runChecks(); }, [runChecks]);

  const addAsset = (payload) => {
    if (!canWrite) {
      setToast("Only admins and supervisors can add assets.");
      return;
    }
    if (!payload.name || !payload.category) {
      setToast("Please fill in Asset Name and Category.");
      return;
    }
    const now = nowIso();
    const asset = {
      id: uid(),
      assetId: String(payload.assetId || "").trim(),
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
      purchaseDate: payload.purchaseDate || "",
      warrantyExpiry: payload.warrantyExpiry || "",
      checkedOutAt: null,
      dueBack: null,
      lastMovementAt: null,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    setState((previous) => {
      const requestedId = /^[1-9]$/.test(asset.assetId) && !previous.assets.some((candidate) => candidate.assetId === asset.assetId)
        ? asset.assetId
        : nextAssetId(previous.assets);
      const savedAsset = { ...asset, assetId: requestedId };
      const newHistory = { ...previous.history, [savedAsset.id]: [{ date: now, field: "Created", from: "—", to: savedAsset.status }] };
      const newAlerts = savedAsset.quantity < savedAsset.minQuantity
        ? [...previous.alerts, makeAlert("low_stock", savedAsset.id, `${savedAsset.name} is below minimum stock (${savedAsset.quantity}/${savedAsset.minQuantity})`)]
        : previous.alerts;
      return { ...previous, assets: [savedAsset, ...previous.assets], history: newHistory, alerts: newAlerts };
    });
    setToast("Asset added successfully");
    setActiveTab("assets");
  };

  const updateAsset = (asset) => {
    if (!canWrite) return;
    if (!asset.name || !asset.category) {
      setToast("Asset Name and Category are required.");
      return;
    }
    const now = nowIso();
    setState((previous) => {
      const old = previous.assets.find((candidate) => candidate.id === asset.id);
      if (!old) return previous;
      const updated = {
        ...old,
        ...asset,
        quantity: Number(asset.quantity || 1),
        minQuantity: Number(asset.minQuantity || 0),
        value: Number(asset.value || 0),
        purchaseDate: asset.purchaseDate || "",
        warrantyExpiry: asset.warrantyExpiry || "",
        updatedAt: now,
      };
      const trackedFields = [
        "assetId", "status", "assignedTo", "location", "category", "name", "serial", "quantity", "minQuantity", "value", "comments", "purchaseDate", "warrantyExpiry",
      ];
      const entries = trackedFields
        .filter((field) => String(old[field] ?? "") !== String(updated[field] ?? ""))
        .map((field) => ({ date: now, field, from: String(old[field] ?? "—"), to: String(updated[field] ?? "—") }));
      const newHistory = entries.length ? { ...previous.history, [asset.id]: [...(previous.history[asset.id] || []), ...entries] } : previous.history;
      const newAlerts = updated.quantity < updated.minQuantity && !hasUnreadAlert(previous.alerts, "low_stock", asset.id)
        ? [...previous.alerts, makeAlert("low_stock", asset.id, `${updated.name} is below minimum stock (${updated.quantity}/${updated.minQuantity})`)]
        : previous.alerts;
      return {
        ...previous,
        assets: previous.assets.map((candidate) => candidate.id === asset.id ? updated : candidate),
        history: newHistory,
        alerts: newAlerts,
      };
    });
    setEditAsset(null);
    setToast("Asset updated successfully");
  };

  const deleteAsset = (id) => {
    if (!canWrite || !window.confirm("Move this asset to Trash?")) return;
    const now = nowIso();
    setState((previous) => {
      const old = previous.assets.find((asset) => asset.id === id);
      if (!old || old.deletedAt) return previous;
      const historyEntry = { date: now, field: "Deleted", from: old.status, to: "Trash" };
      return {
        ...previous,
        assets: previous.assets.map((asset) => asset.id === id ? { ...asset, deletedAt: now, updatedAt: now } : asset),
        history: { ...previous.history, [id]: [...(previous.history[id] || []), historyEntry] },
      };
    });
    setSelectedIds((previous) => { const next = new Set(previous); next.delete(id); return next; });
    setToast("Asset moved to Trash");
  };

  const bulkDeleteAssets = () => {
    if (!canWrite || selectedIds.size === 0 || !window.confirm(`Move ${selectedIds.size} asset(s) to Trash?`)) return;
    const selected = new Set(selectedIds);
    const now = nowIso();
    setState((previous) => {
      const newHistory = { ...previous.history };
      const updatedAssets = previous.assets.map((asset) => {
        if (!selected.has(asset.id) || asset.deletedAt) return asset;
        newHistory[asset.id] = [...(newHistory[asset.id] || []), { date: now, field: "Deleted", from: asset.status, to: "Trash" }];
        return { ...asset, deletedAt: now, updatedAt: now };
      });
      return { ...previous, assets: updatedAssets, history: newHistory };
    });
    setSelectedIds(new Set());
    setToast(`${selected.size} asset(s) moved to Trash`);
  };

  const bulkEditAssets = (patch) => {
    if (!canWrite || selectedIds.size === 0) return;
    const selected = new Set(selectedIds);
    const now = nowIso();
    setState((previous) => {
      const newHistory = { ...previous.history };
      const updatedAssets = previous.assets.map((asset) => {
        if (!selected.has(asset.id) || asset.deletedAt) return asset;
        const entries = Object.entries(patch)
          .filter(([field, value]) => String(asset[field] ?? "") !== String(value ?? ""))
          .map(([field, value]) => ({ date: now, field, from: String(asset[field] ?? "—"), to: String(value ?? "—") }));
        if (entries.length) newHistory[asset.id] = [...(newHistory[asset.id] || []), ...entries];
        return { ...asset, ...patch, updatedAt: now };
      });
      return { ...previous, assets: updatedAssets, history: newHistory };
    });
    setSelectedIds(new Set());
    setShowBulkEdit(false);
    setToast(`${selected.size} asset(s) updated`);
  };

  const restoreAsset = (id) => {
    if (!canManageTrash) return;
    const now = nowIso();
    setState((previous) => {
      const old = previous.assets.find((asset) => asset.id === id);
      if (!old) return previous;
      return {
        ...previous,
        assets: previous.assets.map((asset) => asset.id === id ? { ...asset, deletedAt: null, updatedAt: now } : asset),
        history: { ...previous.history, [id]: [...(previous.history[id] || []), { date: now, field: "Restored", from: "Trash", to: old.status }] },
      };
    });
    setToast("Asset restored");
  };

  const permanentlyDeleteAsset = (id) => {
    if (!canManageTrash || !window.confirm("Permanently delete this asset? This cannot be undone.")) return;
    setState((previous) => {
      const { [id]: removed, ...remainingHistory } = previous.history;
      return { ...previous, assets: previous.assets.filter((asset) => asset.id !== id), history: remainingHistory };
    });
    setToast("Asset permanently deleted");
  };

  const checkOutAsset = (id, { assignedTo, dueBack }) => {
    if (!canWrite) return;
    const now = nowIso();
    setState((previous) => {
      const old = previous.assets.find((asset) => asset.id === id && !asset.deletedAt);
      if (!old) return previous;
      const updated = { ...old, assignedTo, dueBack, checkedOutAt: now, updatedAt: now };
      const entries = [{ date: now, field: "checkedOutAt", from: "—", to: assignedTo }];
      if (String(old.assignedTo || "") !== assignedTo) entries.push({ date: now, field: "assignedTo", from: old.assignedTo || "—", to: assignedTo });
      if (dueBack) entries.push({ date: now, field: "dueBack", from: old.dueBack || "—", to: dueBack });
      return {
        ...previous,
        assets: previous.assets.map((asset) => asset.id === id ? updated : asset),
        history: { ...previous.history, [id]: [...(previous.history[id] || []), ...entries] },
      };
    });
    setCheckoutTarget(null);
    setToast("Asset checked out");
  };

  const checkInAsset = (id) => {
    if (!canWrite) return;
    const now = nowIso();
    setState((previous) => {
      const old = previous.assets.find((asset) => asset.id === id);
      if (!old) return previous;
      return {
        ...previous,
        assets: previous.assets.map((asset) => asset.id === id ? { ...asset, checkedOutAt: null, dueBack: null, updatedAt: now } : asset),
        history: { ...previous.history, [id]: [...(previous.history[id] || []), { date: now, field: "checkedOutAt", from: old.assignedTo || "—", to: "Checked In" }] },
      };
    });
    setToast("Asset checked in");
  };

  const importAssets = (rows) => {
    if (!canWrite || !rows?.length) return;
    const now = nowIso();
    let importedCount = 0;
    setState((previous) => {
      const used = new Set(previous.assets.map((asset) => String(asset.assetId || "").trim()).filter((value) => /^[1-9]$/.test(value)));
      const newAssets = rows.map((payload) => {
        const requestedId = String(payload.assetId || "").trim();
        const assetId = /^[1-9]$/.test(requestedId) && !used.has(requestedId) ? requestedId : nextSingleDigit(used);
        used.add(assetId);
        return {
          id: uid(),
          assetId,
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
          purchaseDate: payload.purchaseDate || "",
          warrantyExpiry: payload.warrantyExpiry || "",
          checkedOutAt: null,
          dueBack: null,
          lastMovementAt: null,
          deletedAt: null,
          createdAt: now,
          updatedAt: now,
        };
      });
      importedCount = newAssets.length;
      const newHistory = { ...previous.history };
      const newAlerts = [...previous.alerts];
      newAssets.forEach((asset) => {
        newHistory[asset.id] = [{ date: now, field: "Imported", from: "—", to: asset.status }];
        if (asset.quantity < asset.minQuantity) newAlerts.push(makeAlert("low_stock", asset.id, `${asset.name} is below minimum stock (${asset.quantity}/${asset.minQuantity})`));
      });
      return { ...previous, assets: [...newAssets, ...previous.assets], history: newHistory, alerts: newAlerts };
    });
    setShowImport(false);
    setActiveTab("assets");
    setToast(`${importedCount} asset(s) imported`);
  };

  const toggleSelect = (id) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (visibleAssets) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      const allSelected = visibleAssets.length > 0 && visibleAssets.every((asset) => next.has(asset.id));
      visibleAssets.forEach((asset) => allSelected ? next.delete(asset.id) : next.add(asset.id));
      return next;
    });
  };

  const recordMovement = ({ assetId, type, quantity, note }) => {
    if (!canWrite) return { error: "Only admins and supervisors can record stock movements." };
    if (!assetId) return { error: "Select an asset." };
    const qty = Number(quantity);
    if (!qty || qty <= 0) return { error: "Quantity must be greater than 0." };
    const asset = assets.find((candidate) => candidate.id === assetId && !candidate.deletedAt);
    if (!asset) return { error: "Asset not found." };
    if (type === "out" && qty > asset.quantity) return { error: `Only ${asset.quantity} in stock — cannot remove ${qty}.` };
    const now = nowIso();
    const newQuantity = asset.quantity + (type === "in" ? qty : -qty);
    setState((previous) => {
      const updatedAssets = previous.assets.map((candidate) => candidate.id === assetId ? { ...candidate, quantity: newQuantity, lastMovementAt: now, updatedAt: now } : candidate);
      const historyEntry = { date: now, field: type === "in" ? "stock_in" : "stock_out", from: "—", to: String(qty) };
      const newHistory = { ...previous.history, [assetId]: [...(previous.history[assetId] || []), historyEntry] };
      const newAlerts = newQuantity < asset.minQuantity && !hasUnreadAlert(previous.alerts, "low_stock", assetId)
        ? [...previous.alerts, makeAlert("low_stock", asset.id, `${asset.name} is below minimum stock (${newQuantity}/${asset.minQuantity})`)]
        : previous.alerts;
      return { ...previous, assets: updatedAssets, history: newHistory, alerts: newAlerts, stockMovements: [{ id: uid(), assetId, type, quantity: qty, note: note || null, createdAt: now }, ...previous.stockMovements] };
    });
    return { ok: true };
  };

  const submitRequirement = ({ assetId, itemName, quantityNeeded, priority, reason }) => {
    const label = String(itemName || "").trim();
    if (!assetId && !label) return { error: "Select an existing asset or type what's needed." };
    const quantity = Number(quantityNeeded);
    if (!quantity || quantity <= 0) return { error: "Quantity must be greater than 0." };
    const now = nowIso();
    const requirement = {
      id: uid(),
      assetId: assetId || null,
      itemName: assetId ? null : label,
      quantityNeeded: quantity,
      priority,
      reason: String(reason || "").trim() || null,
      status: "pending",
      createdAt: now,
      resolvedAt: null,
      createdBy: user?.id || null,
      createdByName: user?.fullName || user?.email || "Local user",
    };
    setState((previous) => ({
      ...previous,
      requirements: [requirement, ...previous.requirements],
      alerts: [...previous.alerts, makeAlert("requirement", assetId || null, `New stock request: ${assetId ? assets.find((asset) => asset.id === assetId)?.name || "item" : label} x${quantity}`, requirement.id)],
    }));
    if (role === "requester") {
      const requestSignal = { id: requirement.id, name: requirement.itemName || assets.find(a => a.id === assetId)?.name || "item", by: requirement.createdByName, at: now };
      window.localStorage.setItem("tactivo_request_signal", JSON.stringify(requestSignal));
      if (typeof window.BroadcastChannel !== "undefined") {
        const channel = new window.BroadcastChannel("tactivo_request_notifications");
        channel.postMessage(requestSignal);
        channel.close();
      }
    }
    return { ok: true };
  };

  const setRequirementStatus = (id, status) => {
    if (!canReviewRequirements) return { error: "Only admins and supervisors can approve, reject, or fulfill requests." };
    if (!["approved", "rejected", "fulfilled"].includes(status)) return { error: "Unsupported requirement status." };
    const now = nowIso();
    setState((previous) => ({ ...previous, requirements: previous.requirements.map((item) => item.id === id ? { ...item, status, resolvedAt: now, reviewedBy: user?.id || null } : item) }));
    return { ok: true };
  };

  const updateRequirement = (id, patch) => {
    const current = requirements.find((item) => item.id === id);
    if (!current) return { error: "Requirement not found." };
    const canManage = canReviewRequirements || current.createdBy === user?.id;
    if (!canManage) return { error: "You can only edit your own requests." };
    if (current.status !== "pending") return { error: "Only pending requests can be edited." };
    const label = String(patch.itemName || "").trim();
    const quantity = Number(patch.quantityNeeded);
    if (!patch.assetId && !label) return { error: "Select an existing asset or type what's needed." };
    if (!quantity || quantity <= 0) return { error: "Quantity must be greater than 0." };
    const now = nowIso();
    setState((previous) => ({
      ...previous,
      requirements: previous.requirements.map((item) => item.id === id ? {
        ...item,
        assetId: patch.assetId || null,
        itemName: patch.assetId ? null : label,
        quantityNeeded: quantity,
        priority: patch.priority,
        reason: String(patch.reason || "").trim() || null,
        updatedAt: now,
      } : item),
    }));
    return { ok: true };
  };

  const deleteRequirement = (id) => {
    const current = requirements.find((item) => item.id === id);
    if (!current) return { error: "Requirement not found." };
    const canManage = canReviewRequirements || current.createdBy === user?.id;
    if (!canManage) return { error: "You can only delete your own requests." };
    if (current.status !== "pending") return { error: "Only pending requests can be deleted." };
    setState((previous) => ({
      ...previous,
      requirements: previous.requirements.filter((item) => item.id !== id),
      alerts: previous.alerts.filter((alert) => alert.relatedId !== id),
    }));
    return { ok: true };
  };

  const markAlertRead = (id) => {
    setState((previous) => ({ ...previous, alerts: previous.alerts.map((alert) => alert.id === id ? { ...alert, status: "read" } : alert) }));
  };

  const exportBackupData = () => {
    downloadBackup(state);
    setToast("Backup downloaded");
  };

  const handleRestoreFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !isAdmin) return;
    if (!window.confirm("Restore from this backup? This will replace all current data and users.")) return;
    try {
      const payload = await parseBackupFile(file);
      setState(normalizeState(payload.state));
      if (Array.isArray(payload.users)) replaceUsers(payload.users);
      setToast("Backup restored — please sign in again");
      signOut();
    } catch (error) {
      setToast(error.message || "Restore failed");
    }
  };

  const resetAllData = () => {
    if (!canManageTrash || !window.confirm("Clear ALL local data (assets, history, movements, requirements, alerts)? This cannot be undone.")) return;
    setState(emptyState());
    setToast("All local data cleared");
  };

  const activeAssets = useMemo(() => assets.filter((asset) => !asset.deletedAt), [assets]);
  const trashedAssets = useMemo(() => assets.filter((asset) => asset.deletedAt), [assets]);
  const filteredAssets = useMemo(() => {
    let list = activeAssets;
    if (selectedCategory !== "All") list = list.filter((asset) => asset.category === selectedCategory);
    const query = search.trim().toLowerCase();
    if (!query) return list;
    return list.filter((asset) => [asset.name, asset.category, asset.serial, asset.status, asset.location, asset.assignedTo, asset.comments, asset.purchaseDate, asset.warrantyExpiry, asset.dueBack].filter(Boolean).join(" ").toLowerCase().includes(query));
  }, [activeAssets, search, selectedCategory]);
  const totalValue = filteredAssets.reduce((sum, asset) => sum + Number(asset.value ?? 0) * Number(asset.quantity ?? 1), 0);

  const navigation = [
    { id: "dashboard", icon: "dashboard", label: "Dashboard" },
    { id: "assets", icon: "list", label: "Asset Registry" },
    { id: "add", icon: "plus", label: "Add Asset" },
    { id: "stock", icon: "transfer", label: "Stock In/Out" },
    { id: "requirements", icon: "requirements", label: "Requirements" },
    { id: "alerts", icon: "alert", label: `Alerts${alerts.filter((alert) => alert.status === "unread").length ? ` (${alerts.filter((alert) => alert.status === "unread").length})` : ""}` },
    canWrite && { id: "users", icon: "users", label: "Manage Users" },
    canManageTrash && { id: "trash", icon: "trash", label: `Trash${trashedAssets.length ? ` (${trashedAssets.length})` : ""}` },
  ].filter(Boolean);

  const titles = {
    dashboard: ["Dashboard", "Overview of your IT inventory"],
    assets: ["Asset Registry", `${filteredAssets.length} record(s) · ZMW ${totalValue.toLocaleString()}`],
    add: ["Add New Asset", "Register a new IT asset"],
    stock: ["Stock In / Out", "Record inventory movements"],
    requirements: ["Requirements", "Request or review inventory needs"],
    alerts: ["Alerts", "Low stock, deadstock, warranty, and overdue checkouts"],
    users: ["Manage Users", "Assign roles to accounts"],
    trash: ["Trash", `${trashedAssets.length} deleted asset(s)`],
  };

  if (authLoading) return <div className="app-shell centered"><p className="muted">Loading…</p></div>;
  if (!user) return authScreen === "signup" ? <Signup onSwitch={() => setAuthScreen("login")} /> : <Login onSwitch={() => setAuthScreen("signup")} />;

  return (
    <div className={`app-shell${sidebarOpen ? " sidebar-expanded" : " sidebar-collapsed"}`}>
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="sidebar-brand" aria-label="Tactivo Technologies">
            <img src={mark} alt="Tactivo" className="sidebar-brand-mark" />
          </div>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen((open) => !open)} title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}>
            <span className="toggle-bar" /><span className="toggle-bar" /><span className="toggle-bar" />
          </button>
        </div>
        <nav className="sidebar-nav">
          {sidebarOpen && <div className="nav-section-label">Menu</div>}
          {navigation.map((item) => (
            <button key={item.id} className={`nav-item${activeTab === item.id ? " active" : ""}`} onClick={() => setActiveTab(item.id)} title={!sidebarOpen ? item.label : undefined}>
              <span className="nav-icon"><Icon name={item.icon} size={16} /></span>{sidebarOpen && <span className="nav-label">{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user" title={user.email}><strong>{user.fullName}</strong><span>{user.role}</span></div>
          <button className="theme-toggle" onClick={() => setDarkMode((dark) => !dark)}><span className="nav-icon"><Icon name={darkMode ? "sun" : "moon"} size={16} /></span>{sidebarOpen && <span className="nav-label">{darkMode ? "Light Mode" : "Dark Mode"}</span>}</button>
          {canWrite && <button className="theme-toggle" onClick={exportBackupData} title="Download a full JSON backup"><span className="nav-icon"><Icon name="download" size={16} /></span>{sidebarOpen && <span className="nav-label">Backup Data</span>}</button>}
          {isAdmin && <><button className="theme-toggle" onClick={() => backupFileRef.current?.click()} title="Restore from a JSON backup"><span className="nav-icon"><Icon name="upload" size={16} /></span>{sidebarOpen && <span className="nav-label">Restore Backup</span>}</button><input ref={backupFileRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleRestoreFile} /></>}
          {canManageTrash && <button className="theme-toggle" onClick={resetAllData} title="Clear all local data"><span className="nav-icon"><Icon name="trash" size={16} /></span>{sidebarOpen && <span className="nav-label">Reset Data</span>}</button>}
          <button className="theme-toggle" onClick={signOut} title="Sign out"><span className="nav-icon"><Icon name="logout" size={16} /></span>{sidebarOpen && <span className="nav-label">Sign Out</span>}</button>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-header">
          <div className="header-left"><h1 className="page-title">{titles[activeTab]?.[0]}</h1><span className="page-sub">{titles[activeTab]?.[1]}</span></div>
          <div className="header-right">
            {activeTab === "assets" && <>
              <input className="search-input" placeholder="Search assets…" value={search} onChange={(event) => setSearch(event.target.value)} />
              <select className="cat-select" value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}><option value="All">All Categories</option>{CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}</select>
              {canWrite && <button className="hdr-btn ghost" onClick={() => setShowImport(true)}><Icon name="upload" size={14} /> Import</button>}
              <button className="hdr-btn green" onClick={() => exportToExcel(filteredAssets)}><Icon name="download" size={14} /> Export</button>
            </>}
          </div>
        </header>

        <div className="content-area">
          {activeTab === "dashboard" && <Dashboard assets={activeAssets} history={history} onNavigate={setActiveTab} />}
          {activeTab === "assets" && <>
            {canWrite && selectedIds.size > 0 && <div className="card bulk-toolbar"><span><strong>{selectedIds.size}</strong> selected</span><div><button className="btn ghost" onClick={() => setShowBulkEdit(true)}><Icon name="edit" size={14} /> Bulk Edit</button><button className="btn ghost" onClick={bulkDeleteAssets}><Icon name="trash" size={14} /> Trash Selected</button><button className="btn ghost" onClick={() => setSelectedIds(new Set())}><Icon name="close" size={14} /> Clear</button></div></div>}
            <AssetTable assets={filteredAssets} onEdit={setEditAsset} onDelete={deleteAsset} onHistory={setHistoryAsset} onCheckout={setCheckoutTarget} onCheckin={checkInAsset} canWrite={canWrite} selectedIds={selectedIds} onToggleSelect={toggleSelect} onToggleSelectAll={toggleSelectAll} />
          </>}
          {activeTab === "add" && (canWrite ? <AssetForm onAdd={addAsset} categories={CATEGORIES} statuses={STATUSES} /> : <div className="card"><h2>Access restricted</h2><p className="muted">Only admins and supervisors can add assets.</p></div>)}
          {activeTab === "stock" && <StockMovements assets={activeAssets} movements={stockMovements} onRecordMovement={recordMovement} />}
          {activeTab === "requirements" && <Requirements assets={activeAssets} requirements={requirements} currentUserId={user?.id} canReview={canReviewRequirements} onSubmit={submitRequirement} onSetStatus={setRequirementStatus} onUpdate={updateRequirement} onDelete={deleteRequirement} />}
          {activeTab === "alerts" && <AlertsPanel alerts={alerts} onMarkRead={markAlertRead} onRunChecks={runChecks} />}
          {activeTab === "users" && canWrite && <ManageUsers />}
          {activeTab === "trash" && canManageTrash && <TrashView assets={trashedAssets} onRestore={restoreAsset} onPermanentDelete={permanentlyDeleteAsset} />}
        </div>
      </main>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      {editAsset && <EditModal asset={editAsset} categories={CATEGORIES} statuses={STATUSES} onSave={updateAsset} onClose={() => setEditAsset(null)} />}
      {historyAsset && <HistoryModal asset={historyAsset} history={history[historyAsset.id] || []} onClose={() => setHistoryAsset(null)} />}
      {checkoutTarget && <CheckoutModal asset={checkoutTarget} onCheckout={checkOutAsset} onClose={() => setCheckoutTarget(null)} />}
      {showBulkEdit && <BulkEditModal count={selectedIds.size} categories={CATEGORIES} statuses={STATUSES} onApply={bulkEditAssets} onClose={() => setShowBulkEdit(false)} />}
      {showImport && <ImportModal categories={CATEGORIES} statuses={STATUSES} onImport={importAssets} onClose={() => setShowImport(false)} />}

      {requestPopup && (
        <div className="modal" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) setRequestPopup(null); }}>
          <div className="card modal-card request-notification-card">
            <div className="card-header">
              <div className="notif-icon-ring"><Icon name="requirements" size={24} /></div>
              <h2>New Inventory Request</h2>
              <p className="muted">A requester has submitted a new item requirement.</p>
            </div>
            <div className="notif-body">
              <div className="notif-detail"><strong>Item:</strong> {requestPopup.name}</div>
              <div className="notif-detail"><strong>By:</strong> {requestPopup.by}</div>
              <div className="notif-detail"><strong>Time:</strong> {new Date(requestPopup.at).toLocaleTimeString()}</div>
            </div>
            <div className="form-actions">
              <button className="btn ghost" onClick={() => setRequestPopup(null)}>Dismiss</button>
              <button className="btn blue" onClick={() => { setRequestPopup(null); setActiveTab("requirements"); }}>View Requirements</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

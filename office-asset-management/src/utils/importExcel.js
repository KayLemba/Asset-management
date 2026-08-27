import * as XLSX from "xlsx";

const HEADER_MAP = {
  asset_id: "assetId",
  assetid: "assetId",
  id: "assetId",
  name: "name",
  asset_name: "name",
  category: "category",
  comments: "comments",
  serial: "serial",
  serial_asset_tag: "serial",
  status: "status",
  assigned_to: "assignedTo",
  assignedto: "assignedTo",
  location: "location",
  quantity: "quantity",
  unit_value_zmw: "value",
  unit_value: "value",
  value: "value",
  min_quantity: "minQuantity",
  minimum_stock_level: "minQuantity",
  purchase_date: "purchaseDate",
  warranty_expiry: "warrantyExpiry",
};

function normalizeKey(key) {
  return String(key || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function normalizeDate(value) {
  if (!value) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
  }
  const text = String(value).trim();
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? text : parsed.toISOString().slice(0, 10);
}

export function parseImportFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.onload = () => {
      try {
        const data = new Uint8Array(reader.result);
        const workbook = XLSX.read(data, { type: "array", cellDates: true });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        if (!sheet) throw new Error("The workbook does not contain a sheet.");
        resolve(XLSX.utils.sheet_to_json(sheet, { defval: "" }));
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

export function mapImportRows(rawRows, categories, statuses) {
  const valid = [];
  const errors = [];
  const allowedStatuses = statuses || [];

  (rawRows || []).forEach((row, index) => {
    const mapped = {};
    Object.entries(row || {}).forEach(([rawKey, rawValue]) => {
      const field = HEADER_MAP[normalizeKey(rawKey)];
      if (field) mapped[field] = rawValue;
    });

    const name = String(mapped.name || "").trim();
    const category = String(mapped.category || "").trim();
    if (!name || !category) {
      errors.push({ row: index + 2, reason: "Missing Name or Category" });
      return;
    }
    if (categories && !categories.includes(category)) {
      errors.push({ row: index + 2, reason: `Unknown category "${category}"` });
      return;
    }

    const quantity = Number(mapped.quantity || 1);
    const minQuantity = Number(mapped.minQuantity || 0);
    const value = Number(mapped.value || 0);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      errors.push({ row: index + 2, reason: "Quantity must be greater than 0" });
      return;
    }
    if (!Number.isFinite(minQuantity) || minQuantity < 0 || !Number.isFinite(value) || value < 0) {
      errors.push({ row: index + 2, reason: "Minimum stock and value must be valid non-negative numbers" });
      return;
    }

    const status = String(mapped.status || "In Use").trim();
    valid.push({
      assetId: String(mapped.assetId || "").trim(),
      name,
      category,
      comments: String(mapped.comments || "").trim(),
      serial: String(mapped.serial || "").trim(),
      status: allowedStatuses.length && !allowedStatuses.includes(status) ? "In Use" : status,
      assignedTo: String(mapped.assignedTo || "").trim(),
      location: String(mapped.location || "").trim(),
      quantity,
      minQuantity,
      value,
      purchaseDate: normalizeDate(mapped.purchaseDate),
      warrantyExpiry: normalizeDate(mapped.warrantyExpiry),
    });
  });

  return { valid, errors };
}

import * as XLSX from "xlsx";

export const exportToExcel = data => {
  const formatted = data.map(a => ({
    Name: a.name,
    Category: a.category,
    Serial: a.serial,
    Status: a.status,
    Location: a.location,
    Assigned_To: a.assignedTo,
    Quantity: a.quantity,
    Unit_Value_ZMW: a.value,
    Total_Value_ZMW: a.quantity * a.value
  }));

  const ws = XLSX.utils.json_to_sheet(formatted);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Assets");
  XLSX.writeFile(wb, "office_assets.xlsx");
};

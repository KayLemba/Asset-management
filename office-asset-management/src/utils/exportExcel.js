import * as XLSX from "xlsx";

export const exportToExcel = (data) => {
  const formatted = (data || []).map((a) => {
    const qty  = Number(a.quantity ?? 1);
    const unit = Number(a.value ?? 0);
    return {
      Name:            a.name,
      Category:        a.category,
      Comments:        a.comments || "",
      Serial:          a.serial || "",
      Status:          a.status || "",
      Assigned_To:     a.assignedTo || "",
      Location:        a.location || "",
      Quantity:        qty,
      Unit_Value_ZMW:  unit,
      Total_Value_ZMW: qty * unit,
      Created_At:      a.createdAt || "",
      Updated_At:      a.updatedAt || "",
    };
  });

  const ws = XLSX.utils.json_to_sheet(formatted);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Assets");
  XLSX.writeFile(wb, "office_assets.xlsx");
};

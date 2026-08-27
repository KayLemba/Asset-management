import * as XLSX from "xlsx";

export const exportToExcel = (data) => {
  const formatted = (data || []).map((asset) => {
    const quantity = Number(asset.quantity ?? 1);
    const unitValue = Number(asset.value ?? 0);
    return {
      Asset_ID: asset.assetId || asset.id || "",
      Name: asset.name,
      Category: asset.category,
      Comments: asset.comments || "",
      Serial: asset.serial || "",
      Status: asset.status || "",
      Assigned_To: asset.assignedTo || "",
      Location: asset.location || "",
      Quantity: quantity,
      Unit_Value_ZMW: unitValue,
      Total_Value_ZMW: quantity * unitValue,
      Purchase_Date: asset.purchaseDate || "",
      Warranty_Expiry: asset.warrantyExpiry || "",
      Checked_Out_At: asset.checkedOutAt || "",
      Due_Back: asset.dueBack || "",
      Created_At: asset.createdAt || "",
      Updated_At: asset.updatedAt || "",
    };
  });
  const worksheet = XLSX.utils.json_to_sheet(formatted);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Assets");
  XLSX.writeFile(workbook, "office_assets.xlsx");
};

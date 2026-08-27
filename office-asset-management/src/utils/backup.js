import { loadUsers } from "../lib/localAuth";

export function downloadBackup(state) {
  const payload = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    state,
    users: loadUsers(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `tactivo_backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function parseBackupFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || typeof parsed !== "object" || !parsed.state || typeof parsed.state !== "object") {
          throw new Error("File is not a valid Tactivo backup.");
        }
        resolve(parsed);
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsText(file);
  });
}

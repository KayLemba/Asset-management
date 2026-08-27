export function buildValueTrend(assets, history, months = 12) {
  const now = new Date();
  const buckets = [];
  for (let index = months - 1; index >= 0; index -= 1) {
    buckets.push(new Date(now.getFullYear(), now.getMonth() - index, 1));
  }

  return buckets.map((bucketDate) => {
    const bucketEnd = new Date(bucketDate.getFullYear(), bucketDate.getMonth() + 1, 1);
    let sum = 0;

    for (const asset of assets || []) {
      const created = new Date(asset.createdAt);
      if (Number.isNaN(created.getTime()) || created >= bucketEnd) continue;
      if (asset.deletedAt && new Date(asset.deletedAt) < bucketDate) continue;

      const assetHistory = history?.[asset.id] || [];
      let quantity = Number(asset.quantity ?? 1);
      let value = Number(asset.value ?? 0);
      const quantityEntry = [...assetHistory]
        .filter((entry) => entry.field === "quantity" && new Date(entry.date) >= bucketEnd)
        .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
      const valueEntry = [...assetHistory]
        .filter((entry) => entry.field === "value" && new Date(entry.date) >= bucketEnd)
        .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
      if (quantityEntry) quantity = Number(quantityEntry.from ?? quantity);
      if (valueEntry) value = Number(valueEntry.from ?? value);
      sum += (Number.isFinite(quantity) ? quantity : 0) * (Number.isFinite(value) ? value : 0);
    }

    return {
      label: bucketDate.toLocaleDateString(undefined, { month: "short", year: "2-digit" }),
      value: sum,
    };
  });
}

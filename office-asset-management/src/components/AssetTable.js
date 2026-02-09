import React from "react";

function AssetTable({ assets, onEdit, onDelete, totalValue }) {
  return (
    <div className="card">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Serial</th>
            <th>Status</th>
            <th>Location</th>
            <th>Assigned To</th>
            <th>Qty</th>
            <th>Value</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {assets.map(asset => (
            <tr key={asset.id}>
              <td>{asset.name}</td>
              <td>{asset.category}</td>
              <td>{asset.serial}</td>
              <td>{asset.status}</td>
              <td>{asset.location}</td>
              <td>{asset.assignedTo}</td>
              <td>{asset.quantity}</td>
              <td className="green-text">
                ZMW {(asset.value * asset.quantity).toLocaleString()}
              </td>
              <td className="table-actions">
                <button className="btn blue" onClick={() => onEdit(asset)}>
                  Edit
                </button>
                <button className="btn red" onClick={() => onDelete(asset.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="total">
        Total Asset Value: ZMW {totalValue.toLocaleString()}
      </div>
    </div>
  );
}

export default AssetTable;

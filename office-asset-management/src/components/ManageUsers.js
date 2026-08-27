import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { loadUsers, updateUserRole } from "../lib/localAuth";
import TableScroll from "./TableScroll";

const ROLE_LABEL = { admin: "Admin", supervisor: "Supervisor", requester: "Requester" };

export default function ManageUsers() {
  const { role: myRole, user: me } = useAuth();
  const isAdmin = myRole === "admin";
  const [users, setUsers] = useState([]);
  const [savingId, setSavingId] = useState(null);

  const load = useCallback(() => {
    setUsers([...loadUsers()].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
  }, []);

  useEffect(() => { load(); }, [load]);

  const availableRoles = (targetUser) => {
    if (isAdmin) return ["requester", "supervisor", "admin"];
    if (targetUser.role === "admin") return null;
    return ["requester", "supervisor"];
  };

  const changeRole = (targetUser, newRole) => {
    setSavingId(targetUser.id);
    updateUserRole(targetUser.id, newRole);
    setUsers((prev) => prev.map((user) => (user.id === targetUser.id ? { ...user, role: newRole } : user)));
    setSavingId(null);
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2>Manage Users</h2>
          <p className="muted">
            {isAdmin
              ? "Assign admin, supervisor, or requester access to any account."
              : "Assign supervisor or requester access. Only an admin can grant or change admin accounts. Your own role remains protected."}
          </p>
        </div>
      </div>

      <TableScroll minWidth="760px" className="users-table-scroll">
        <table className="asset-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Current Role</th><th>Change Role</th></tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan={4} className="empty">No users found.</td></tr>
            ) : users.map((user) => {
              const roles = availableRoles(user);
              const isSelf = user.id === me?.id;
              return (
                <tr key={user.id}>
                  <td>{user.fullName || "—"}</td>
                  <td>{user.email}</td>
                  <td><span className="badge info">{ROLE_LABEL[user.role] || user.role}</span></td>
                  <td className="col-actions">
                    {!roles ? (
                      <span className="muted">Admin-only</span>
                    ) : isSelf ? (
                      <span className="muted role-locked" title="Your own role is protected from changes">Locked (your account)</span>
                    ) : (
                      <select
                        className="cat-select"
                        value={user.role}
                        disabled={savingId === user.id}
                        onChange={(e) => changeRole(user, e.target.value)}
                      >
                        {roles.map((role) => <option key={role} value={role}>{ROLE_LABEL[role]}</option>)}
                      </select>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableScroll>
    </div>
  );
}


import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

const ROLE_LABEL = { admin: "Admin", supervisor: "Supervisor", requester: "Requester" };

export default function ManageUsers() {
  const { role: myRole, user: me } = useAuth();
  const isAdmin = myRole === "admin";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) setError(error.message);
    else setUsers(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // A supervisor can only assign requester/supervisor, and only to
  // accounts that aren't already admin. An admin can assign any role.
  const availableRoles = (targetUser) => {
    if (isAdmin) return ["requester", "supervisor", "admin"];
    if (targetUser.role === "admin") return null; // supervisors can't touch admins
    return ["requester", "supervisor"];
  };

  const changeRole = async (targetUser, newRole) => {
    setSavingId(targetUser.id);
    setError("");
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", targetUser.id);
    setSavingId(null);
    if (error) { setError(error.message); return; }
    setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u)));
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2>Manage Users</h2>
          <p className="muted">
            {isAdmin
              ? "Assign admin, supervisor, or requester access to any account."
              : "Assign supervisor or requester access. Only an admin can grant or change admin accounts."}
          </p>
        </div>
      </div>

      {error ? <div className="alert">{error}</div> : null}

      <div className="table-card">
        <table className="asset-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Current Role</th>
              <th>Change Role</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="empty">Loading…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={4} className="empty">No users found.</td></tr>
            ) : users.map((u) => {
              const roles = availableRoles(u);
              const isSelf = u.id === me?.id;
              return (
                <tr key={u.id}>
                  <td>{u.full_name || "—"}</td>
                  <td>{u.email}</td>
                  <td><span className="badge info">{ROLE_LABEL[u.role] || u.role}</span></td>
                  <td className="col-actions">
                    {!roles ? (
                      <span className="muted">Admin-only</span>
                    ) : isSelf ? (
                      <span className="muted" title="You can't change your own role">Locked</span>
                    ) : (
                      <select
                        className="cat-select"
                        value={u.role}
                        disabled={savingId === u.id}
                        onChange={(e) => changeRole(u, e.target.value)}
                      >
                        {roles.map((r) => (
                          <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                        ))}
                      </select>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

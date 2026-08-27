import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Signup({ onSwitch }) {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const { error } = await signUp(email, password, fullName);
    setBusy(false);
    if (error) setError(error.message);
  };

  return (
    <div className="auth-shell">
      <form className="card auth-card" onSubmit={submit}>
        <div className="card-header">
          <h2>Create Account</h2>
          <p className="muted">The first account becomes an admin. New accounts after that start as requesters.</p>
        </div>

        {error ? <div className="alert">{error}</div> : null}

        <div>
          <label>Full Name</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoComplete="name"
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>

        <div className="form-actions">
          <button className="btn green" disabled={busy}>
            {busy ? "Creating…" : "Create Account"}
          </button>
        </div>

        <p className="muted" style={{ marginTop: 14, textAlign: "center" }}>
          Already have an account?{" "}
          <button type="button" className="link-btn" onClick={onSwitch}>
            Sign In
          </button>
        </p>
      </form>
    </div>
  );
}

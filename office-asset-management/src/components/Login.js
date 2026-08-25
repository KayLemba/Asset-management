import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Login({ onSwitch }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const { error } = await signIn(email, password);
    setBusy(false);
    if (error) setError(error.message);
  };

  return (
    <div className="auth-shell">
      <form className="card auth-card" onSubmit={submit}>
        <div className="card-header">
          <h2>Sign In</h2>
          <p className="muted">Access your Tactivo inventory dashboard.</p>
        </div>

        {error ? <div className="alert">{error}</div> : null}

        <div>
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
            autoComplete="current-password"
          />
        </div>

        <div className="form-actions">
          <button className="btn green" disabled={busy}>
            {busy ? "Signing in…" : "Sign In"}
          </button>
        </div>

        <p className="muted" style={{ marginTop: 14, textAlign: "center" }}>
          No account?{" "}
          <button type="button" className="link-btn" onClick={onSwitch}>
            Create one
          </button>
        </p>
      </form>
    </div>
  );
}

const USERS_KEY = "tactivo_users_v1";
const SESSION_KEY = "tactivo_session_v1";

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
}

export function loadUsers() {
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getSession() {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setSession(userId) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify({ userId }));
}

function clearSession() {
  window.localStorage.removeItem(SESSION_KEY);
}

export function getUserById(id) {
  return loadUsers().find((user) => user.id === id) || null;
}

export function signUpLocal(email, password, fullName) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const trimmedName = String(fullName || "").trim();
  if (!normalizedEmail || !password || !trimmedName) {
    return { error: { message: "Full name, email, and password are required." } };
  }
  if (String(password).length < 6) {
    return { error: { message: "Password must be at least 6 characters." } };
  }
  const users = loadUsers();
  if (users.some((user) => user.email === normalizedEmail)) {
    return { error: { message: "An account with this email already exists." } };
  }
  const now = new Date().toISOString();
  const user = {
    id: `u_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    email: normalizedEmail,
    fullName: trimmedName,
    passwordHash: simpleHash(String(password)),
    role: users.length === 0 ? "admin" : "requester",
    createdAt: now,
  };
  saveUsers([...users, user]);
  setSession(user.id);
  return { error: null, user };
}

export function signInLocal(email, password) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const user = loadUsers().find((candidate) => candidate.email === normalizedEmail);
  if (!user || user.passwordHash !== simpleHash(String(password))) {
    return { error: { message: "Invalid email or password." } };
  }
  setSession(user.id);
  return { error: null, user };
}

export function signOutLocal() {
  clearSession();
}

export function updateUserRole(userId, role) {
  const users = loadUsers();
  const updated = users.map((user) => (user.id === userId ? { ...user, role } : user));
  saveUsers(updated);
  return updated.find((user) => user.id === userId) || null;
}

export function replaceUsers(users) {
  saveUsers(Array.isArray(users) ? users : []);
}

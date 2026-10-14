import { createContext, useContext, useState, type ReactNode } from 'react';

export interface User {
  name: string;
  email: string;
}

interface StoredUser extends User {
  password: string;
}

interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const USERS_KEY = 'demo_users';
const SESSION_KEY = 'demo_session';
const DELAY_MS = 300;

const DEMO_USER: StoredUser = {
  name: 'Demo User',
  email: 'demo@example.com',
  password: 'password123',
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function getUsers(): StoredUser[] {
  const users = readJson<StoredUser[]>(USERS_KEY, []);
  return users.some((u) => u.email === DEMO_USER.email) ? users : [DEMO_USER, ...users];
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readJson<User | null>(SESSION_KEY, null));

  const startSession = (u: User) => {
    const session = { name: u.name, email: u.email };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session);
  };

  const login = async (email: string, password: string) => {
    await wait(DELAY_MS);
    const found = getUsers().find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password,
    );
    if (!found) throw new Error('Invalid email or password');
    startSession(found);
  };

  const signup = async (name: string, email: string, password: string) => {
    await wait(DELAY_MS);
    const users = getUsers();
    const normalizedEmail = email.trim().toLowerCase();
    if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      throw new Error('An account with this email already exists');
    }
    const newUser: StoredUser = { name: name.trim(), email: normalizedEmail, password };
    localStorage.setItem(USERS_KEY, JSON.stringify([...users, newUser]));
    startSession(newUser);
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

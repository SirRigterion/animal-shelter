// src/context/AuthContext.jsx
// Авторизация, сессия, избранное и заявки – теперь через REST API backend.
// Токен (JWT) хранится в localStorage, пользователь приходит с сервера,
// пароли на клиенте не хранятся вовсе.

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  apiFetch,
  getToken,
  setToken,
  clearToken,
} from "../api";

const AuthContext = createContext(null);

const FAV_GUEST_KEY = "shelter_favs_guest";
const favKeyFor = (email) => (email ? `shelter_favs_${email}` : FAV_GUEST_KEY);

const readFavorites = (key) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState(() => readFavorites(FAV_GUEST_KEY));
  const [applications, setApplications] = useState([]);
  
  const [isReady, setIsReady] = useState(false);

  
  useEffect(() => {
    const restore = async () => {
      if (getToken()) {
        try {
          const profile = await apiFetch("/api/profile");
          setUser(profile);
          setFavorites(readFavorites(favKeyFor(profile.email)));
          try {
            const orders = await apiFetch("/api/orders");
            setApplications(orders);
          } catch {
            setApplications([]);
          }
        } catch {
          clearToken();
        }
      }
      setIsReady(true);
    };
    restore();
  }, []);

  
  useEffect(() => {
    if (user?.email) {
      setFavorites(readFavorites(favKeyFor(user.email)));
    } else {
      setFavorites(readFavorites(FAV_GUEST_KEY));
    }
  }, [user?.email]);

  const login = async (email, password) => {
    try {
      const data = await apiFetch("/api/login", {
        method: "POST",
        body: { email: email.trim(), password },
      });
      setToken(data.token);
      setUser(data.user);
      setApplications([]);
      try {
        const orders = await apiFetch("/api/orders");
        setApplications(orders);
      } catch {
        
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async ({ name, email, password, phone }) => {
    try {
      const data = await apiFetch("/api/register", {
        method: "POST",
        body: {
          name: name.trim(),
          email: email.trim(),
          password,
          phone: phone?.trim() || "+7 (999) 000-00-00",
        },
      });
      setToken(data.token);
      setUser(data.user);
      setApplications([]);
      setFavorites([]);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setApplications([]);
  }, []);

  const toggleFavorite = (petId) => {
    const id = Number(petId);
    const key = favKeyFor(user?.email);
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
    return true;
  };

  const refreshApplications = useCallback(async () => {
    if (!getToken()) return;
    try {
      const orders = await apiFetch("/api/orders");
      setApplications(orders);
    } catch {
      
    }
  }, []);

  
  const submitApplication = async (appData) => {
    const order = await apiFetch("/api/orders", {
      method: "POST",
      body: {
        pet_id: Number(appData.petId),
        phone: appData.phone,
        visit_date: appData.date || new Date().toISOString().split("T")[0],
        comment: appData.comment || null,
      },
    });
    setApplications((prev) => [order, ...prev]);
    return order;
  };

  
  const updateProfile = async (profileData) => {
    try {
      const updated = await apiFetch("/api/profile", { method: "PATCH", body: profileData });
      setUser(updated);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  
  const uploadAvatar = async (file) => {
    if (!user) return { success: false, error: "Нужно войти в аккаунт" };
    try {
      const formData = new FormData();
      formData.append("file", file);
      const updated = await apiFetch(`/api/users/${user.id}/avatar`, {
        method: "POST",
        isForm: true,
        body: formData,
      });
      setUser(updated);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isReady,
        login,
        register,
        logout,
        favorites,
        toggleFavorite,
        applications,
        submitApplication,
        refreshApplications,
        updateProfile,
        uploadAvatar
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth должен использоваться внутри AuthProvider");
  }
  return context;
}

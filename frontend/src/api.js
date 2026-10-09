// src/api.js
// Клиент REST API backend (FastAPI). В Docker VITE_API_URL="" – запросы идут на тот же домен (nginx проксирует /api). Все запросы фронта к серверу идут отсюда.

export const API_BASE = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

const TOKEN_KEY = "shelter_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export async function apiFetch(path, { method = "GET", body, isForm = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!isForm && body !== undefined) headers["Content-Type"] = "application/json";

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: isForm ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      typeof data.detail === "string" ? data.detail : "Ошибка сервера. Попробуйте позже."
    );
    error.status = response.status;
    throw error;
  }
  return data;
}

export const petImageUrl = (pet) => (pet?.photo_url ? `${API_BASE}${pet.photo_url}` : null);

export const userAvatarUrl = (user) => (user?.avatar_url ? `${API_BASE}${user.avatar_url}` : null);

export const petAgeGroup = (pet) => (/месяц/i.test(pet?.age || "") ? "baby" : "adult");

export const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString("ru-RU");
};

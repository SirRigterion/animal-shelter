// src/pages/Login.jsx
// Авторизация пользователя

import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/Button";
import pawIcon from "../assets/icons/paw.svg";

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTarget = location.state?.from || "/profile";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email.trim() || !formData.password) {
      setError("Пожалуйста, заполните все обязательные поля");
      return;
    }

    setIsLoading(true);
    const result = await login(formData.email, formData.password);
    setIsLoading(false);

    if (result.success) {
      navigate(redirectTarget, { replace: true });
    } else {
      setError(result.error || "Неверный логин или пароль");
    }
  };

  return (
    <div className="auth-page page-enter">
      <div className="container auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <span className="auth-icon">
              <img src={pawIcon} alt="Приют" className="ui-icon ui-icon-xl" />
            </span>
            <h1 className="auth-title">Вход в личный кабинет</h1>
            <p className="auth-subtitle">
              Рады видеть вас снова! Войдите, чтобы отслеживать заявки и избранное
            </p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="login-email">Электронная почта (Email) *</label>
              <input
                id="login-email"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Пароль *</label>
              <input
                id="login-password"
                type="password"
                name="password"
                autoComplete="current-password"
                placeholder="Введите ваш пароль"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isLoading}
              className="w-100 mt-2"
            >
              {isLoading ? "Выполняется вход..." : "Войти в аккаунт"}
            </Button>
          </form>

          <div className="auth-footer">
            <p>
              Ещё нет аккаунта?{" "}
              <Link to="/register" className="auth-link">
                Зарегистрироваться
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

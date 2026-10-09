// src/pages/Register.jsx
// Регистрация нового пользователя

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/Button";
import pawIcon from "../assets/icons/paw.svg";


export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
    consent: false
  });

  const [formErrors, setFormErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const formatPhone = (value) => {
    let digits = value.replace(/\D/g, "");
    if (digits.startsWith("8")) {
      digits = "7" + digits.slice(1);
    }
    if (digits.startsWith("9")) {
      digits = "7" + digits;
    }
    digits = digits.slice(0, 11);
    if (!digits) return "";
    let result = "+7";
    if (digits.length > 1) {
      result += ` (${digits.slice(1, 4)}`;
    }
    if (digits.length >= 4) {
      result += ")";
    }
    if (digits.length > 4) {
      result += ` ${digits.slice(4, 7)}`;
    }
    if (digits.length > 7) {
      result += `-${digits.slice(7, 9)}`;
    }
    if (digits.length > 9) {
      result += `-${digits.slice(9, 11)}`;
    }
    return result;
  };

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "phone"
            ? formatPhone(value)
            : value
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (generalError) setGeneralError("");
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errors.name = "Имя должно содержать минимум 2 символа";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = "Введите адрес электронной почты";
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = "Некорректный формат email (пример: name@domain.ru)";
    }

    if (!formData.password) {
      errors.password = "Введите пароль";
    } else if (formData.password.length < 6) {
      errors.password = "Пароль должен содержать минимум 6 символов";
    }

    if (formData.password !== formData.confirm) {
      errors.confirm = "Пароли не совпадают";
    }

    if (!formData.consent) {
      errors.consent =
        "Подтвердите согласие с Политикой конфиденциальности и обработкой персональных данных";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    const result = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phone: formData.phone
    });

    setIsSubmitting(false);

    if (result.success) {
      navigate("/profile");
    } else {
      setGeneralError(result.error || "Ошибка при регистрации");
    }
  };

  return (
    <div className="auth-page page-enter">
      <div className="container auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <span className="auth-icon">
              <img src={pawIcon} alt="Регистрация" className="ui-icon ui-icon-xl" />
            </span>
            <h1 className="auth-title">Создать аккаунт</h1>
            <p className="auth-subtitle">
              Станьте частью нашего доброго сообщества помощи животным
            </p>
          </div>

          {generalError && <div className="alert alert-error">{generalError}</div>}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="form-group">
              <label htmlFor="reg-name">Ваше имя *</label>
              <input
                id="reg-name"
                type="text"
                name="name"
                placeholder="Иван Иванов"
                value={formData.name}
                onChange={handleChange}
                className={`form-input ${formErrors.name ? "input-error" : ""}`}
                required
              />
              {formErrors.name && <span className="field-error-text">{formErrors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="reg-email">Электронная почта (Email) *</label>
              <input
                id="reg-email"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="ivan@example.ru"
                value={formData.email}
                onChange={handleChange}
                className={`form-input ${formErrors.email ? "input-error" : ""}`}
                required
              />
              {formErrors.email && <span className="field-error-text">{formErrors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="reg-phone">Номер телефона (для связи по заявкам)</label>
              <input
                id="reg-phone"
                type="tel"
                name="phone"
                placeholder="+7 (999) 000-00-00"
                value={formData.phone}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-password">Пароль (минимум 6 символов) *</label>
              <input
                id="reg-password"
                type="password"
                name="password"
                autoComplete="new-password"
                placeholder="Придумайте надежный пароль"
                value={formData.password}
                onChange={handleChange}
                className={`form-input ${formErrors.password ? "input-error" : ""}`}
                required
              />
              {formErrors.password && (
                <span className="field-error-text">{formErrors.password}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="reg-confirm">Повторите пароль *</label>
              <input
                id="reg-confirm"
                type="password"
                name="confirm"
                autoComplete="new-password"
                placeholder="Повторите введенный пароль"
                value={formData.confirm}
                onChange={handleChange}
                className={`form-input ${formErrors.confirm ? "input-error" : ""}`}
                required
              />
              {formErrors.confirm && (
                <span className="field-error-text">{formErrors.confirm}</span>
              )}
            </div>

            <div className="form-group form-consent-group">
              <label className="form-consent" htmlFor="reg-consent">
                <input
                  id="reg-consent"
                  type="checkbox"
                  name="consent"
                  checked={formData.consent}
                  onChange={handleChange}
                />
                <span>
                  Я согласен с{" "}
                  <Link
                    to="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="auth-link"
                  >
                    Политикой конфиденциальности
                  </Link>{" "}
                  и даю согласие на обработку персональных данных *
                </span>
              </label>
              {formErrors.consent && (
                <span className="field-error-text">{formErrors.consent}</span>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isSubmitting}
              className="w-100 mt-2"
            >
              {isSubmitting ? "Создание аккаунта..." : "Зарегистрироваться"}
            </Button>
          </form>

          <div className="auth-footer">
            <p>
              Уже есть аккаунт?{" "}
              <Link to="/login" className="auth-link">
                Войти
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

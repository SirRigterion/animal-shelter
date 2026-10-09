// src/pages/Volunteer.jsx
// Страница волонтёрства: заявка уходит на сервер (POST /api/volunteers).
// Можно отправить без регистрации – а если вы вошли, поля заполнятся автоматически.

import { useState } from "react";
import { apiFetch } from "../api";
import { useAuth } from "../context/AuthContext";
import Button from "../components/Button";
import pawIcon from "../assets/icons/paw.svg";
import checkIcon from "../assets/icons/check.svg";

const DIRECTIONS = [
  { value: "walk", label: "Выгул собак" },
  { value: "care", label: "Уход и кормление" },
  { value: "photo", label: "Фотосъёмка питомцев" },
  { value: "transport", label: "Транспортировка" },
  { value: "events", label: "Помощь на мероприятиях" },
  { value: "vet", label: "Помощь ветеринару" }
];

export default function Volunteer() {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    city: "",
    direction: "walk",
    motivation: ""
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "phone" ? formatPhone(value) : value
    }));

    if (error) setError("");
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setError("Заполните имя, email и телефон – куратор свяжется с вами по ним");
      return;
    }
    if (formData.city.trim().length < 2) {
      setError("Укажите ваш город – от него зависит, на какие мероприятия вы сможете приезжать");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await apiFetch("/api/volunteers", {
        method: "POST",
        body: { ...formData, name: formData.name.trim(), email: formData.email.trim() }
      });
      setIsSuccess(true);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="volunteer-page page-enter">
      <div className="container auth-container">
        <div className="auth-card">
          {isSuccess ? (
            <div className="volunteer-success">
              <img src={checkIcon} alt="Успешно" className="ui-icon success-state-img" />
              <h1 className="auth-title">Заявка отправлена!</h1>
              <p className="auth-subtitle">
                Куратор волонтёрской программы рассмотрит её и свяжется с вами. После одобрения
                в вашем профиле появится бейдж «Волонтёр».
              </p>
              <Button variant="primary" onClick={() => window.history.back()}>
                ← Вернуться на сайт
              </Button>
            </div>
          ) : (
            <>
              <div className="auth-header">
                <span className="auth-icon">
                  <img src={pawIcon} alt="Волонтёрство" className="ui-icon ui-icon-xl" />
                </span>
                <h1 className="auth-title">Стать волонтёром приюта</h1>
                <p className="auth-subtitle">
                  Помогайте питомцам делом: выгул, уход, фотографирование, транспорт или
                  мероприятия. Выбирайте то, что вам по душе!
                </p>
              </div>

              {error && <div className="alert alert-error">{error}</div>}

              <form onSubmit={handleSubmit} className="auth-form" noValidate>
                <div className="form-group">
                  <label htmlFor="vol-name">Ваше имя *</label>
                  <input
                    id="vol-name"
                    type="text"
                    name="name"
                    placeholder="Иван Иванов"
                    value={formData.name}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="vol-email">Электронная почта *</label>
                  <input
                    id="vol-email"
                    type="email"
                    name="email"
                    placeholder="ivan@example.ru"
                    value={formData.email}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="vol-phone">Телефон *</label>
                  <input
                    id="vol-phone"
                    type="tel"
                    name="phone"
                    placeholder="+7 (999) 000-00-00"
                    value={formData.phone}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="vol-city">Ваш город *</label>
                  <input
                    id="vol-city"
                    type="text"
                    name="city"
                    placeholder="Москва"
                    value={formData.city}
                    onChange={handleChange}
                    className="form-input"
                    required
                    minLength={2}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="vol-direction">Направление помощи</label>
                  <select
                    id="vol-direction"
                    name="direction"
                    value={formData.direction}
                    onChange={handleChange}
                    className="form-select"
                  >
                    {DIRECTIONS.map((direction) => (
                      <option key={direction.value} value={direction.value}>
                        {direction.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="vol-motivation">Пара слов о себе и мотивации</label>
                  <textarea
                    id="vol-motivation"
                    name="motivation"
                    rows="3"
                    placeholder="Например: есть опыт выгула крупных собак, могу приходить по выходным..."
                    value={formData.motivation}
                    onChange={handleChange}
                    className="form-textarea"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-100 mt-2"
                >
                  {isSubmitting ? "Отправляем..." : "Отправить заявку на волонтёрство"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

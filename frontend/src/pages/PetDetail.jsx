// src/pages/PetDetail.jsx
// Страница отдельного питомца: данные по :id приходят из API,
// заявка на знакомство отправляется на сервер (POST /api/orders)

import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { apiFetch, petImageUrl } from "../api";
import { useAuth } from "../context/AuthContext";
import Badge from "../components/Badge";
import Button from "../components/Button";
import Modal from "../components/Modal";
import Loader from "../components/Loader";
import heartFilledIcon from "../assets/icons/heart-filled.svg";
import heartOutlineIcon from "../assets/icons/heart-outline.svg";
import checkIcon from "../assets/icons/check.svg";
import sparkleIcon from "../assets/icons/sparkle.svg";
import documentIcon from "../assets/icons/document.svg";

export default function PetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, favorites, toggleFavorite, submitApplication } = useAuth();

  const [pet, setPet] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [appForm, setAppForm] = useState({
    date: "",
    phone: "",
    comment: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isSuccessSubmitted, setIsSuccessSubmitted] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    let cancelled = false;
    setIsLoading(true);
    setLoadError("");
    apiFetch(`/api/pets/${id}`)
      .then((data) => {
        if (!cancelled) {
          setPet(data);
          setIsLoading(false);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(error.message);
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (user?.phone) {
      setAppForm((prev) => ({ ...prev, phone: user.phone }));
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="container page-enter" style={{ padding: "60px 20px" }}>
        <Loader text="Загружаем анкету питомца..." />
      </div>
    );
  }

  if (loadError || !pet) {
    return (
      <div className="container not-found-pet page-enter">
        <h2>Питомец не найден</h2>
        <p>
          Возможно, этот хвостик уже счастливо уехал домой или ссылка неверна.
          {loadError ? ` (${loadError})` : ""}
        </p>
        <Button variant="primary" onClick={() => navigate("/catalog")}>
          ← Вернуться в каталог
        </Button>
      </div>
    );
  }

  const isFavorite = favorites.includes(pet.id);
  const petImage = petImageUrl(pet);

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!appForm.phone.trim()) {
      setSubmitError("Пожалуйста, укажите контактный номер телефона");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      await submitApplication({
        petId: pet.id,
        date: appForm.date,
        phone: appForm.phone,
        comment: appForm.comment
      });

      setIsSuccessSubmitted(true);
      setTimeout(() => {
        setIsModalOpen(false);
        setIsSuccessSubmitted(false);
        navigate("/profile/applications");
      }, 1500);
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pet-detail-page page-enter">
      <div className="container">
        <div className="detail-top-nav">
          <button
            type="button"
            onClick={() => navigate("/catalog")}
            className="back-link-btn"
          >
            ← Назад в каталог
          </button>
        </div>

        <div className="pet-detail-layout">
          <div className="pet-media-column">
            <div className="detail-image-container">
              <img
                src={petImage}
                alt={pet.name}
                className="detail-main-image"
              />
              <button
                type="button"
                onClick={() => toggleFavorite(pet.id)}
                className={`detail-fav-btn ${isFavorite ? "active" : ""}`}
                title={isFavorite ? "Удалить из избранного" : "Добавить в избранное"}
              >
                <img
                  src={isFavorite ? heartFilledIcon : heartOutlineIcon}
                  alt=""
                  className="ui-icon"
                />{" "}
                {isFavorite ? "В избранном" : "В избранное"}
              </button>
            </div>

            <div className="pet-quick-specs">
              <div className="spec-item">
                <span className="spec-label">Статус:</span>
                <Badge variant={pet.status === "Ищет дом" ? "success" : "warning"}>
                  {pet.status}
                </Badge>
              </div>
              <div className="spec-item">
                <span className="spec-label">Пол:</span>
                <strong>{pet.gender_label}</strong>
              </div>
              <div className="spec-item">
                <span className="spec-label">Возраст:</span>
                <strong>{pet.age}</strong>
              </div>
              <div className="spec-item">
                <span className="spec-label">Порода:</span>
                <strong>{pet.breed}</strong>
              </div>
            </div>
          </div>

          <div className="pet-info-column">
            <div className="detail-header">
              <h1 className="detail-title">{pet.name}</h1>
              <p className="detail-subtitle">{pet.short_desc}</p>
            </div>

            <div className="detail-section">
              <h3>Здоровье и уход</h3>
              <div className="badges-list">
                {pet.vaccinated && (
                  <Badge variant="success">
                    <img src={checkIcon} alt="" className="ui-icon ui-icon-xs" />{" "}
                    <p className="leftM">Привит</p>
                  </Badge>
                )}
                {pet.sterilized && (
                  <Badge variant="info">
                    <img src={checkIcon} alt="" className="ui-icon ui-icon-xs" />{" "}
                    <p className="leftM">Стерилизован</p>
                  </Badge>
                )}
                {pet.has_passport && (
                  <Badge variant="purple">
                    <img src={checkIcon} alt="" className="ui-icon ui-icon-xs" />{" "}
                    <p className="leftM">Паспорт</p>
                  </Badge>
                )}
                <Badge variant="info">
                  <img src={checkIcon} alt="" className="ui-icon ui-icon-xs" />{" "}
                  <p className="leftM">Обработан от паразитов</p>
                </Badge>
              </div>
            </div>

            <div className="detail-section">
              <h3>Характер и привычки</h3>
              <div className="traits-list">
                {(pet.character || []).map((trait, index) => (
                  <span key={index} className="trait-pill">
                    <img src={sparkleIcon} alt="" className="ui-icon ui-icon-xs" />
                    <span className="leftM">{trait}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="detail-section">
              <h3>История хвостика</h3>
              <p className="pet-full-story">{pet.story || pet.description}</p>
            </div>

            <div className="detail-action-card">
              <h3>Хотите познакомиться с {pet.name}?</h3>
              <p>
                Мы всегда рады организовать встречу в приюте, чтобы вы могли провести время
                с подопечным и понять, подходите ли вы друг другу.
              </p>

              {user ? (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => setIsModalOpen(true)}
                  className="w-100"
                >
                  <img src={documentIcon} alt="" className="ui-icon ui-icon-sm" /> Записаться на знакомство с {pet.name}
                </Button>
              ) : (
                <div className="guest-prompt-box">
                  <p>
                    Чтобы подать заявку на знакомство, пожалуйста, войдите в аккаунт или
                    зарегистрируйтесь.
                  </p>
                  <div className="guest-prompt-buttons">
                    <Link to="/login" className="btn btn-primary">
                      Войти
                    </Link>
                    <Link to="/register" className="btn btn-outline">
                      Быстрая регистрация
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Заявка на знакомство с ${pet.name}`}
      >
        {isSuccessSubmitted ? (
          <div className="modal-success-state">
            <img src={checkIcon} alt="Успешно" className="ui-icon success-state-img" />
            <h4>Заявка успешно отправлена!</h4>
            <p>Куратор свяжется с вами по указанному телефону в течение рабочего дня.</p>
            <p className="redirect-note">Перенаправляем в личный кабинет...</p>
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} className="application-form">
            <div className="form-group">
              <label htmlFor="app-name">Ваше имя</label>
              <input
                id="app-name"
                type="text"
                value={user?.name || ""}
                disabled
                className="form-input disabled-input"
              />
            </div>

            {submitError && <div className="alert alert-error">{submitError}</div>}

            <div className="form-group">
              <label htmlFor="app-phone">Контактный телефон *</label>
              <input
                id="app-phone"
                type="tel"
                required
                placeholder="+7 (___) ___-__-__"
                value={appForm.phone}
                onChange={(e) => setAppForm({ ...appForm, phone: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="app-date">Желаемая дата визита</label>
              <input
                id="app-date"
                type="date"
                value={appForm.date}
                onChange={(e) => setAppForm({ ...appForm, date: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="app-comment">
                Расскажите немного о себе (опыт с животными, условия проживания)
              </label>
              <textarea
                id="app-comment"
                rows="3"
                placeholder="Например: был кот 10 лет, живем в своей квартире без маленьких детей..."
                value={appForm.comment}
                onChange={(e) => setAppForm({ ...appForm, comment: e.target.value })}
                className="form-textarea"
              />
            </div>

            <div className="modal-actions">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                Отмена
              </Button>
              <Button variant="primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Отправляем..." : "Отправить заявку"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

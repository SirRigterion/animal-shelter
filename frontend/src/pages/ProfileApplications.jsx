// src/pages/ProfileApplications.jsx
// Вложенный подраздел «Мои заявки» – список приходит с сервера (GET /api/orders)

import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { petImageUrl, formatDate } from "../api";
import Badge from "../components/Badge";
import Button from "../components/Button";
import documentIcon from "../assets/icons/document.svg";
import clockIcon from "../assets/icons/clock.svg";
import calendarIcon from "../assets/icons/calendar.svg";
import phoneIcon from "../assets/icons/phone.svg";
import seapigPlaceholder from "../assets/pets/seapig.png";

const STATUS_BADGE = {
  "На рассмотрении": "warning",
  "Встреча назначена": "purple",
  "Одобрена": "success",
  "Отклонена": "error"
};

export default function ProfileApplications() {
  const { applications } = useAuth();

  return (
    <div className="profile-applications-page page-enter">
      <div className="tab-header">
        <h2 className="tab-title">Мои заявки на знакомство</h2>
        <p className="tab-subtitle">
          Здесь отображаются ваши встречи, назначенные с кураторами приюта
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="empty-state-card">
          <img src={documentIcon} alt="Заявки" className="ui-icon empty-state-img" />
          <h3>У вас пока нет активных заявок</h3>
          <p>
            Чтобы подать заявку на встречу с питомцем, перейдите в его карточку в каталоге и
            нажмите кнопку «Записаться на знакомство».
          </p>
          <Link to="/catalog">
            <Button variant="primary">Выбрать питомца в каталоге →</Button>
          </Link>
        </div>
      ) : (
        <div className="applications-list">
          {applications.map((app) => (
            <div key={app.id} className="application-card">
              <div className="app-card-media">
                <img
                  src={petImageUrl({ photo_url: app.pet_photo_url }) || seapigPlaceholder}
                  alt={app.pet_name}
                  className="app-pet-img"
                />
              </div>

              <div className="app-card-info">
                <div className="app-card-top">
                  <h3 className="app-pet-title">
                    Встреча с подопечным: <strong>{app.pet_name}</strong>
                  </h3>
                  <Badge variant={STATUS_BADGE[app.status] || "warning"}>
                    <img src={clockIcon} alt="" className="ui-icon ui-icon-xs" />
                    <p className="leftM">{app.status}</p>
                  </Badge>
                </div>

                <div className="app-details-grid">
                  <p>
                    <img src={calendarIcon} alt="" className="ui-icon ui-icon-xs" /> <strong>Желаемая дата визита:</strong> {app.visit_date ? formatDate(app.visit_date) : "По согласованию"}
                  </p>
                  <p>
                    <img src={phoneIcon} alt="" className="ui-icon ui-icon-xs" /> <strong>Контактный телефон:</strong> {app.phone}
                  </p>
                  <p>
                    <img src={clockIcon} alt="" className="ui-icon ui-icon-xs" /> <strong>Дата подачи:</strong> {formatDate(app.created_at)}
                  </p>
                </div>

                {app.comment && (
                  <div className="app-comment-block">
                    <span className="comment-label">Ваш комментарий куратору:</span>
                    <p className="comment-text">«{app.comment}»</p>
                  </div>
                )}

                <div className="app-actions">
                  <Link to={`/catalog/${app.pet_id}`} className="app-link">
                    Посмотреть профиль {app.pet_name} →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

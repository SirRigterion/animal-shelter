// src/pages/ProfileLayout.jsx
// Макет личного кабинета: талисман и подписи зависят от статуса аккаунта,
// который возвращает сервер (inactive -> муха Жужа, verified -> лис Фуфырик, admin -> слон Бонифаций)

import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { userAvatarUrl, formatDate } from "../api";
import Button from "../components/Button";
import userIcon from "../assets/icons/user.svg";
import heartFilledIcon from "../assets/icons/heart-filled.svg";
import documentIcon from "../assets/icons/document.svg";
import calendarIcon from "../assets/icons/calendar.svg";
import mailIcon from "../assets/icons/mail.svg";
import awardIcon from "../assets/icons/award.svg";
import pawIcon from "../assets/icons/paw.svg";
import flyIcon from "../assets/icons/fly.svg";
import foxIcon from "../assets/icons/fox.svg";
import elephantIcon from "../assets/icons/elephant.svg";
import ProfileMascot3D from "../components/three/ProfileMascot3D";
import CanvasFallback from "../components/three/CanvasFallback";

const MASCOT_IMAGES = {
  Муха: flyIcon,
  Лис: foxIcon,
  Слон: elephantIcon,
};

export default function ProfileLayout() {
  const { user, logout, favorites, applications } = useAuth();
  const navigate = useNavigate();

  const mascot = user?.mascot || {};
  const avatarUrl = userAvatarUrl(user);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="profile-layout-page page-enter">
      <div className="container">
        <div className="profile-user-card">
          <div className="user-card-main">
            <div className="user-avatar-large">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Аватар" />
              ) : user?.name ? (
                user.name[0].toUpperCase()
              ) : (
                <img src={userIcon} alt="Профиль" className="ui-icon ui-icon-lg" />
              )}
            </div>
            <div className="user-details">
              <div className="user-name-row">
                <h1 className="user-name">{user?.name}</h1>
                <span className="summary-note">
                  <img src={awardIcon} alt="" className="ui-icon ui-icon-xs" />
                  <span className="leftM">
                    <img src={MASCOT_IMAGES[mascot.animal] || pawIcon} alt="" className="ui-icon ui-icon-xs" />
                  </span>
                  <span className="leftM">
                    {mascot.animal} {mascot.name} • {user?.status_label}
                    {user?.is_volunteer ? (
                      <> • <img src={pawIcon} alt="" className="ui-icon ui-icon-xs" /> <span className="leftM">Волонтёр</span></>
                    ) : null}
                  </span>
                </span>
              </div>
              <p className="user-email">
                <img src={mailIcon} alt="Email" className="ui-icon ui-icon-xs" /><span className='leftM'>{user?.email}</span>
              </p>
              <p className="user-meta">
                <img src={calendarIcon} alt="Дата" className="ui-icon ui-icon-xs" /><span className='leftM'> В клубе
                друзей приюта с {formatDate(user?.created_at) || "сегодня"}</span>
              </p>
              {mascot.greeting && <p className="user-meta">{mascot.greeting}</p>}
            </div>
          </div>
          <div
            className="profile-mascot-box"
            title={`Талисман приюта: ${mascot.animal} ${mascot.name}`}
          >
            <CanvasFallback
              fallback={
                <div className="mascot-emoji-fallback">
                  <img src={MASCOT_IMAGES[mascot.animal] || pawIcon} alt="" className="mascot-svg-fallback" />
                </div>
              }
            >
              <ProfileMascot3D animal={mascot.animal} />
            </CanvasFallback>
          </div>
          <div className="user-card-actions">
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Выйти из аккаунта
            </Button>
          </div>
        </div>

        <nav className="profile-subnav">
          <NavLink
            to="/profile"
            end
            className={({ isActive }) => `profile-nav-tab ${isActive ? "active" : ""}`}
          >
            <img src={userIcon} alt="" className="ui-icon ui-icon-sm" /> Мой профиль
          </NavLink>

          <NavLink
            to="/profile/favorites"
            className={({ isActive }) => `profile-nav-tab ${isActive ? "active" : ""}`}
          >
            <img src={heartFilledIcon} alt="" className="ui-icon ui-icon-sm" /> Избранные питомцы
            <span className="tab-counter">{favorites.length}</span>
          </NavLink>

          <NavLink
            to="/profile/applications"
            className={({ isActive }) => `profile-nav-tab ${isActive ? "active" : ""}`}
          >
            <img src={documentIcon} alt="" className="ui-icon ui-icon-sm" /> Мои заявки
            <span className="tab-counter">{applications.length}</span>
          </NavLink>
        </nav>

        <div className="profile-tab-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

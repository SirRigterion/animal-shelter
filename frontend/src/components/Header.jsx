// src/components/Header.jsx
// Шапка сайта с навигацией, адаптивным меню и статусом авторизации

import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { userAvatarUrl } from "../api";
import Button from "./Button";
import pawIcon from "../assets/icons/paw.svg";
import heartFilledIcon from "../assets/icons/heart-filled.svg";
import userIcon from "../assets/icons/user.svg";

export default function Header() {
  const { user, logout, favorites } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const avatarUrl = userAvatarUrl(user);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    navigate("/");
  };

  const closeMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="site-header">
      <div className="container header-container">
        <Link to="/" className="site-logo" onClick={closeMenu}>
          <img src={pawIcon} alt="Лапа Помощи" className="ui-icon logo-icon-img" />
          <span className="logo-text">
            Лапа <strong>Помощи</strong>
          </span>
        </Link>

        <button
          type="button"
          className="mobile-burger-btn"
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          aria-label="Переключить меню"
        >
          {isMobileMenuOpen ? "✕" : "☰"}
        </button>

        <nav className={`main-nav ${isMobileMenuOpen ? "open" : ""}`}>
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            onClick={closeMenu}
          >
            Главная
          </NavLink>

          <NavLink
            to="/catalog"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            onClick={closeMenu}
          >
            Наши питомцы
          </NavLink>

          <NavLink
            to="/volunteer"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            onClick={closeMenu}
          >
            Волонтёрам
          </NavLink>

          <div className="nav-auth-section">
            {user ? (
              <div className="user-logged-block">
                <NavLink
                  to="/profile"
                  className={({ isActive }) =>
                    `nav-link profile-link ${isActive ? "active" : ""}`
                  }
                  onClick={closeMenu}
                >
                  <span className="user-avatar-small">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Аватар" />
                    ) : user.name ? (
                      user.name[0].toUpperCase()
                    ) : (
                      <img src={userIcon} alt="Профиль" className="ui-icon ui-icon-xs" />
                    )}
                  </span>
                  <span className="user-name-text">{user.name}</span>
                  {favorites.length > 0 && (
                    <span className="fav-count-badge" title="Избранных питомцев">
                      <img src={heartFilledIcon} alt="Избранное" className="ui-icon ui-icon-xs" />{" "}
                      {favorites.length}
                    </span>
                  )}
                </NavLink>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="logout-btn"
                >
                  Выйти
                </Button>
              </div>
            ) : (
              <div className="guest-actions">
                <Link to="/login" className="btn btn-ghost btn-sm" onClick={closeMenu}>
                  Войти
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm" onClick={closeMenu}>
                  Регистрация
                </Link>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}

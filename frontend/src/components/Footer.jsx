// src/components/Footer.jsx
// Подвал сайта с контактами и информацией о приюте

import { Link } from "react-router-dom";
import pawIcon from "../assets/icons/paw.svg";
import locationIcon from "../assets/icons/location.svg";
import phoneIcon from "../assets/icons/phone.svg";
import mailIcon from "../assets/icons/mail.svg";
import clockIcon from "../assets/icons/clock.svg";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-column">
          <div className="footer-logo">
            <img src={pawIcon} alt="Лапа Помощи" className="ui-icon logo-icon-img" />
            <span className="logo-text">
              Лапа <strong>Помощи</strong>
            </span>
          </div>
          <p className="footer-desc">
            Благотворительный приют для кошек и собак. Мы лечим, социализируем и находим
            любящие семьи для бездомных хвостиков с 2018 года.
          </p>
        </div>

        <div className="footer-column">
          <h4 className="footer-heading">Навигация</h4>
          <ul className="footer-links">
            <li>
              <Link to="/">Главная страница</Link>
            </li>
            <li>
              <Link to="/catalog">Каталог питомцев</Link>
            </li>
            <li>
              <Link to="/profile">Личный кабинет</Link>
            </li>
            <li>
              <Link to="/login">Вход для волонтёров</Link>
            </li>
          </ul>
        </div>

        <div className="footer-column">
          <h4 className="footer-heading">Контакты и адрес</h4>
          <ul className="footer-contacts">
            <li>
              <img src={locationIcon} alt="Адрес" className="ui-icon ui-icon-sm" /> г. Москва, ул. Лесная Поляна, стр. 14
            </li>
            <li>
              <img src={phoneIcon} alt="Телефон" className="ui-icon ui-icon-sm" /> +7 (555) 880-35-35
            </li>
            <li>
              <img src={mailIcon} alt="Email" className="ui-icon ui-icon-sm" /> info@lapapomoshi.ru
            </li>
            <li>
              <img src={clockIcon} alt="Режим работы" className="ui-icon ui-icon-sm" /> Приём гостей: Вт-Вс с 11:00 до 19:00
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-content">
          <p>© {new Date().getFullYear()} Приют животных «Лапа Помощи». Все права защищены.</p>
          <Link to="/privacy" className="footer-policy-link">
            Политика конфиденциальности и обработки персональных данных
          </Link>
        </div>
      </div>
    </footer>
  );
}

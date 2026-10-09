// src/pages/NotFound.jsx
// Страница 404 для несуществующих маршрутов

import { Link, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import pawIcon from "../assets/icons/paw.svg";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="not-found-page page-enter">
      <div className="container not-found-container">
        <div className="not-found-content">
          <div className="not-found-code">404</div>
          <img src={pawIcon} alt="404" className="ui-icon not-found-paw-img" />
          <h1 className="not-found-title">Ой! Страница потерялась</h1>
          <p className="not-found-description">
            Похоже, этот хвостик убежал слишком далеко, или адрес страницы был введен
            с ошибкой. Не переживайте, все наши питомцы в безопасности!
          </p>

          <div className="not-found-actions">
            <Button variant="primary" size="lg" onClick={() => navigate("/")}>
              На главную
            </Button>
            <Link to="/catalog">
              <Button variant="outline" size="lg">
                В каталог питомцев
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

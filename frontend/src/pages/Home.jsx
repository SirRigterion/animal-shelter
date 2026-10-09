// src/pages/Home.jsx
// Главная страница приюта: витрина питомцев приходит из API backend

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api";
import { useAuth } from "../context/AuthContext";
import PetCard from "../components/PetCard";
import Button from "../components/Button";
import pawIcon from "../assets/icons/paw.svg";
import heartFilledIcon from "../assets/icons/heart-filled.svg";
import seapingImg from "../assets/pets/seapig.png";
import AnimalShowcase3D from "../components/three/AnimalShowcase3D";
import CanvasFallback from "../components/three/CanvasFallback";

export default function Home() {
  const { favorites, toggleFavorite } = useAuth();
  const [pets, setPets] = useState([]);

  useEffect(() => {
    let cancelled = false;
    apiFetch("/api/pets")
      .then((data) => {
        if (!cancelled) setPets(data);
      })
      .catch(() => {
        
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const featuredPets = pets.slice(0, 4);

  return (
    <div className="home-page page-enter">
      <section className="hero-section">
        <div className="container hero-container">
          <div className="hero-content">
            <span className="hero-tag">
              <img src={pawIcon} alt="" className="ui-icon ui-icon-xs" /> Добро пожаловать в приют «Лапа Помощи»
            </span>
            <h1 className="hero-title">
              Каждый хвостик заслуживает <span className="highlight">любящий дом</span>
            </h1>
            <p className="hero-description">
              Более 400 кошек и собак уже нашли свои семьи благодаря нашему приюту.
              Познакомьтесь с теми, кто прямо сейчас ждёт своего человека.
            </p>
            <div className="hero-buttons">
              <Link to="/catalog">
                <Button variant="primary" size="lg">
                  Выбрать питомца →
                </Button>
              </Link>
              <a href="#how-to-adopt">
                <Button variant="outline" size="lg">
                  Как забрать друга
                </Button>
              </a>
            </div>
          </div>
          <div className="hero-image-box">
            <img
              src={seapingImg}
              alt="Баннер с морскими свинками"
              className="hero-image"
            />
            <div className="hero-floating-card">
              <img src={heartFilledIcon} alt="Семья" className="ui-icon ui-icon-lg" />
              <div>
                <strong>380+ питомцев</strong>
                <p>уже обрели любящую семью</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="container stats-grid">
          <div className="stat-card">
            <div className="stat-number">450+</div>
            <div className="stat-label">Спасённых жизней</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">380+</div>
            <div className="stat-label">Нашли постоянный дом</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">100%</div>
            <div className="stat-label">Привиты и обработаны</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">60+</div>
            <div className="stat-label">Активных волонтёров</div>
          </div>
        </div>
      </section>

      <section className="featured-pets-section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Они очень ждут вас</h2>
              <p className="section-subtitle">
                Познакомьтесь с подопечными, которым срочно нужен тёплый дом
              </p>
            </div>
            <Link to="/catalog" className="btn btn-outline">
              Весь каталог ({pets.length}) →
            </Link>
          </div>

          {featuredPets.length === 0 ? (
            <p className="section-subtitle">
              Подопечные загружаются с сервера... Если список пуст, запустите backend
              (см. backend/README.md).
            </p>
          ) : (
            <div className="pets-grid">
              {featuredPets.map((pet) => (
                <PetCard
                  key={pet.id}
                  pet={pet}
                  isFavorite={favorites.includes(pet.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="how-to-adopt" className="steps-section">
        <div className="container">
          <h2 className="section-title text-center">Как взять питомца из приюта</h2>
          <p className="section-subtitle text-center">
            Четыре простых шага навстречу вашему новому верному другу
          </p>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-badge">1</div>
              <h3>Выберите друга</h3>
              <p>Полистайте каталог, почитайте анкеты и выберите хвостика по душе.</p>
            </div>
            <div className="step-card">
              <div className="step-badge">2</div>
              <h3>Подайте заявку</h3>
              <p>Заполните простую форму в карточке питомца для назначения встречи.</p>
            </div>
            <div className="step-card">
              <div className="step-badge">3</div>
              <h3>Приезжайте знакомиться</h3>
              <p>Прогуляйтесь, пообщайтесь с питомцем и куратором приюта.</p>
            </div>
            <div className="step-card">
              <div className="step-badge">4</div>
              <h3>Едем домой!</h3>
              <p>Заключаем договор ответственного содержания и провожаем вас домой.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="showcase-3d-frame container cta-box">
          <CanvasFallback fallback={null}>
            <AnimalShowcase3D />
          </CanvasFallback>
          <h2>Готовы подарить заботу и любовь?</h2>
          <p>
            Даже если вы пока не готовы забрать животное, вы можете стать волонтёром,
            помочь кормом или просто рассказать о нас друзьям!
          </p>
          <div className="cta-actions">
            <Link to="/catalog">
              <Button variant="primary" size="lg">
                Посмотреть всех подопечных
              </Button>
            </Link>
            <Link to="/volunteer">
              <Button variant="outline" size="lg">
                Стать волонтёром
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

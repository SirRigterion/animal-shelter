// src/pages/ProfileFavorites.jsx
// Вложенный подраздел «Избранные питомцы» – анкеты загружаются из API

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api";
import { useAuth } from "../context/AuthContext";
import PetCard from "../components/PetCard";
import Button from "../components/Button";
import heartFilledIcon from "../assets/icons/heart-filled.svg";

export default function ProfileFavorites() {
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

  const favoritePets = pets.filter((pet) => favorites.includes(pet.id));

  return (
    <div className="profile-favorites-page page-enter">
      <div className="tab-header">
        <h2 className="tab-title">Избранные хвостики</h2>
        <p className="tab-subtitle">
          Питомцы, которых вы отметили сердечком. Вы можете вернуться к их анкетам в любой
          момент.
        </p>
      </div>

      {favoritePets.length === 0 ? (
        <div className="empty-state-card">
          <img src={heartFilledIcon} alt="Избранное" className="ui-icon empty-state-img" />
          <h3>Список избранного пока пуст</h3>
          <p>
            Вам ещё никто не приглянулся? Перейдите в каталог, чтобы познакомиться с нашими
            замечательными кошками и собаками!
          </p>
          <Link to="/catalog">
            <Button variant="primary">Перейти в каталог питомцев →</Button>
          </Link>
        </div>
      ) : (
        <div className="pets-grid">
          {favoritePets.map((pet) => (
            <PetCard
              key={pet.id}
              pet={pet}
              isFavorite={true}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
}

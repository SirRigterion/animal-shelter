// src/components/PetCard.jsx
// Карточка питомца для каталога, главной страницы и избранного.
// Фотография приходит с сервера (uploads/); если её нет – показываем заглушку.

import { Link } from "react-router-dom";
import Badge from "./Badge";
import { petImageUrl } from "../api";
import heartFilledIcon from "../assets/icons/heart-filled.svg";
import heartOutlineIcon from "../assets/icons/heart-outline.svg";
import clockIcon from "../assets/icons/clock.svg";
import catIcon from "../assets/icons/cat.svg";
import dogIcon from "../assets/icons/dog.svg";
import checkIcon from "../assets/icons/check.svg";
import seapigPlaceholder from "../assets/pets/seapig.png";

export default function PetCard({ pet, isFavorite = false, onToggleFavorite }) {
  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(pet.id);
    }
  };

  return (
    <article className="pet-card">
      <div className="pet-card-image-wrapper">
        <img
          src={petImageUrl(pet) || seapigPlaceholder}
          alt={pet.name}
          className="pet-card-image"
          loading="lazy"
        />
        <button
          type="button"
          onClick={handleFavoriteClick}
          className={`pet-favorite-btn ${isFavorite ? "active" : ""}`}
          title={isFavorite ? "Удалить из избранного" : "Добавить в избранное"}
          aria-label="В избранное"
        >
          <img
            src={isFavorite ? heartFilledIcon : heartOutlineIcon}
            alt={isFavorite ? "В избранном" : "Добавить в избранное"}
            className="ui-icon"
          />
        </button>

        <div className="pet-status-badge">
          <Badge variant={pet.status === "Ищет дом" ? "success" : "warning"}>
            {pet.status}
          </Badge>
        </div>
      </div>

      <div className="pet-card-content">
        <div className="pet-card-header">
          <h3 className="pet-name">{pet.name}</h3>
          <span className="pet-gender-icon">{pet.gender_label}</span>
        </div>

        <p className="pet-breed">{pet.breed}</p>

        <div className="pet-tags">
          <Badge variant="info">
            <img src={clockIcon} alt="" className="ui-icon ui-icon-xs" /> <p className="leftM">{pet.age}</p>
          </Badge>
          <Badge variant="purple">
            <img
              src={pet.type === "cat" ? catIcon : dogIcon}
              alt=""
              className="ui-icon ui-icon-xs"
            />{" "}
            <p className="leftM">{pet.type_label}</p>
          </Badge>
          {pet.vaccinated && (
            <Badge variant="default">
              <img src={checkIcon} alt="" className="ui-icon ui-icon-xs" /> <p className="leftM">Привит</p>
            </Badge>
          )}
        </div>

        <p className="pet-short-desc">{pet.short_desc}</p>

        <div className="pet-card-footer">
          <Link to={`/catalog/${pet.id}`} className="btn btn-outline btn-full">
            Подробнее о {pet.name} →
          </Link>
        </div>
      </div>
    </article>
  );
}

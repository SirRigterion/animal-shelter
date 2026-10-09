// src/pages/Catalog.jsx
// Каталог питомцев: данные приходят из API, фильтрация выполняется на клиенте

import { useState, useEffect } from "react";
import { apiFetch, petAgeGroup } from "../api";
import { useAuth } from "../context/AuthContext";
import PetCard from "../components/PetCard";
import PetFilter from "../components/PetFilter";
import Loader from "../components/Loader";
import Button from "../components/Button";
import searchIcon from "../assets/icons/search.svg";

export default function Catalog() {
  const { favorites, toggleFavorite } = useAuth();
  const [pets, setPets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [filters, setFilters] = useState({
    search: "",
    type: "all",
    gender: "all",
    ageGroup: "all"
  });

  useEffect(() => {
    let cancelled = false;
    apiFetch("/api/pets")
      .then((data) => {
        if (cancelled) return;
        setPets(data);
        setIsLoading(false);
      })
      .catch((error) => {
        if (cancelled) return;
        setLoadError(error.message);
        setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleFilterChange = (filterKey, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterKey]: value
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      type: "all",
      gender: "all",
      ageGroup: "all"
    });
  };

  const filteredPets = pets.filter((pet) => {
    if (filters.search.trim() !== "") {
      const q = filters.search.toLowerCase().trim();
      const matchName = pet.name.toLowerCase().includes(q);
      const matchBreed = (pet.breed || "").toLowerCase().includes(q);
      if (!matchName && !matchBreed) return false;
    }

    if (filters.type !== "all" && pet.type !== filters.type) {
      return false;
    }

    if (filters.gender !== "all" && pet.gender !== filters.gender) {
      return false;
    }

    if (filters.ageGroup !== "all" && petAgeGroup(pet) !== filters.ageGroup) {
      return false;
    }

    return true;
  });

  return (
    <div className="catalog-page page-enter">
      <div className="container">
        <div className="catalog-hero-header">
          <h1 className="page-title">Наши подопечные</h1>
          <p className="page-subtitle">
            Каждому из них нужен свой человек. Найдите того, кто растопит ваше сердце!
          </p>
        </div>

        <PetFilter
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
          totalFound={filteredPets.length}
        />

        {isLoading ? (
          <Loader text="Загрузка каталога подопечных..." />
        ) : loadError ? (
          <div className="empty-state-card">
            <img src={searchIcon} alt="Ошибка" className="ui-icon empty-state-img" />
            <h3>Не удалось загрузить каталог</h3>
            <p>{loadError}. Убедитесь, что backend запущен: python run.py в папке backend.</p>
            <Button variant="primary" onClick={() => window.location.reload()}>
              Попробовать снова
            </Button>
          </div>
        ) : filteredPets.length === 0 ? (
          <div className="empty-state-card">
            <img src={searchIcon} alt="Не найдено" className="ui-icon empty-state-img" />
            <h3>Питомцы не найдены</h3>
            <p>По вашему запросу никого не нашлось. Попробуйте изменить параметры поиска или сбросить фильтры.</p>
            <Button variant="primary" onClick={handleResetFilters}>
              Сбросить все фильтры
            </Button>
          </div>
        ) : (
          <div className="pets-grid">
            {filteredPets.map((pet) => (
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
    </div>
  );
}

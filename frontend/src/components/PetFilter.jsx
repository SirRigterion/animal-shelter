// src/components/PetFilter.jsx
// Фильтрация и поиск питомцев в каталоге

import Button from "./Button";
import searchIcon from "../assets/icons/search.svg";
import refreshIcon from "../assets/icons/refresh.svg";

export default function PetFilter({
  filters,
  onFilterChange,
  onReset,
  totalFound
}) {
  return (
    <div className="pet-filter-box">
      <div className="filter-header">
        <h2 className="filter-title">Поиск и фильтры</h2>
        <span className="filter-count">
          Найдено: <strong>{totalFound}</strong>
        </span>
      </div>

      <div className="filter-grid">
        <div className="filter-group filter-search">
          <label htmlFor="search-input">Поиск по имени или породе</label>
          <div className="search-input-wrapper">
            <img src={searchIcon} alt="Поиск" className="ui-icon search-icon" />
            <input
              id="search-input"
              type="text"
              placeholder="Например: Барсик, корги..."
              value={filters.search}
              onChange={(e) => onFilterChange("search", e.target.value)}
              className="form-input"
            />
            {filters.search && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => onFilterChange("search", "")}
                title="Очистить поиск"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="filter-group">
          <label htmlFor="type-select">Вид питомца</label>
          <select
            id="type-select"
            value={filters.type}
            onChange={(e) => onFilterChange("type", e.target.value)}
            className="form-select"
          >
            <option value="all">Все хвостики</option>
            <option value="cat">Только кошки</option>
            <option value="dog">Только собаки</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="gender-select">Пол</label>
          <select
            id="gender-select"
            value={filters.gender}
            onChange={(e) => onFilterChange("gender", e.target.value)}
            className="form-select"
          >
            <option value="all">Любой пол</option>
            <option value="male">Мальчик</option>
            <option value="female">Девочка</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="age-select">Возрастная группа</label>
          <select
            id="age-select"
            value={filters.ageGroup}
            onChange={(e) => onFilterChange("ageGroup", e.target.value)}
            className="form-select"
          >
            <option value="all">Любой возраст</option>
            <option value="baby">Малыши (до 1 года)</option>
            <option value="adult">Взрослые (от 1 года)</option>
          </select>
        </div>
      </div>

      <div className="filter-actions">
        <Button variant="ghost" size="sm" onClick={onReset}>
          <img src={refreshIcon} alt="" className="ui-icon ui-icon-sm" /> Сбросить фильтры
        </Button>
      </div>
    </div>
  );
}

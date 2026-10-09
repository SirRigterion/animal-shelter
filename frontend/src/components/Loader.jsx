// src/components/Loader.jsx
// Индикатор загрузки данных

import pawIcon from "../assets/icons/paw.svg";

export default function Loader({ text = "Загружаем подопечных..." }) {
  return (
    <div className="loader-container">
      <div className="spinner">
        <img src={pawIcon} alt="Загрузка" className="ui-icon paw-print-img" />
      </div>
      <p className="loader-text">{text}</p>
    </div>
  );
}

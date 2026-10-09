// src/pages/ProfileInfo.jsx
// Профиль пользователя: контактные данные сохраняются на сервере (PATCH /api/profile),
// аватар загружается в uploads/ (POST /api/users/{id}/avatar)

import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { userAvatarUrl } from "../api";
import Button from "../components/Button";
import infoIcon from "../assets/icons/info.svg";
import userIcon from "../assets/icons/user.svg";

const formatPhone = (value) => {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("8")) {
    digits = "7" + digits.slice(1);
  }
  if (digits.startsWith("9")) {
    digits = "7" + digits;
  }
  digits = digits.slice(0, 11);
  if (!digits) return "";
  let result = "+7";
  if (digits.length > 1) {
    result += ` (${digits.slice(1, 4)}`;
  }
  if (digits.length >= 4) {
    result += ")";
  }
  if (digits.length > 4) {
    result += ` ${digits.slice(4, 7)}`;
  }
  if (digits.length > 7) {
    result += `-${digits.slice(7, 9)}`;
  }
  if (digits.length > 9) {
    result += `-${digits.slice(9, 11)}`;
  }
  return result;
};

export default function ProfileInfo() {
  const { user, updateProfile, uploadAvatar } = useAuth();
  const fileInputRef = useRef(null);

  const [nameInput, setNameInput] = useState(user?.name || "");
  const [phoneInput, setPhoneInput] = useState(formatPhone(user?.phone || ""));
  const [cityInput, setCityInput] = useState(user?.city || "Москва");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [avatarError, setAvatarError] = useState("");


  const handleSaveProfile = async (e) => {
    e.preventDefault();

    setIsSaving(true);
    setSaveError("");
    setSaveSuccess(false);

    try {
      const result = await updateProfile({
        name: nameInput.trim(),
        phone: phoneInput.trim(),
        city: cityInput.trim()
      });

      if (result.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setSaveError(result.error || "Не удалось сохранить профиль");
      }
    } catch (error) {
      setSaveError(error.message || "Не удалось сохранить профиль");
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError("");
    const result = await uploadAvatar(file);
    if (!result.success) {
      setAvatarError(result.error || "Не удалось загрузить аватар");
    }
    e.target.value = "";
  };

  const avatarUrl = userAvatarUrl(user);

  return (
    <div className="profile-info-section page-enter">
      <div className="profile-edit-grid">
        <div className="profile-box">
          <h2 className="box-title">Контактные данные</h2>
          <p className="box-subtitle">
            Эти данные используются куратором приюта для подтверждения даты вашего визита
          </p>

          {saveSuccess && (
            <div className="alert alert-success">Данные профиля успешно сохранены!</div>
          )}
          {saveError && <div className="alert alert-error">{saveError}</div>}
          {avatarError && <div className="alert alert-error">{avatarError}</div>}

          <div className="profile-avatar-row">
            <div className="user-avatar-large">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Аватар" />
              ) : user?.name ? (
                user.name[0].toUpperCase()
              ) : (
                <img src={userIcon} alt="Профиль" className="ui-icon ui-icon-lg" />
              )}
            </div>
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Загрузить аватар
              </Button>
              <p className="box-subtitle">PNG/JPG до 5 МБ – файл сохранится на сервере</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                onChange={handleAvatarChange}
                hidden
              />
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="profile-form">
            <div className="form-group">
              <label htmlFor="profile-name">ФИО / Имя</label>
              <input
                id="profile-name"
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="form-input"
                minLength={2}
                required
              />
            </div>

            <div className="form-group">
              <label>Email (логин)</label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="form-input disabled-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="user-phone">Телефон для связи *</label>
              <input
                id="user-phone"
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(formatPhone(e.target.value))}
                placeholder="+7 (999) 000-00-00"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="user-city">Город проживания</label>
              <input
                id="user-city"
                type="text"
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                placeholder="Москва"
                className="form-input"
              />
            </div>

            <Button type="submit" variant="primary" size="md" disabled={isSaving}>
              {isSaving ? "Сохраняем..." : "Сохранить изменения"}
            </Button>
          </form>
        </div>

        <div className="profile-box info-reminder-box">
          <h2 className="box-title">
            <img src={infoIcon} alt="" className="ui-icon ui-icon-md" /> Памятка будущего хозяина
          </h2>
          <ul className="reminder-list">
            <li>
              <strong>Знакомство в приюте:</strong> мы рекомендуем погулять с собакой или
              посидеть с котиком в игровой комнате минимум 30-40 минут.
            </li>
            <li>
              <strong>Подготовка дома:</strong> перед переездом питомца позаботьтесь о
              мисках, лежанках, безопасных сетках на окнах (для кошек) и поводке.
            </li>
            <li>
              <strong>Договор:</strong> животные передаются по договору ответственного
              содержания с паспортом будущего владельца.
            </li>
            <li>
              <strong>Поддержка куратора:</strong> мы всегда на связи и помогаем советами по
              адаптации в первые месяцы после пристроя.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

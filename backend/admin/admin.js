/*
 * Админ-панель «Лапа Помощи» – vanilla JS.
 * Все данные подгружаются через fetch() к REST API (ничего не «зашито» в HTML),
 * каждое действие – реальный запрос к серверу с обновлением отображения.
 * Удаление – в два клика: первый только «взводит» кнопку, второй выполняет.
 * Иконки – инлайновые SVG в стиле основного сайта (окрашиваются через currentColor).
 */
"use strict";

const ADMIN_TOKEN_STORAGE = "shelter_admin_token";

const ICONS = SITE_ICONS;

function icon(name, cls = "") {
  const def = ICONS[name];
  if (!def) return "";
  const viewBox = def.viewBox || "0 0 24 24";
  const attrs = def.fill
    ? 'fill="currentColor"'
    : 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  return `<svg class="icon ${cls}" viewBox="${viewBox}" ${attrs} aria-hidden="true" focusable="false">${def.body}</svg>`;
}

const STATUS_LABELS = {
  inactive: "Не активен",
  verified: "Верифицирован",
  admin: "Администратор",
};
const MASCOTS = {
  inactive: { animal: "Муха", name: "Жужа", icon: "fly" },
  verified: { animal: "Лис", name: "Фуфырик", icon: "fox" },
  admin: { animal: "Слон", name: "Бонифаций", icon: "elephant" },
};
const PET_TYPES = { cat: "Кошка", dog: "Собака", other: "Другое" };
const PET_TYPE_ICON = { cat: "cat", dog: "dog", other: "paw" };
const PET_GENDERS = { male: "Мальчик", female: "Девочка" };
const PET_STATUSES = ["Ищет дом", "На передержке", "Нашёл дом"];
const PET_STATUS_BADGE = {
  "Ищет дом": "badge-amber",
  "На передержке": "badge-blue",
  "Нашёл дом": "badge-green",
};
const ORDER_STATUSES = ["На рассмотрении", "Встреча назначена", "Одобрена", "Отклонена"];
const ORDER_STATUS_BADGE = {
  "На рассмотрении": "badge-amber",
  "Встреча назначена": "badge-blue",
  "Одобрена": "badge-green",
  "Отклонена": "badge-red",
};
const DIRECTIONS = {
  walk: "Выгул собак",
  care: "Уход и кормление",
  photo: "Фотосъёмка питомцев",
  transport: "Транспортировка",
  events: "Помощь на мероприятиях",
  vet: "Помощь ветеринару",
};
const DIRECTION_ICON = { walk: "dog", care: "heart_filled", photo: "camera", transport: "car", events: "sparkle", vet: "medical" };
const VOLUNTEER_STATUSES = { new: "Новая", approved: "Одобрена", rejected: "Отклонена" };

const state = {
  token: sessionStorage.getItem(ADMIN_TOKEN_STORAGE) || "",
  users: [],
  pets: [],
  orders: [],
  volunteerApps: [],
  hours: { entries: [], totals: [] },
  uploads: [],
  editingPetId: null,
};

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[ch]);
}

/** Контейнер по id; если секции нет в HTML (например, старая вкладка) – рендер просто пропускается. */
function container(id) {
  return document.getElementById(id);
}

function fmtDate(value) {
  if (!value) return "–";
  const [year, month, day] = String(value).slice(0, 10).split("-");
  return `${day}.${month}.${year}`;
}

function fmtDateTime(value) {
  if (!value) return "–";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fmtDate(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fmtSize(bytes) {
  if (bytes > 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " МБ";
  return Math.max(1, Math.round(bytes / 1024)) + " КБ";
}

let toastTimer = null;
function toast(message, isError = false) {
  const node = document.getElementById("toast");
  node.textContent = message;
  node.classList.remove("hidden");
  node.classList.toggle("toast-error", isError);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.add("hidden"), 3200);
}

function emptyState(iconName, text) {
  return `<div class="empty-state"><span class="empty-icon">${icon(iconName)}</span>${esc(text)}</div>`;
}

/* ---------------- Общий запрос к API ---------------- */

async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  const response = await fetch(path, { ...options, headers });
  if (response.status === 401 || response.status === 403) {
    showLogin();
    throw new Error("Требуется вход администратора");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || `Ошибка ${response.status}`);
  }
  return data;
}

async function safeApi(path, options = {}) {
  try {
    return await api(path, options);
  } catch (error) {
    toast(error.message, true);
    return null;
  }
}

/* Безопасное удаление: первый клик «взводит» кнопку («Точно?»), второй выполняет.
   Случайный клик по умолчанию ничего не удаляет. */
function armDelete(button, onConfirm) {
  if (button.dataset.armed === "1") {
    onConfirm();
    return;
  }
  button.dataset.armed = "1";
  button.dataset.label = button.innerHTML;
  button.innerHTML = "Точно?";
  button.classList.add("armed");
  setTimeout(() => {
    if (!document.body.contains(button)) return;
    button.dataset.armed = "";
    button.innerHTML = button.dataset.label;
    button.classList.remove("armed");
  }, 3000);
}

/* ---------------- Вход / выход ---------------- */

function showLogin() {
  sessionStorage.removeItem(ADMIN_TOKEN_STORAGE);
  state.token = "";
  document.getElementById("app").classList.add("hidden");
  document.getElementById("login-screen").classList.remove("hidden");
}

function showApp() {
  document.getElementById("login-screen").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
}

async function tryLogin(email, password) {
  const response = await fetch("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim(), password }),
  });
  if (response.status !== 200) return false;
  const data = await response.json();
  state.token = data.token;
  sessionStorage.setItem(ADMIN_TOKEN_STORAGE, state.token);
  return true;
}

/* ---------------- Навигация по вкладкам ---------------- */

const LOADERS = {};

function switchView(name) {
  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === name);
  });
  document.querySelectorAll(".view").forEach((section) => {
    section.classList.toggle("hidden", section.id !== `view-${name}`);
  });
  const loader = LOADERS[name];
  if (loader) loader();
}

/* ---------------- Дашборд ---------------- */

LOADERS.dashboard = async () => {
  const stats = await safeApi("/api/admin/stats");
  if (!stats) return;
  renderStats(stats);
};

function renderStats(stats) {
  if (!container("stats-cards")) return;
  const cards = [
    { icon: "user", value: stats.users.total, label: "Пользователей всего", tone: "primary" },
    { icon: "award", value: stats.users.volunteers, label: "Волонтёров с бейджем", tone: "green" },
    { icon: "dog", value: stats.pets.total, label: "Питомцев в базе", tone: "amber" },
    { icon: "document", value: stats.orders.total, label: "Заявок на знакомство", tone: "blue" },
    { icon: "sparkle", value: stats.volunteers.applications_total, label: "Заявок в волонтёры", tone: "green" },
    { icon: "clock", value: stats.volunteers.hours_total, label: "Часов волонтёрства", tone: "primary" },
  ];
  document.getElementById("stats-cards").innerHTML = cards.map((card) => `
    <div class="stat-card">
      <div class="stat-top">
        <span class="stat-icon tone-${card.tone}">${icon(card.icon)}</span>
        <span class="stat-value">${esc(card.value)}</span>
      </div>
      <div class="stat-label">${esc(card.label)}</div>
    </div>
  `).join("");
  // Крупные чипы: одно понятное название + число
  const chips = [
    { icon: "heart_filled", label: "Ищут дом", value: stats.pets.by_status["Ищет дом"], cls: "chip-amber" },
    { icon: "clock", label: "Заявки в работе", value: stats.orders.by_status["На рассмотрении"], cls: "chip-amber" },
    { icon: "calendar", label: "Встречи назначены", value: stats.orders.by_status["Встреча назначена"], cls: "chip-blue" },
    { icon: "check", label: "Одобренные встречи", value: stats.orders.by_status["Одобрена"], cls: "chip-green" },
    { icon: "sparkle", label: "Новые волонтёры", value: stats.volunteers.applications_by_status.new, cls: "chip-amber" },
    { icon: "image", label: "Фото в галерее", value: stats.uploads_count, cls: "chip-green" },
  ];
  document.getElementById("stats-breakdown").innerHTML = chips.map((chip) => `
    <div class="big-chip ${chip.cls}">
      <span class="big-chip-icon">${icon(chip.icon)}</span>
      <span class="big-chip-value">${esc(chip.value ?? 0)}</span>
      <span class="big-chip-label">${esc(chip.label)}</span>
    </div>
  `).join("");

  const recent = stats.orders.recent || [];
  document.getElementById("recent-orders").innerHTML = recent.length === 0
    ? emptyState("document", "Заявок пока нет")
    : `<table>
        <thead><tr><th>№</th><th>Питомец</th><th>Пользователь</th><th>Телефон</th><th>Дата визита</th><th>Статус</th><th>Создана</th></tr></thead>
        <tbody>
          ${recent.map((order) => `
            <tr>
              <td>#${order.id}</td>
              <td class="cell-title">${esc(order.pet_name)}</td>
              <td>${esc(order.user_name)}</td>
              <td>${esc(order.phone)}</td>
              <td>${fmtDate(order.visit_date)}</td>
              <td><span class="badge ${ORDER_STATUS_BADGE[order.status] || "badge-gray"}">${esc(order.status)}</span></td>
              <td class="cell-sub">${fmtDateTime(order.created_at)}</td>
            </tr>`).join("")}
        </tbody>
      </table>`;
}

/* ---------------- Пользователи ---------------- */

LOADERS.users = async () => {
  const users = await safeApi("/api/users");
  if (!users) return;
  state.users = users;
  renderUsers();
};

function renderUsers() {
  const containerEl = document.getElementById("users-table");
  if (!containerEl) return;
  if (state.users.length === 0) {
    containerEl.innerHTML = emptyState("user", "Пользователей пока нет – зарегистрируйте кого-нибудь через POST /api/register");
    return;
  }
  containerEl.innerHTML = `<table>
    <thead><tr>
      <th></th><th>Пользователь</th><th>Телефон</th><th>Город</th><th>Статус</th><th>Талисман</th><th>Действия</th>
    </tr></thead>
    <tbody>
      ${state.users.map((user) => {
        const mascot = MASCOTS[user.status] || { icon: "paw", name: "", animal: "" };
        return `<tr data-user-id="${user.id}">
          <td>${user.avatar_url
            ? `<img class="avatar" src="${esc(user.avatar_url)}" alt="">`
            : `<div class="avatar-placeholder">${icon(mascot.icon)}</div>`}</td>
          <td>
            <div class="cell-title">${esc(user.name)}</div>
            <div class="cell-sub">${esc(user.email)}</div>
          </td>
          <td>${esc(user.phone)}</td>
          <td>${esc(user.city || "–")}</td>
          <td>
            <div class="seg-group" role="group" aria-label="Статус пользователя">
              ${Object.entries(STATUS_LABELS).map(([value, label]) =>
                `<button type="button" class="seg-btn ${value === user.status ? "active" : ""}" data-status="${value}">${label}</button>`).join("")}
            </div>
          </td>
          <td class="mascot">
            <span class="mascot-emoji">${icon(mascot.icon)}</span>
            <span class="mascot-name">${esc(mascot.animal)} ${esc(mascot.name)}</span>
          </td>
          <td>
            <div class="row-actions">
              <button class="btn btn-sm ${user.is_volunteer ? "btn-volunteer-active" : "btn-volunteer"}" data-action="toggle-volunteer"
                title="Переключить бейдж волонтёра">${icon("paw")} ${user.is_volunteer ? "Волонтёр" : "В волонтёры"}</button>
              <button class="btn btn-sm" data-action="avatar" title="Загрузить аватар">${icon("camera")} Аватар</button>
              <button class="btn btn-danger btn-sm" data-action="delete-user" title="Удалить пользователя">${icon("trash")}</button>
            </div>
          </td>
        </tr>`;
      }).join("")}
    </tbody>
  </table>`;

  containerEl.querySelectorAll("tr[data-user-id]").forEach((row) => {
    const userId = Number(row.dataset.userId);

    row.querySelectorAll(".seg-btn").forEach((button) => {
      button.addEventListener("click", async () => {
        const updated = await safeApi(`/api/users/${userId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: button.dataset.status }),
        });
        if (updated) {
          const mascot = MASCOTS[updated.status];
          toast(`Статус «${STATUS_LABELS[updated.status]}» – талисман ${mascot.animal} ${mascot.name}`);
          await LOADERS.users();
        }
      });
    });

    row.querySelector('[data-action="toggle-volunteer"]').addEventListener("click", async () => {
      const user = state.users.find((item) => item.id === userId);
      const updated = await safeApi(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_volunteer: !user.is_volunteer }),
      });
      if (updated) {
        toast(updated.is_volunteer
          ? `${updated.name} теперь волонтёр`
          : `Бейдж волонтёра снят с ${updated.name}`);
        await LOADERS.users();
      }
    });

    row.querySelector('[data-action="avatar"]').addEventListener("click", () => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/png,image/jpeg,image/gif,image/webp";
      input.onchange = async () => {
        const file = input.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append("file", file);
        const updated = await safeApi(`/api/users/${userId}/avatar`, { method: "POST", body: formData });
        if (updated) {
          toast(`Аватар ${updated.name} обновлён`);
          await LOADERS.users();
        }
      };
      input.click();
    });

    row.querySelector('[data-action="delete-user"]').addEventListener("click", (event) => {
      armDelete(event.currentTarget, async () => {
        const result = await safeApi(`/api/users/${userId}`, { method: "DELETE" });
        if (result) {
          toast(result.detail);
          await LOADERS.users();
        }
      });
    });
  });
}

/* ---------------- Питомцы ---------------- */

LOADERS.pets = async () => {
  const pets = await safeApi("/api/pets");
  if (!pets) return;
  state.pets = pets;
  renderPets();
};

function renderPets() {
  const container = document.getElementById("pets-grid");
  if (!container) return;
  if (state.pets.length === 0) {
    container.innerHTML = emptyState("paw", "Питомцев пока нет – добавьте первого");
    return;
  }
  container.innerHTML = state.pets.map((pet) => `
    <article class="pet-card" data-pet-id="${pet.id}">
      <div class="pet-photo">
        ${pet.photo_url
          ? `<img src="${esc(pet.photo_url)}" alt="${esc(pet.name)}">`
          : `<span class="pet-photo-icon">${icon(PET_TYPE_ICON[pet.type] || "paw")}</span>`}
      </div>
      <div class="pet-body">
        <div class="pet-name-row">
          <span class="pet-name">${esc(pet.name)}</span>
          <span class="badge ${PET_STATUS_BADGE[pet.status] || "badge-gray"}">${esc(pet.status)}</span>
        </div>
        <div class="pet-meta">
          <span class="pet-meta-type">${icon(PET_TYPE_ICON[pet.type] || "paw", "icon-xs")} ${esc(PET_TYPES[pet.type] || pet.type)}</span>
          · ${esc(PET_GENDERS[pet.gender] || pet.gender)} · ${esc(pet.age || "возраст не указан")}
        </div>
        <div class="pet-meta">${esc(pet.breed || "порода не указана")}</div>
        <div class="pet-flags">
          ${pet.vaccinated ? `<span class="badge badge-green">${icon("syringe", "icon-xs")} вакцинирован</span>` : ""}
          ${pet.sterilized ? `<span class="badge badge-blue">${icon("cut", "icon-xs")} стерилизован</span>` : ""}
          ${pet.has_passport ? `<span class="badge badge-gray">${icon("passport", "icon-xs")} паспорт</span>` : ""}
        </div>
        ${pet.short_desc || pet.description ? `<p class="pet-desc">${esc(pet.short_desc || pet.description)}</p>` : ""}
        <div class="pet-actions">
          <button class="btn btn-sm" data-action="edit-pet">${icon("edit")} Изменить</button>
          <button class="btn btn-danger btn-sm" data-action="delete-pet">${icon("trash")} Удалить</button>
        </div>
      </div>
    </article>
  `).join("");

  container.querySelectorAll(".pet-card").forEach((card) => {
    card.querySelector('[data-action="edit-pet"]').addEventListener("click", () => {
      const pet = state.pets.find((item) => item.id === Number(card.dataset.petId));
      openPetModal(pet);
    });
    card.querySelector('[data-action="delete-pet"]').addEventListener("click", (event) => {
      const pet = state.pets.find((item) => item.id === Number(card.dataset.petId));
      armDelete(event.currentTarget, async () => {
        const result = await safeApi(`/api/pets/${pet.id}`, { method: "DELETE" });
        if (result) {
          toast(result.detail);
          await LOADERS.pets();
        }
      });
    });
  });
}

function openPetModal(pet = null) {
  state.editingPetId = pet ? pet.id : null;
  const form = document.getElementById("pet-form");
  document.getElementById("pet-modal-title").textContent = pet ? `Изменить: ${pet.name}` : "Добавить питомца";
  form.reset();
  const preview = document.getElementById("pet-photo-preview");
  preview.classList.add("hidden");
  if (pet) {
    form.name.value = pet.name;
    form.type.value = pet.type;
    form.gender.value = pet.gender;
    form.age.value = pet.age || "";
    form.breed.value = pet.breed || "";
    form.status.value = pet.status;
    form.vaccinated.checked = pet.vaccinated;
    form.sterilized.checked = pet.sterilized;
    form.has_passport.checked = pet.has_passport;
    form.short_desc.value = pet.short_desc || "";
    form.character.value = (pet.character || []).join(", ");
    form.story.value = pet.story || "";
    if (pet.photo_url) {
      preview.src = pet.photo_url;
      preview.classList.remove("hidden");
    }
  }
  document.getElementById("pet-modal").showModal();
}

async function onPetFormSubmit(event) {
  event.preventDefault();
  const form = document.getElementById("pet-form");
  const formData = new FormData(form);
  formData.set("vaccinated", form.vaccinated.checked ? "true" : "false");
  formData.set("sterilized", form.sterilized.checked ? "true" : "false");
  formData.set("has_passport", form.has_passport.checked ? "true" : "false");
  // Пустое поле файла не отправляем вообще – иначе сервер посчитает это ошибкой формата
  const photoInput = form.elements.photo;
  if (!photoInput.files || photoInput.files.length === 0) {
    formData.delete("photo");
  }

  const url = state.editingPetId ? `/api/pets/${state.editingPetId}` : "/api/pets";
  const method = state.editingPetId ? "PATCH" : "POST";
  const saved = await safeApi(url, { method, body: formData });
  if (saved) {
    document.getElementById("pet-modal").close();
    toast(state.editingPetId ? `Питомец «${saved.name}» обновлён` : `Питомец «${saved.name}» добавлен`);
    await LOADERS.pets();
  }
}

/* ---------------- Заявки ---------------- */

LOADERS.orders = async () => {
  const orders = await safeApi("/api/orders");
  if (!orders) return;
  state.orders = orders;
  renderOrders();
};

function renderOrders() {
  const container = document.getElementById("orders-table");
  if (!container) return;
  if (state.orders.length === 0) {
    container.innerHTML = emptyState("document", "Заявок пока нет");
    return;
  }
  container.innerHTML = `<table>
    <thead><tr>
      <th>№</th><th>Питомец</th><th>Пользователь</th><th>Телефон</th><th>Дата визита</th><th>Комментарий</th><th>Создана</th><th>Статус</th><th></th>
    </tr></thead>
    <tbody>
      ${state.orders.map((order) => `<tr data-order-id="${order.id}">
        <td>#${order.id}</td>
        <td>
          <div class="pet-cell">
            ${order.pet_photo_url
              ? `<img class="thumb" src="${esc(order.pet_photo_url)}" alt="">`
              : `<div class="thumb-placeholder">${icon(PET_TYPE_ICON[order.pet_type] || "paw", "icon-xs")}</div>`}
            <span class="cell-title">${esc(order.pet_name)}</span>
          </div>
        </td>
        <td>${esc(order.user_name)}</td>
        <td>${esc(order.phone)}</td>
        <td>${fmtDate(order.visit_date)}</td>
        <td class="cell-sub clamp-2" title="${esc(order.comment || "")}">${esc(order.comment || "–")}</td>
        <td class="cell-sub">${fmtDateTime(order.created_at)}</td>
        <td>
          <select class="cell-select" data-action="order-status" aria-label="Статус заявки">
            ${ORDER_STATUSES.map((status) =>
              `<option ${status === order.status ? "selected" : ""}>${status}</option>`).join("")}
          </select>
        </td>
        <td><button class="btn btn-danger btn-sm" data-action="delete-order" title="Удалить заявку">${icon("trash")}</button></td>
      </tr>`).join("")}
    </tbody>
  </table>`;

  container.querySelectorAll("select[data-action]").forEach((select) => {
    select.addEventListener("change", onOrderStatusChange);
  });
  container.querySelectorAll("button[data-action='delete-order']").forEach((button) => {
    button.addEventListener("click", (event) => {
      const orderId = Number(button.closest("tr").dataset.orderId);
      armDelete(event.currentTarget, async () => {
        const result = await safeApi(`/api/orders/${orderId}`, { method: "DELETE" });
        if (result) {
          toast(result.detail);
          await LOADERS.orders();
        }
      });
    });
  });
}

async function onOrderStatusChange(event) {
  const select = event.target;
  const orderId = Number(select.closest("tr").dataset.orderId);
  const updated = await safeApi(`/api/orders/${orderId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: select.value }),
  });
  if (updated) {
    toast(`Заявка №${orderId}: статус «${updated.status}»`);
    await LOADERS.orders();
  }
}

/* ---------------- Волонтёрство ---------------- */

LOADERS.volunteers = async () => {
  const [apps, hours, users] = await Promise.all([
    safeApi("/api/volunteers"),
    safeApi("/api/volunteers/hours"),
    safeApi("/api/users"),
  ]);
  if (!apps || !hours) return;
  state.volunteerApps = apps;
  state.hours = hours;
  state.users = users || state.users;
  renderLeaderboard();
  renderVolunteers();
  renderHours();
};

function renderLeaderboard() {
  const container = document.getElementById("hours-leaderboard");
  if (!container) return;
  const totals = state.hours.totals;
  if (totals.length === 0) {
    container.innerHTML = emptyState("trophy", "Часы ещё не отмечены – лидерборд появится после первой записи");
    return;
  }
  const max = Math.max(...totals.map((item) => item.total_hours));
  const medals = ["medal-gold", "medal-silver", "medal-bronze"];
  container.innerHTML = totals.map((item, index) => `
    <div class="leader-row">
      <span class="leader-medal ${medals[index] || "medal-paw"}">${icon("award")}</span>
      <div class="leader-main">
        <div class="leader-name-row">
          <span class="leader-name">${esc(item.user_name)}</span>
          <span class="leader-hours">${esc(item.total_hours)} ч</span>
        </div>
        <div class="leader-bar">
          <div class="leader-bar-fill" style="width:${Math.round((item.total_hours / max) * 100)}%"></div>
        </div>
      </div>
    </div>
  `).join("");
}

function renderVolunteers() {
  const container = document.getElementById("volunteers-table");
  if (!container) return;
  if (state.volunteerApps.length === 0) {
    container.innerHTML = emptyState("user", "Заявок на волонтёрство пока нет");
    return;
  }
  container.innerHTML = `<table>
    <thead><tr>
      <th>№</th><th>Имя</th><th>Контакты</th><th>Город</th><th>Направление</th><th>Мотивация</th><th>Аккаунт</th><th>Подана</th><th>Статус</th><th></th>
    </tr></thead>
    <tbody>
      ${state.volunteerApps.map((application) => `<tr data-app-id="${application.id}">
        <td>#${application.id}</td>
        <td class="cell-title">${esc(application.name)}</td>
        <td>
          <div>${esc(application.email)}</div>
          <div class="cell-sub">${esc(application.phone)}</div>
        </td>
        <td>${esc(application.city || "–")}</td>
        <td><span class="badge badge-blue">${icon(DIRECTION_ICON[application.direction] || "paw", "icon-xs")} ${esc(application.direction_label)}</span></td>
        <td class="cell-sub clamp-2" title="${esc(application.motivation || "")}">${esc(application.motivation || "–")}</td>
        <td>${application.user_id ? `<span class="badge badge-gray">id ${application.user_id}</span>` : '<span class="badge badge-gray">гость</span>'}</td>
        <td class="cell-sub">${fmtDateTime(application.created_at)}</td>
        <td>
          <div class="seg-group seg-compact" role="group" aria-label="Статус заявки">
            ${Object.entries(VOLUNTEER_STATUSES).map(([value, label]) =>
              `<button type="button" class="seg-btn ${value === application.status ? "active" : ""}" data-status="${value}">${label}</button>`).join("")}
          </div>
        </td>
        <td><button class="btn btn-danger btn-sm" data-action="delete-app" title="Удалить заявку">${icon("trash")}</button></td>
      </tr>`).join("")}
    </tbody>
  </table>`;

  container.querySelectorAll("tr[data-app-id]").forEach((row) => {
    const appId = Number(row.dataset.appId);

    row.querySelectorAll(".seg-btn").forEach((button) => {
      button.addEventListener("click", async () => {
        const updated = await safeApi(`/api/volunteers/${appId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: button.dataset.status }),
        });
        if (updated) {
          toast(updated.status === "approved"
            ? "Заявка одобрена – пользователь получает бейдж волонтёра"
            : `Статус заявки: ${VOLUNTEER_STATUSES[updated.status]}`);
          await LOADERS.volunteers();
        }
      });
    });

    row.querySelector('[data-action="delete-app"]').addEventListener("click", (event) => {
      armDelete(event.currentTarget, async () => {
        const result = await safeApi(`/api/volunteers/${appId}`, { method: "DELETE" });
        if (result) {
          toast(result.detail);
          await LOADERS.volunteers();
        }
      });
    });
  });
}

function renderHours() {
  const { entries, totals } = state.hours;
  const form = document.getElementById("hours-form");
  if (!form) return;
  const volunteerOptions = state.users
    .map((user) => ({ id: user.id, label: `${user.name} (id ${user.id})` }))
    .sort((a, b) => a.label.localeCompare(b.label));
  form.innerHTML = `
    <label>Волонтёр
      <select name="user_id" required>
        ${volunteerOptions.map((option) => `<option value="${option.id}">${esc(option.label)}</option>`).join("")}
      </select>
    </label>
    <label>Дата
      <input type="date" name="worked_on" required>
    </label>
    <label>Часов (1–24)
      <input type="number" name="hours" min="1" max="24" value="2" required style="width:90px">
    </label>
    <label>Занятие
      <input type="text" name="description" placeholder="например, выгул Рекса" maxlength="200">
    </label>
    <button type="submit" class="btn btn-primary">${icon("plus")} Записать часы</button>
  `;
  form.onsubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const payload = {
      user_id: Number(formData.get("user_id")),
      worked_on: formData.get("worked_on"),
      hours: Number(formData.get("hours")),
      description: formData.get("description") || null,
    };
    const created = await safeApi("/api/volunteers/hours", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (created) {
      toast(`Записано: ${created.user_name}, ${created.hours} ч (${fmtDate(created.worked_on)})`);
      await LOADERS.volunteers();
    }
  };

  document.getElementById("hours-table").innerHTML = entries.length === 0
    ? emptyState("clock", "Часы пока не отмечены")
    : `<table>
        <thead><tr><th>Дата</th><th>Волонтёр</th><th>Часов</th><th>Занятие</th><th></th></tr></thead>
        <tbody>
          ${entries.map((entry) => `<tr data-entry-id="${entry.id}">
            <td>${fmtDate(entry.worked_on)}</td>
            <td class="cell-title">${esc(entry.user_name)}</td>
            <td><span class="badge badge-green">${entry.hours} ч</span></td>
            <td class="cell-sub">${esc(entry.description || "–")}</td>
            <td><button class="btn btn-danger btn-sm" data-action="delete-hours" title="Удалить запись">${icon("trash")}</button></td>
          </tr>`).join("")}
        </tbody>
      </table>`;

  document.querySelectorAll("button[data-action='delete-hours']").forEach((button) => {
    button.addEventListener("click", (event) => {
      const entryId = Number(button.closest("tr").dataset.entryId);
      armDelete(event.currentTarget, async () => {
        const result = await safeApi(`/api/volunteers/hours/${entryId}`, { method: "DELETE" });
        if (result) {
          toast(result.detail);
          await LOADERS.volunteers();
        }
      });
    });
  });
}

/* ---------------- Галерея ---------------- */

LOADERS.gallery = async () => {
  const uploads = await safeApi("/api/admin/uploads");
  if (!uploads) return;
  state.uploads = uploads;
  renderGallery();
};

function renderGallery() {
  const container = document.getElementById("gallery-grid");
  if (!container) return;
  if (state.uploads.length === 0) {
    container.innerHTML = emptyState("image", "Папка uploads/ пуста – загрузите фото кнопкой «Загрузить фото»");
    return;
  }
  container.innerHTML = state.uploads.map((item) => `
    <figure class="gallery-item" data-filename="${esc(item.filename)}">
      <img src="${esc(item.url)}" alt="${esc(item.filename)}" loading="lazy">
      <figcaption class="gallery-meta">
        <span class="gallery-name" title="${esc(item.filename)}">${esc(item.filename)}</span>
        <span>${fmtSize(item.size)}</span>
        <button class="btn btn-danger btn-sm" data-action="delete-upload" title="Удалить файл">${icon("trash")}</button>
      </figcaption>
    </figure>
  `).join("");

  container.querySelectorAll("[data-action='delete-upload']").forEach((button) => {
    button.addEventListener("click", (event) => {
      const filename = button.closest(".gallery-item").dataset.filename;
      armDelete(event.currentTarget, async () => {
        const result = await safeApi(`/api/admin/uploads/${encodeURIComponent(filename)}`, { method: "DELETE" });
        if (result) {
          toast(result.detail);
          await LOADERS.gallery();
        }
      });
    });
  });
}

async function uploadGalleryPhoto(file) {
  const formData = new FormData();
  formData.append("file", file);
  const created = await safeApi("/api/admin/uploads", { method: "POST", body: formData });
  if (created) {
    toast(`Изображение ${created.filename} загружено`);
    await LOADERS.gallery();
  }
}

/* ---------------- Инициализация ---------------- */

async function init() {
  // Заполняем статичные иконки страницы из того же набора, что и таблицы
  document.querySelectorAll("[data-icon]").forEach((el) => {
    el.innerHTML = icon(el.dataset.icon);
  });

  document.getElementById("login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("admin-email-input").value.trim();
    const password = document.getElementById("admin-password-input").value;
    if (!email || !password) return;
    const ok = await tryLogin(email, password);
    const errorNode = document.getElementById("login-error");
    if (ok) {
      errorNode.classList.add("hidden");
      showApp();
      switchView("dashboard");
    } else {
      errorNode.classList.remove("hidden");
    }
  });

  document.getElementById("logout-btn").addEventListener("click", showLogin);

  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.view));
  });

  document.querySelectorAll("[data-reload]").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.reload));
  });

  const addPetBtn = document.getElementById("add-pet-btn");
  if (addPetBtn) addPetBtn.addEventListener("click", () => openPetModal(null));
  const petForm = document.getElementById("pet-form");
  if (petForm) {
    petForm.addEventListener("submit", onPetFormSubmit);
    petForm.elements.photo.addEventListener("change", (event) => {
      const preview = document.getElementById("pet-photo-preview");
      const file = event.target.files[0];
      if (file) {
        preview.src = URL.createObjectURL(file);
        preview.classList.remove("hidden");
      }
    });
  }
  const petCancelBtn = document.getElementById("pet-cancel-btn");
  if (petCancelBtn) {
    petCancelBtn.addEventListener("click", () => {
      document.getElementById("pet-modal").close();
    });
  }

  const uploadBtn = document.getElementById("upload-photo-btn");
  const galleryInput = document.getElementById("gallery-file-input");
  if (uploadBtn && galleryInput) {
    uploadBtn.addEventListener("click", () => galleryInput.click());
    galleryInput.addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (file) uploadGalleryPhoto(file);
      event.target.value = "";
    });
  }

  // Автовход, если ключ уже сохранён в этой вкладке
  if (state.token && (await fetch("/api/admin/stats", { headers: { Authorization: `Bearer ${state.token}` } })).status === 200) {
    showApp();
    switchView("dashboard");
  }
}

document.addEventListener("DOMContentLoaded", init);

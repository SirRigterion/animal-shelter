// src/App.jsx
// Корневой компонент приложения с конфигурацией маршрутизации React Router DOM

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";

import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import PetDetail from "./pages/PetDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Volunteer from "./pages/Volunteer";
import Privacy from "./pages/Privacy";
import ProfileLayout from "./pages/ProfileLayout";
import ProfileInfo from "./pages/ProfileInfo";
import ProfileFavorites from "./pages/ProfileFavorites";
import ProfileApplications from "./pages/ProfileApplications";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="app-layout">
        <Header />

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/catalog/:id" element={<PetDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/volunteer" element={<Volunteer />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfileLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<ProfileInfo />} />
              <Route path="favorites" element={<ProfileFavorites />} />
              <Route path="applications" element={<ProfileApplications />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}

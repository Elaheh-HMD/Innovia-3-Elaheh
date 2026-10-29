import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
import { isAdmin } from "./auth";
import SensorDashboardPage from "./pages/SensorDashboardPage";

function AdminRoute() {
    const token = localStorage.getItem("token");
    if (!token) return <Navigate to="/login" replace />;
    if (!isAdmin()) return <Navigate to="/" replace />;
    return <AdminPage />;
}
function SensorRoute() {
    const token = localStorage.getItem("token");

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return <SensorDashboardPage />;
}
export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/admin" element={<AdminRoute />} />
                <Route path="/sensors" element={<SensorRoute />} />
            </Routes>
        </BrowserRouter>
    );
}

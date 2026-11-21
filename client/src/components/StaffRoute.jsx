import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// Only logged-in staff (role "admin") can open these pages.
export default function StaffRoute({ children }) {
    const { user, loading } = useAuth();

    if(loading) return <div className="container loading-text">Loading...</div>;

    if(!user) return <Navigate to="/login" replace />;

    if(user.role !== "admin") return <Navigate to="/" replace />;

    return children;
}
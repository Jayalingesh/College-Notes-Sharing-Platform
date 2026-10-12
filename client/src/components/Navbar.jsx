import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <header className="navbar">
            <div className="navbar-inner">
                <Link to="/" className="brand">
                    Campus<span>Notes</span>
                </Link>

                <nav className="nav-links">
                    <NavLink to="/" end>
                        Browse
                    </NavLink>

                    {user && <NavLink to="/upload">Upload</NavLink>}

                    {user && <NavLink to="/dashboard">My notes</NavLink>}

                    {user ? (
                        <>
                            <Link to="/profile" className="nav-avatar" title={user.name}>
                                {user.name.charAt(0).toUpperCase()}
                            </Link>
                            <a onClick={handleLogout} role="button">
                                Log out
                            </a>
                        </>
                    ) : (
                        <>
                            <NavLink to="/login">Log in</NavLink>
                            <NavLink to="/register" className="btn btn-highlight btn-sm">
                                Sign up
                            </NavLink>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
}
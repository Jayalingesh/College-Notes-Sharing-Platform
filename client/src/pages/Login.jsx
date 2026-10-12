import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login(){
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) =>{
        e.preventDefault();
        setError("");
        setSubmitting(true);
        try{
            await login(form.email, form.password);
            navigate("/");
        } catch(err){
            setError(err.response?.data?.message || "Login failed");
        } finally{
            setSubmitting(false);
        }
    };

    return (
        <div className="auth-shell">
            <h1>Welcome back</h1>
            <div className="auth-card">
                {error && <div className="form-error">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="field">
                        <label>Email</label>
                        <input 
                            type="email" 
                            required
                            value={form.email}
                            onChange={(e) =>setForm({ ...form, email: e.target.value })}
                        />
                    </div>
                    <div className="field">
                        <label>Password</label>
                        <input 
                            type="password" 
                            required
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                        />
                    </div>
                    <button className="btn btn-primary" style={{ width: "100%" }} disabled={submitting}>{submitting ? "Logging in..." : "Log in"}</button>
                </form>
            </div>
            <div className="auth-switch">
                New here? <Link to="/register">Create an account</Link>
            </div>
        </div>
    );
}
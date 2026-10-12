import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { BRANCHES, SEMESTERS } from "../constants";


export default function Register(){
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        college: "",
        branch: "",
        semester: "",
    });
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const update = (key, value) => setForm({ ...form, [key]: value });

    const handleSubmit = async (e) =>{
        e.preventDefault();
        setError("");
        if(form.password.length<6){
            setError("Password must be at least 8 characters");
            return;
        }
        setSubmitting(true);
        try{
            await register(form);
            navigate("/");
        } catch(err){
            setError(err.response?.data?.message || "Registration failed");
        } finally{
            setSubmitting(false);
        }
    };

    return (
        <div className="auth-shell">
            <h1>Create your account</h1>
            <div className="auth-card">
                {error && <div className="form-error">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="field">
                        <label>Full name</label>
                        <input
                            type="text"
                            required
                            value={form.name}
                            onChange={(e) => update("name", e.target.value)}
                        />
                    </div>
                    <div className="field">
                        <label>Email</label>
                        <input
                            type="email"
                            required
                            value={form.email}
                            onChange={(e) => update("email", e.target.value)}
                        />
                    </div>
                    <div className="field">
                        <label>Password</label>
                        <input
                        type="password"
                        required
                        value={form.password}
                        onChange={(e) => update("password", e.target.value)}
                        />
                    </div>
                    <div className="field">
                        <label>College</label>
                        <input
                        value={form.college}
                        onChange={(e) => update("college", e.target.value)}
                        placeholder="Optional"
                        />
                    </div>
                    <div className="field-row">
                        <div className="field">
                            <label>Branch</label>
                            <select value={form.branch} onChange={(e) => update("branch", e.target.value)}>
                                <option value="">Select branch</option>
                                {BRANCHES.map((b) => (
                                <option key={b} value={b}>
                                    {b}
                                </option>
                                ))}
                            </select>
                        </div>
                        <div className="field">
                            <label>Semester</label>
                            <select 
                                value={form.semester} onChange={(e) => update("semester", e.target.value)}
                            >
                                <option value="">Select semester</option>
                                {SEMESTERS.map((s) => (
                                    <option key={s} value={s}>
                                        {s}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <button className="btn btn-primary" style={{ width: "100%" }} disabled={submitting}>
                        {submitting ? "Creating account..." : "Sign up"}
                    </button>
                </form>
            </div>
            <div className="auth-switch">
                Already have an account? <Link to="/login">Login</Link>
            </div>
        </div>
    );
}
import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/axios";
import { BRANCHES, SEMESTERS } from "../constants";


export default function Profile(){
    const { user, updateUser } = useAuth();
    const [form, setForm] = useState({
        name: user?.name || "",
        college: user?.college || "",
        branch: user?.branch || "",
        semester: user?.semester || "",
    });
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const update = (key, value) => setForm({ ...form, [key]: value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");
        setSubmitting(true);
        try{
            const res = await api.put("/auth/me", form);
            updateUser(res.data.user);
            setMessage("Profile updated");
        } catch(err) {
            setError(err.response?.data?.message || "Could not update profile");
        } finally{
            setSubmitting(false);
        }
    };

    return (
        <div className="page">
            <div className="container" style={{ maxWidth: 500 }}>
                <div className="page-header">
                    <div className="eyebrow">Account</div>
                    <h1>Your profile</h1>
                </div>

                {message && (
                    <div style={{ background: "#e9f3ec", border: "1px solid #2f7a4d", color: "#2f7a4d", padding: "10px 14px", borderRadius: 3, marginBottom: 16, fontSize: 14 }}>
                        {message}
                    </div>
                )}

                {error && <div className="form-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="field">
                        <label>Email</label>
                        <input value={user?.email || ""} disabled />
                    </div>
                    <div className="field">
                        <label>Full name</label>
                        <input value={form.name} onChange={(e) => update("name", e.target.value)} />
                    </div>
                    <div className="field">
                        <label>College</label>
                        <input value={form.college} onChange={(e) => update("college", e.target.value)} />
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
                            <select value={form.semester} onChange={(e) => update("semester", e.target.value)}>
                                <option value="">Select semester</option>
                                {SEMESTERS.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button className="btn btn-primary" disabled={submitting}>
                        {submitting ? "Saving..." : "Save changes"}
                    </button>
                </form>
            </div>
        </div>
    );
}
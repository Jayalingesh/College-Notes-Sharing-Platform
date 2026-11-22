import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { BRANCHES, SEMESTERS } from "../constants";

export default function NewRequest(){
    const navigate = useNavigate();
    const [form, setForm] = useState({
        title: "",
        description: "",
        subject: "",
        branch: "",
        semester: "",
    });
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const update = (key, value) => setForm({ ...form, [key]: value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);
        try{
            const res = await api.post("/requests", form);
            navigate(`/requests/${res.data.request._id}`);
        } catch(err){
            setError(err.response?.data?.message || "Could not post request");
        } finally{
            setSubmitting(false);
        }
    };

    return (
        <div className="page">
            <div className="container" style={{ maxWidth: 620 }}>
                <div className="page-header">
                    <div className="eyebrow">Ask the community</div>
                    <h1>Request notes</h1>
                </div>

                {error && <div className="form-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="field">
                        <label>What do you need?</label>
                        <input
                            required
                            maxLength={150}
                            value={form.title}
                            onChange={(e) => update("title", e.target.value)}
                            placeholder="e.g. Unit 4 — Thermodynamics handwritten notes"
                        />
                    </div>
                    <div className="field">
                        <label>Details (optional)</label>
                        <textarea
                            rows={3}
                            maxLength={1000}
                            value={form.description}
                            onChange={(e) => update("description", e.target.value)}
                            placeholder="Syllabus topics, exam date, preferred format..."
                        />
                    </div>
                    <div className="field">
                        <label>Subject</label>
                        <input
                            required
                            value={form.subject}
                            onChange={(e) => update("subject", e.target.value)}
                            placeholder="e.g. Thermodynamics"
                        />
                    </div>
                    <div className="field-row">
                        <div className="field">
                            <label>Branch</label>
                            <select
                                required
                                value={form.branch}
                                onChange={(e) => update("branch", e.target.value)}
                            >
                                <option value="">Select branch</option>
                                {BRANCHES.map((b) => (
                                    <option key={b} value={b}>{b}</option>
                                ))}
                            </select>
                        </div>
                        <div className="field">
                            <label>Semester</label>
                            <select
                                required
                                value={form.semester}
                                onChange={(e) => update("semester", e.target.value)}
                            >
                                <option value="">Select semester</option>
                                {SEMESTERS.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <button className="btn btn-primary" disabled={submitting}>
                        {submitting ? "Posting..." : "Post request"}
                    </button>
                </form>
            </div>
        </div>
    );
}

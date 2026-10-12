import { useState } from "react";
import { useNavigate, useNavigation } from "react-router-dom";
import api from "../api/axios";
import { BRANCHES, SEMESTERS } from "../constants";

export default function UploadNote(){
    const navigate = useNavigate();
    const [form, setForm] = useState({
        title: "",
        description: "",
        subject: "",
        branch: "",
        semester: "",
        tags: "",
    });
    const [file, setFile] = useState(null);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const update = (key, value) => setForm({ ...form, [key]: value });

    const handleSubmit = async (e) =>{
        e.preventDefault();
        setError("");

        if(!file){
            setError("Please attach a file");
            return;
        }

        const data = new FormData();
        Object.entries(form).forEach(([key, value]) => data.append(key, value));
        data.append("file", file);

        setSubmitting(true);
        try{
            const res = await api.post("/notes", data, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            navigate(`/notes/${res.data.note._id}`);
        } catch(err){
            setError(err.response?.data?.message || "Upload failed");
        } finally{
            setSubmitting(false);
        }
    };

    return (
        <div className="page">
            <div className="container" style={{ maxWidth: 620 }}>
                <div className="page-header">
                    <div className="eyebrow">Share what you've got</div>
                    <h1>Upload a note</h1>
                </div>

                {error && <div className="form-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="field">
                        <label>Title</label>
                        <input
                        required
                        value={form.title}
                        onChange={(e) => update("title", e.target.value)}
                        placeholder="e.g. Unit 3 — Thermodynamics complete notes"
                        />
                    </div>
                    <div className="field">
                        <label>Description</label>
                        <textarea
                        rows={3}
                        value={form.description}
                        onChange={(e) => update("description", e.target.value)}
                        placeholder="What's covered in these notes?"
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
                                <option key={b} value={b}>
                                    {b}
                                </option>
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
                                <option key={s} value={s}>
                                    {s}
                                </option>
                                ))}
                            </select>
                        </div> 
                    </div>
                    <div className="field">
                        <label>Tags (comma-separated)</label>
                        <input
                        value={form.tags}
                        onChange={(e) => update("tags", e.target.value)}
                        placeholder="e.g. midterm, formulas, diagrams"
                        />
                    </div>
                    <div className="field">
                        <label>File (PDF, DOC, PPT, or image — max 25MB)</label>
                        <input
                        type="file"
                        required
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.txt"
                        onChange={(e) => setFile(e.target.files[0])}
                        />
                    </div>
                    <button className="btn btn-primary" disabled={submitting}>
                        {submitting ? "Uploading..." : "Upload note"}
                    </button>
                </form>
            </div>
        </div>
    );
}
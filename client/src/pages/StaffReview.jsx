import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import VerifiedBadge from "../components/VerifiedBadge.jsx";

export default function StaffReview(){
    const [status, setStatus] = useState("pending");
    const [notes, setNotes] = useState([]);
    const [counts, setCounts] = useState({ pending: 0, verified: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchNotes();
    }, [status]);

    const fetchNotes = async () => {
        setLoading(true);
        setError("");
        try{
            const res = await api.get("/notes/review/all", { params: { status } });
            setNotes(res.data.notes || []);
            setCounts({ pending: res.data.pendingCount, verified: res.data.verifiedCount });
        } catch(err){
            setError(err.response?.data?.message || "Could not load notes for review");
        } finally{
            setLoading(false);
        }
    };

    const handleVerify = async (note) => {
        let remark = "";
        if(!note.isVerified) {
            const input = window.prompt("Add a short remark for students (optional):", "");
            if(input === null) return;
            remark = input;
        }
        try{
            await api.put(`/notes/${note._id}/verify`, { remark });
            fetchNotes();
        } catch(err){
            alert(err.response?.data?.message || "Could not update verification");
        }
    };

    return (
        <div className="page">
            <div className="container">
                <div className="page-header">
                    <div className="eyebrow">Staff area</div>
                    <h1>Review notes</h1>
                    <p style={{ color: "var(--ink-soft)", fontSize: 14.5 }}>
                        Open a note to check its content, then mark it as staff verified.
                    </p>
                </div>

                <div className="staff-tabs">
                    <button
                        className={`staff-tab ${status === "pending" ? "active" : ""}`}
                        onClick={() => setStatus("pending")}
                    >
                        Pending ({counts.pending})
                    </button>
                    <button
                        className={`staff-tab ${status === "verified" ? "active" : ""}`}
                        onClick={() => setStatus("verified")}
                    >
                        Verified ({counts.verified})
                    </button>
                    <button
                        className={`staff-tab ${status === "all" ? "active" : ""}`}
                        onClick={() => setStatus("all")}
                    >
                        All
                    </button>
                </div>

                {error && <div className="form-error">{error}</div>}

                {loading ? (
                    <div className="loading-text">Loading...</div>
                ) : notes.length === 0 ? (
                    <div className="empty-state">
                        <h3>{status === "pending" ? "Nothing waiting for review" : "No notes here yet"}</h3>
                        <p>{status === "pending" ? "All uploaded notes have been verified." : "Notes will appear here."}</p>
                    </div>
                ) : (
                    <div>
                        {notes.map((note) => (
                            <div className="dash-row" key={note._id}>
                                <div className="dash-row-main">
                                    <div className="note-title" style={{ fontSize: 16 }}>
                                        <Link to={`/notes/${note._id}`}>{note.title}</Link>
                                        {note.isVerified && <VerifiedBadge />}
                                    </div>
                                    <div className="note-meta">
                                        {note.subject} <span className="sep">·</span> {note.branch}{" "}
                                        <span className="sep">·</span> Sem {note.semester}{" "}
                                        <span className="sep">·</span> by {note.uploadedBy?.name || "Unknown"}
                                    </div>
                                    {note.isVerified && note.verifiedBy?.name && (
                                        <div className="note-meta">Verified by {note.verifiedBy.name}</div>
                                    )}
                                </div>

                                <div className="dash-row-actions">
                                    <Link to={`/notes/${note._id}`} className="btn btn-sm btn-ghost">
                                        Open
                                    </Link>
                                    <button
                                        className={`btn btn-sm ${note.isVerified ? "btn-ghost" : "btn-highlight"}`}
                                        onClick={() => handleVerify(note)}
                                    >
                                        {note.isVerified ? "Remove" : "✔ Verify"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

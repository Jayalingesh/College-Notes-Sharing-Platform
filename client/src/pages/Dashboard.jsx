import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

export default function Dashboard(){
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchMine();
    }, []);

    const fetchMine = async () => {
        setLoading(true);
        try{
            const res = await api.get("/notes/mine/all");
            setNotes(res.data.notes);
        } catch(err){
            setError(err.response?.data?.message || "Could not load your notes");
        } finally{
            setLoading(false);
        }
    };

    const handleDelete = async (id) =>{
        if(!window.confirm("Delete this note permanently?")) return;
        await api.delete(`/notes/${id}`);
        setNotes((prev) => prev.filter((n) => n._id !== id));
    };

    const totalDownloads = notes.reduce((sum, n) => sum+(n.downloads || 0), 0);

    return (
        <div className="page">
            <div className="container">
                <div className="page-header">
                    <div className="eyebrow">Your contributions</div>
                    <h1>My notes</h1>

                    {notes.length > 0 && (
                        <p style={{ color: "var(--ink-soft)", fontSize: 14.5 }}>
                            {notes.length} note{notes.length !== 1 ? "s" : ""} uploaded · {totalDownloads} total downloads
                        </p>
                    )}
                </div>

                {error && <div className="form-error">{error}</div>}

                {loading ? (
                    <div className="loading-text">Loading...</div>
                ) : notes.length === 0 ? (
                    <div className="empty-state">
                        <h3>You haven't uploaded anything yet</h3>
                        <p>Share your notes and help other students out.</p>
                        <Link to="/upload" className="btn btn-primary" style={{ marginTop: 12 }}>
                            Upload your first note
                        </Link>
                    </div>
                ) : (
                    <div>
                        {notes.map((note) =>(
                            <div className="dash-row" key={note._id}>
                                <div className="dash-row-main">
                                    <div className="note-title" style={{ fontSize: 16 }}>
                                        <Link to={`/notes/${note._id}`}>{note.title}</Link>
                                    </div>
                                    <div className="note-meta">
                                        {note.subject} <span className="sep">·</span> {note.downloads || 0} downloads{"  "}
                                        <span className="sep">·</span> {note.likes?.length || 0} likes
                                    </div>
                                </div>

                                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(note._id)}>
                                    Delete
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
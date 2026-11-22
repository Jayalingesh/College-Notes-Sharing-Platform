import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext.jsx";
import VerifiedBadge from "../components/VerifiedBadge.jsx";
import timeAgo from "../utils/timeAgo";

export default function RequestDetail(){
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [request, setRequest] = useState(null);
    const [myNotes, setMyNotes] = useState([]);
    const [selectedNote, setSelectedNote] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionError, setActionError] = useState("");
    const [busy, setBusy] = useState(false);

    // /auth/login returns `id`, /auth/me returns `_id`
    const myId = user ? String(user.id || user._id) : null;

    useEffect(() => {
        fetchRequest();
    }, [id]);

    useEffect(() => {
        if(!user) return;
        api.get("/notes/mine/all")
            .then((res) => setMyNotes(res.data.notes || []))
            .catch(() => {});
    }, [user]);

    const fetchRequest = async () => {
        setLoading(true);
        try{
            const res = await api.get(`/requests/${id}`);
            setRequest(res.data.request);
        } catch(err){
            setError(err.response?.data?.message || "Request not found");
        } finally{
            setLoading(false);
        }
    };

    const run = async (fn) => {
        setActionError("");
        setBusy(true);
        try{
            await fn();
        } catch(err){
            setActionError(err.response?.data?.message || "Something went wrong");
        } finally{
            setBusy(false);
        }
    };

    const requireLogin = () => {
        if(!user) {
            navigate("/login");
            return true;
        }
        return false;
    };

    const handleSupport = () =>
        run(async () => {
            if(requireLogin()) return;
            const res = await api.put(`/requests/${id}/support`);
            setRequest((r) => ({
                ...r,
                supportCount: res.data.supportCount,
                supporters: res.data.supported
                    ? [...(r.supporters || []), myId]
                    : (r.supporters || []).filter((s) => String(s) !== myId),
            }));
        });

    const handleResolve = () =>
        run(async () => {
            const res = await api.put(`/requests/${id}/resolve`);
            setRequest((r) => ({ ...r, status: res.data.status }));
        });

    const handleDelete = () =>
        run(async () => {
            if(!window.confirm("Delete this request permanently?")) return;
            await api.delete(`/requests/${id}`);
            navigate("/requests");
        });

    const handleOffer = (e) => {
        e.preventDefault();
        if(!selectedNote) return;
        run(async () => {
            const res = await api.post(`/requests/${id}/fulfil`, { noteId: selectedNote });
            setRequest(res.data.request);
            setSelectedNote("");
        });
    };

    const handleRemoveOffer = (fid) =>
        run(async () => {
            const res = await api.delete(`/requests/${id}/fulfil/${fid}`);
            setRequest(res.data.request);
        });

    if(loading) return <div className="container loading-text">Loading request...</div>;
    if(error) return <div className="container form-error" style={{ marginTop: 40 }}>{error}</div>;
    if(!request) return null;

    const isOwner = myId && String(request.requestedBy?._id) === myId;
    const isStaff = user?.role === "admin";
    const solved = request.status === "fulfilled";
    const supported = myId && (request.supporters || []).some((s) => String(s) === myId);
    const offeredIds = (request.fulfillments || []).map((f) => String(f.note?._id));
    const offerable = myNotes.filter((n) => !offeredIds.includes(String(n._id)));

    return (
        <div className="page">
            <div className="container" style={{ maxWidth: 700 }}>
                <div className="note-detail-head">
                    <div className="eyebrow">
                        {request.subject} · {request.branch} · Semester {request.semester}
                    </div>
                    <h1>
                        {request.title}
                        <span className={`req-badge ${solved ? "solved" : ""}`}>
                            {solved ? "✔ Solved" : "Open"}
                        </span>
                    </h1>
                    {request.description && <p style={{ color: "var(--ink-soft)" }}>{request.description}</p>}
                    <div style={{ fontSize: 13.5, color: "var(--ink-soft)" }}>
                        Requested by {request.requestedBy?.name || "Unknown"}
                        {request.requestedBy?.college ? ` · ${request.requestedBy.college}` : ""}
                        {" · "}{timeAgo(request.createdAt)}
                    </div>

                    <div className="note-detail-actions">
                        {!isOwner && (
                            <button className="btn btn-sm" onClick={handleSupport} disabled={busy}>
                                {supported ? "✓ You need this too" : "I need this too"} ({request.supportCount || 0})
                            </button>
                        )}
                        {isOwner && (
                            <span style={{ fontSize: 13.5, color: "var(--ink-soft)", alignSelf: "center" }}>
                                {request.supportCount || 0} other student{request.supportCount === 1 ? "" : "s"} need this too
                            </span>
                        )}
                        {(isOwner || isStaff) && (
                            <button className="btn btn-sm btn-ghost" onClick={handleResolve} disabled={busy}>
                                {solved ? "Reopen request" : "Mark as solved"}
                            </button>
                        )}
                        {(isOwner || isStaff) && (
                            <button className="btn btn-sm btn-danger" onClick={handleDelete} disabled={busy}>
                                Delete
                            </button>
                        )}
                    </div>
                </div>

                {actionError && <div className="form-error">{actionError}</div>}

                <h3 style={{ fontSize: 18, marginBottom: 14 }}>
                    Notes offered {request.fulfillments?.length > 0 && `(${request.fulfillments.length})`}
                </h3>

                {request.fulfillments?.length === 0 ? (
                    <p style={{ fontSize: 14, color: "var(--ink-soft)" }}>
                        No notes offered yet.
                    </p>
                ) : (
                    <div style={{ marginBottom: 8 }}>
                        {request.fulfillments.map((f) => {
                            const canRemove = myId && (String(f.user?._id) === myId || isOwner || isStaff);
                            return (
                                <div className="dash-row" key={f._id}>
                                    <div className="dash-row-main">
                                        <div className="note-title" style={{ fontSize: 16 }}>
                                            {f.note ? (
                                                <Link to={`/notes/${f.note._id}`}>{f.note.title}</Link>
                                            ) : (
                                                "Note removed"
                                            )}
                                            {f.note?.isVerified && <VerifiedBadge />}
                                        </div>
                                        <div className="note-meta">
                                            offered by {f.user?.name || "Unknown"}
                                            <span className="sep">·</span>
                                            {timeAgo(f.createdAt)}
                                        </div>
                                    </div>
                                    {canRemove && (
                                        <button
                                            className="btn btn-sm btn-ghost"
                                            onClick={() => handleRemoveOffer(f._id)}
                                            disabled={busy}
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {!isOwner && !solved && (
                    <div className="offer-box">
                        <h3 style={{ fontSize: 16, marginBottom: 8 }}>Have these notes?</h3>
                        {!user ? (
                            <p style={{ fontSize: 14, color: "var(--ink-soft)", margin: 0 }}>
                                <Link to="/login" style={{ textDecoration: "underline" }}>Log in</Link> to offer one of your notes.
                            </p>
                        ) : offerable.length === 0 ? (
                            <p style={{ fontSize: 14, color: "var(--ink-soft)", margin: 0 }}>
                                {myNotes.length === 0 ? "Upload a note first, then offer it here. " : "All your notes are already offered. "}
                                <Link to="/upload" style={{ textDecoration: "underline" }}>Upload a note</Link>
                            </p>
                        ) : (
                            <form onSubmit={handleOffer} className="offer-form">
                                <select value={selectedNote} onChange={(e) => setSelectedNote(e.target.value)}>
                                    <option value="">Choose one of your notes</option>
                                    {offerable.map((n) => (
                                        <option key={n._id} value={n._id}>
                                            {n.title} ({n.subject})
                                        </option>
                                    ))}
                                </select>
                                <button className="btn btn-sm btn-primary" disabled={busy || !selectedNote}>
                                    Offer this note
                                </button>
                            </form>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

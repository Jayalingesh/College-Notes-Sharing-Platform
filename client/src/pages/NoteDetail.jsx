import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext.jsx";
import CommentSection from "../components/CommentSection.jsx";
import VerifiedBadge from "../components/VerifiedBadge.jsx";

function formatSize(bytes){
    if(!bytes) return "";
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

export default function NoteDetails(){
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [note, setNote] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);

    useEffect(() => {
        fetchNote();
    }, [id]);

    const fetchNote = async () => {
        setLoading(true);
        try{
            const res = await api.get((`/notes/${id}`));
            setNote(res.data.note || []);
            setComments(res.data.comments);
            setLikesCount(res.data.note.likes?.length || 0);
            setLiked(user ? res.data.note.likes?.includes(user.id) : false); 
        } catch(err) {
            setError(err.response?.data?.message || "Note not found");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        window.open(`/api/notes/${id}/download`, "_blank");
        setNote((n) => ({ ...n, downloads: (n.downloads || 0) + 1 }));
    };

    const handleLike = async () => {
        if(!user) {
            navigate("/login");
            return;
        }
        const res = await api.put(`/notes/${id}/like`);
        setLiked(res.data.liked);
        setLikesCount(res.data.likesCount);
    };

    const handleVerify = async () => {
        let remark = "";
        if(!note.isVerified) {
            const input = window.prompt("Add a short remark for students (optional):", "");
            if(input === null) return;
            remark = input;
        }
        try {
            const res = await api.put(`/notes/${id}/verify`, { remark });
            setNote((n) => ({
                ...n,
                isVerified: res.data.isVerified,
                verifiedBy: res.data.verifiedBy,
                verifiedAt: res.data.verifiedAt,
                verificationRemark: res.data.verificationRemark,
            }));
        } catch(err) {
            alert(err.response?.data?.message || "Could not update verification");
        }
    };

    const handleDelete = async () => {
        if(!window.confirm("Delete this note permanently?")) return;

        await api.delete(`/notes/${id}`);
        navigate("/dashboard");
    };

    if(loading){
        return <div className="container loading-text">Loading note...</div>;
    } 
    if(error) {
        return <div className="container form-error" style={{ marginTop: 40 }}>{error}</div>;
    }
    if(!note) return null;

    const isOwner = user && note.uploadedBy?._id === user.id;
    const isStaff = user?.role === "admin";

    return (
        <div className="page">
            <div className="container" style={{ maxWidth:  700 }}>
                <div className="note-detail-head">
                    <div className="eyebrow">
                        {note.subject} · {note.branch} · Semester {note.semester}
                    </div>
                    <h1>{note.title}</h1>
                    {note.isVerified && (
                        <div className="verified-box">
                            <VerifiedBadge />
                            <span>
                                Checked by {note.verifiedBy?.name || "staff"}
                                {note.verifiedAt ? ` on ${new Date(note.verifiedAt).toLocaleDateString()}` : ""}
                            </span>
                            {note.verificationRemark && (
                                <div className="verified-remark">“{note.verificationRemark}”</div>
                            )}
                        </div>
                    )}
                    {note.description && <p style={{ color: "var(--ink-soft)" }}>{note.description}</p>}
                    <div style={{ fontSize: 13.5, color: "var(--ink-soft)" }}>
                        Uploaded by {note.uploadedBy?.name || "Unknown"}
                        {note.uploadedBy?.college ? ` · ${note.uploadedBy.college}` : ""}
                    </div>

                    {note.tags?.length > 0 && (
                        <div className="tag-row">
                            {note.tags.map((tag) => (
                                <span className="tag" key={tag}>
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="file-panel">
                        <div>
                            <div className="file-panel-name">
                                {note.fileName}
                            </div>
                            <div className="file-panel-meta">
                                {formatSize(note.fileSize)} · {note.downloads || 0} downloads
                            </div>
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={handleDownload}>
                            Download
                        </button>
                    </div>
                    <div className="note-detail-actions">
                        <button className="btn btn-sm" onClick={handleLike}>
                            {liked ? "♥ Liked" : "♡ Like"} ({likesCount})
                        </button>
                        {isStaff && (
                            <button
                                className={`btn btn-sm ${note.isVerified ? "btn-ghost" : "btn-highlight"}`}
                                onClick={handleVerify}
                            >
                                {note.isVerified ? "Remove verification" : "✔ Verify this note"}
                            </button>
                        )}
                        {isOwner && (
                            <>
                                <button className="btn btn-sm btn-ghost" onClick={() => navigate("/dashboard")}>
                                    Manage
                                </button>
                                <button className="btn btn-sm btn-danger" onClick={handleDelete}>
                                    Delete
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <CommentSection
                    noteId={id}
                    comments={comments}
                    onCommentAdded={(c) => setComments((prev) => [c, ...prev])} 
                />
            </div>
        </div>
    );
}
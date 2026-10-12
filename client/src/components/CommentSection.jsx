import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import api  from "../api/axios";

function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);

    if(mins < 1) return "just now";

    if(mins < 60) return `${mins}m ago`;

    const hours = Math.floor(mins / 60);
    if(hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours /24);
    
    return `${days}d ago`;
}

export default function CommentSection({ noteId, comments, onCommentAdded }) {
    const { user } = useAuth();
    const [text, setText] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if(!text.trim()) return;

        setSubmitting(true);
        setError("");

        try{
            const res = await api.post(`/notes/${noteId}/comments`, { text });
            onCommentAdded(res.data.comment);
            setText("");
        } catch(err) {
            setError(err.response?.data?.message || "Could not post comment");
        } finally{
            setSubmitting(false);
        }
    };

    return (
        <div>
            <h3 style={{ fontSize: 18, marginBottom: 14 }}>
                Discussion {comments.length > 0 && `(${comments.length})`}
            </h3>

            {user ? (
                <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
                    {error && <div className="form-error">{error}</div>}
                    <div className="field">
                        <textarea 
                            rows={2}
                            placeholder="Ask a question or say thanks..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-sm btn-primary" disabled={submitting}>
                        {submitting ? "Posting..." : "Post comment"}
                    </button>
                </form>
            ) : (
                <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 20 }}>
                    Log in to join the discussion.
                </p>
            )}

            {comments.length === 0 ? (
                <p style={{ fontSize: 14, color: "var(--ink-soft)" }}>
                    No comments yet — be the first.
                </p>
            ) : (
                <div>
                    {comments.map((c) => (
                        <div className="comment" key={c._id}>
                            <div className="comment-avatar">
                                {c.user?.avatarInitial || c.user?.name?.charAt(0) || "?"}
                            </div>
                            <div className="comment-body">
                                <span className="comment-name">
                                    {c.user?.name || "Deleted user"}
                                </span>
                                <span className="comment-time">
                                    {timeAgo(c.createdAt)}
                                </span>
                                <div className="comment-text">{c.text}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
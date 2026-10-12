import { Link } from "react-router-dom";

export default function NoteRow({ note }){
    return (
        <div className="note-row">
            <div className="note-row-main">
                <div className="note-title">
                    <Link to={`/notes/${note._id}`}>{note.title}</Link>
                </div>
                <div className="note-meta">
                    {note.subject}
                    <span className="sep">·</span>
                    {note.branch}
                    <span className="sep">·</span>
                    Sem {note.semester}
                    <span className="sep">·</span>
                    by {note.uploadedBy?.name || "Unknown"}
                </div>
                {note.description && <div className="note-desc">
                    {note.description}
                </div>}

                {note.tags?.length > 0 && (
                    <div className="tag-row">
                        {note.tags.map((tag) => (
                            <span className="tag" key={tag}>
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className="note-row-stats">
                <span className="stat-highlight">{note.downloads || 0} downloads</span>
                <span>{note.likes?.length || 0} likes</span>
            </div>
        </div>
    );
}
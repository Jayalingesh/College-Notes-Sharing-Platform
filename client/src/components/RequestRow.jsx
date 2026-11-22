import { Link } from "react-router-dom";
import timeAgo from "../utils/timeAgo";

export default function RequestRow({ request }) {
    const solved = request.status === "fulfilled";

    return (
        <div className="note-row">
            <div className="note-row-main">
                <div className="note-title">
                    <Link to={`/requests/${request._id}`}>{request.title}</Link>
                    <span className={`req-badge ${solved ? "solved" : ""}`}>
                        {solved ? "✔ Solved" : "Open"}
                    </span>
                </div>
                <div className="note-meta">
                    {request.subject}
                    <span className="sep">·</span>
                    {request.branch}
                    <span className="sep">·</span>
                    Sem {request.semester}
                    <span className="sep">·</span>
                    by {request.requestedBy?.name || "Unknown"}
                    <span className="sep">·</span>
                    {timeAgo(request.createdAt)}
                </div>
                {request.description && <div className="note-desc">{request.description}</div>}
            </div>

            <div className="note-row-stats">
                <span className="stat-highlight">{request.supportCount || 0} need this</span>
                <span>{request.fulfillments?.length || 0} offered</span>
            </div>
        </div>
    );
}

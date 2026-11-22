import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import RequestRow from "../components/RequestRow.jsx";
import { BRANCHES, SEMESTERS } from "../constants";
import { useAuth } from "../context/AuthContext.jsx";

export default function Requests(){
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalResults, setTotalResults] = useState(0);
    const [filters, setFilters] = useState({
        search: "",
        branch: "",
        semester: "",
        sort: "newest",
        status: "open",
    });

    const update = (key, value) => setFilters({ ...filters, [key]: value });

    useEffect(() => {
        const timeout = setTimeout(() => {
            setPage(1);
            fetchRequests(1);
        }, 350);
        return () => clearTimeout(timeout);
    }, [filters]);

    useEffect(() => {
        fetchRequests(page);
    }, [page]);

    const fetchRequests = async (pageNum) => {
        setLoading(true);
        setError("");
        try{
            const params = { ...filters, page: pageNum, limit: 10 };
            Object.keys(params).forEach((k) => !params[k] && delete params[k]);
            if(params.status === "all") delete params.status;
            if(params.status === "solved") params.status = "fulfilled";

            const res = await api.get("/requests", { params });
            setRequests(res.data.requests || []);
            setTotalPages(res.data.totalPages || 1);
            setTotalResults(res.data.totalResults || 0);
        } catch(err){
            setError(err.response?.data?.message || "Could not load requests");
        } finally{
            setLoading(false);
        }
    };

    return (
        <div className="page">
            <div className="container">
                <div className="page-header">
                    <div className="eyebrow">Can't find what you need?</div>
                    <h1>Notes request board</h1>
                    <p style={{ color: "var(--ink-soft)", fontSize: 14.5 }}>
                        Ask for notes you're missing. Students who have them can offer their uploads.
                    </p>
                    <Link to={user ? "/requests/new" : "/login"} className="btn btn-primary btn-sm">
                        + Request notes
                    </Link>
                </div>

                <div className="staff-tabs">
                    {[
                        ["open", "Open"],
                        ["solved", "Solved"],
                        ["all", "All"],
                    ].map(([value, label]) => (
                        <button
                            key={value}
                            className={`staff-tab ${filters.status === value ? "active" : ""}`}
                            onClick={() => update("status", value)}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <div className="filters">
                    <input
                        type="text"
                        placeholder="Search requests..."
                        value={filters.search}
                        onChange={(e) => update("search", e.target.value)}
                    />
                    <select value={filters.branch} onChange={(e) => update("branch", e.target.value)}>
                        <option value="">All branches</option>
                        {BRANCHES.map((b) => (
                            <option key={b} value={b}>{b}</option>
                        ))}
                    </select>
                    <select value={filters.semester} onChange={(e) => update("semester", e.target.value)}>
                        <option value="">All semesters</option>
                        {SEMESTERS.map((s) => (
                            <option key={s} value={s}>Semester {s}</option>
                        ))}
                    </select>
                    <select value={filters.sort} onChange={(e) => update("sort", e.target.value)}>
                        <option value="newest">Newest first</option>
                        <option value="popular">Most needed</option>
                    </select>
                </div>

                {error && <div className="form-error">{error}</div>}

                {loading ? (
                    <div className="loading-text">Loading requests...</div>
                ) : requests.length === 0 ? (
                    <div className="empty-state">
                        <h3>No requests here</h3>
                        <p>Need something specific? Be the first to ask.</p>
                    </div>
                ) : (
                    <>
                        <div style={{ fontSize: 13.5, color: "var(--ink-soft)", margin: "6px 0 4px" }}>
                            {totalResults} request{totalResults !== 1 ? "s" : ""} found
                        </div>
                        <div className="note-list">
                            {requests.map((r) => (
                                <RequestRow key={r._id} request={r} />
                            ))}
                        </div>
                        {totalPages > 1 && (
                            <div className="pagination">
                                <button
                                    className="btn btn-sm btn-ghost"
                                    disabled={page <= 1}
                                    onClick={() => setPage((p) => p - 1)}
                                >
                                    Previous
                                </button>
                                <span style={{ alignSelf: "center", fontSize: 13.5, color: "var(--ink-soft)" }}>
                                    Page {page} of {totalPages}
                                </span>
                                <button
                                    className="btn btn-sm btn-ghost"
                                    disabled={page >= totalPages}
                                    onClick={() => setPage((p) => p + 1)}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

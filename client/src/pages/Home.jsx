import { useEffect, useState } from "react";
import api from "../api/axios";
import NoteRow from "../components/NoteRow.jsx";
import SearchFilter from "../components/SearchFilter.jsx";

export default function Home(){
    const [notes, setNotes] = useState([]);
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
    });

    useEffect(() => {
        const timeout = setTimeout(() =>{
            setPage(1);
            fetchNotes(1);
        }, 350);
        return () => clearTimeout(timeout);
    }, [filters]);

    useEffect(() =>{
        fetchNotes(page);
    }, [page]);

    const fetchNotes = async (pageNum) =>{
        setLoading(true);
        setError("");
        try{
            const params = { 
                ...filters, 
                page: pageNum, limit: 10
            };
            Object.keys(params).forEach((k) => !params[k] && delete params[k]);
            const res = await api.get("/notes", { params });

            const fetchNotes = res.data.notes || (Array.isArray(res.data) ? res.data : []);
            setNotes(fetchNotes);
            setTotalPages(res.data.totalPages || 1);
            setTotalResults(res.data.totalResults || fetchNotes.length);
        } catch(err){
            setError(err.response?.data?.message || "Could not load notes");
        } finally{
            setLoading(false);
        }
    };

    return (
        <div className="page">
            <div className="container">
                <div className="page-header">
                    <div className="eyebrow">
                        Shared by students, for students
                    </div>
                    <h1>Find notes for your next exam</h1>
                </div>
                <SearchFilter filters={filters} onChange={setFilters} />

                {error && <div className="form-error">{error}</div>}

                {loading ? (
                    <div className="loading-text">Loading notes...</div>
                ): notes?.length === 0 ? (
                    <div className="empty-state">
                        <h3>No notes match yet</h3>
                        <p>
                            Try a different subject, branch, or semester — or be the first to upload one.
                        </p>
                    </div>
                ): (
                    <>
                        <div style={{ fontSize: 13.5, color: "var(--ink-soft)", margin: "6px 0 4px" }}>
                            {totalResults} note{totalResults !== 1 ? "s" : ""} found
                        </div>
                        <div className="note-list">
                            {notes.map((note) => (
                                <NoteRow key={note._id} note={note} />
                            ))}
                        </div>
                        {totalPages >1 && (
                            <div className="pagination">
                                <button
                                    className="btn btn-sm btn-ghost"
                                    disabled={page<=1}
                                    onClick={() =>setPage((p) => p-1)}
                                >
                                    Previous
                                </button>
                                <span style={{ alignSelf: "center", fontSize: 13.5, color: "var(--ink-soft)" }}>
                                    Page {page} of {totalPages}
                                </span>
                                <button
                                 className="btn btn-sm btn-ghost"
                                 disabled={page >= totalPages}
                                 onClick={() => setPage((p) => p+1)}
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
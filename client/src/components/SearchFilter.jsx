import { BRANCHES, SEMESTERS } from "../constants";

export default function SearchFilter({ filters, onChange }) {
    const update = (key, value) => onChange({ ...filters, [key]: value });

    return (
        <div className="filters">
            <input 
                type="text" 
                placeholder="Search notes, subjects, tags..."
                value={filters.search}
                onChange={(e) => update("search", e.target.value)}
            />
            <select value={filters.branch} onChange={(e) => update("branch", e.target.value)}>
                <option value="">All branches</option>
                {BRANCHES.map((b) => (
                    <option key={b} value={b}>
                        {b}
                    </option>
                ))}
            </select>
            <select value={filters.semester} onChange={(e) => update("semester", e.target.value)}>
                <option value="">All semesters</option>
                {SEMESTERS.map((s) => (
                    <option key={s} value={s}>
                        Semester {s}
                    </option>
                ))}
            </select>
            <select value={filters.sort} onChange={(e) => update("sort", e.target.value)}>
                <option value="newest">Newest first</option>
                <option value="popular">Most downloaded</option>
                <option value="oldest">Oldest first</option>
            </select>
        </div>
    );
}
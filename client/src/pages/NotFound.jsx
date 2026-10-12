import { Link } from "react-router-dom";

export default function NotFound(){
    return (
        <div className="container empty-state" style={{ marginTop: 60 }}>
            <h1>Page not found</h1>
            <p>The page you're looking for doesn't exist.</p>
            <Link to="/" className="btn btn-primary" style={{ marginTop: 12 }}>
                Back to browse
            </Link>
        </div>
    );
}
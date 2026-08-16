import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="not-found-page">
      <h2>Page not found</h2>
      <p>The page you're looking for doesn't exist.</p>
      <Link to="/documents">Back to documents</Link>
    </div>
  );
}

export default NotFound;
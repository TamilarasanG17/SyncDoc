import { Link } from "react-router-dom";

function Sidebar() {
  return (
    <aside className="sidebar">
      <nav>
        <Link to="/">Home</Link>
        <Link to="/documents">Documents</Link>
      </nav>
    </aside>
  );
}

export default Sidebar;
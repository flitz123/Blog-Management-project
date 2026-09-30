import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const nav = useNavigate();

  const handleLogout = () => {
    logout();
    nav('/login');
  };

  return (
    <nav className="topbar">
      <Link to="/" className="brand"><span className="brand-mark">B</span>Fieldnotes</Link>
      <div className="nav-actions">
        {user ? (
          <>
            {['author', 'admin'].includes(user.role) && <Link to="/create" className="nav-link">Write</Link>}
            {['author', 'admin'].includes(user.role) && <Link to="/my-posts" className="nav-link">My writing</Link>}
            <Link to="/profile" className="nav-link">Profile</Link>
            {user.role === 'admin' && <Link to="/admin" className="nav-link">Admin</Link>}
            <span className="user-chip">{user.name}</span>
            <button onClick={handleLogout} className="button button-quiet">Log out</button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Sign in</Link>
            <Link to="/register" className="button button-dark">Join free</Link>
          </>
        )}
      </div>
    </nav>
  );
}

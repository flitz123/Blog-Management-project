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
    <nav className="bg-gray-800 text-white px-4 py-2 flex justify-between items-center">
      <Link to="/" className="text-lg font-bold">BlogSys</Link>
      <div className="space-x-4">
        {user ? (
          <>
            <span>Hello, {user.name}</span>
            <button onClick={handleLogout} className="bg-red-600 px-3 py-1 rounded">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

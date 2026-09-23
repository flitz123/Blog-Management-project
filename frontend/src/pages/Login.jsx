import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.msg || 'Invalid credentials');
    }
  };

  return (
    <div className="auth-layout"><div className="auth-intro"><p className="eyebrow">Welcome back</p><h1>Good ideas deserve a place to grow.</h1><p>Keep reading, keep writing, and pick up where you left off.</p></div>
      <form onSubmit={handleSubmit} className="form-card">
        <h2>Sign in</h2><p className="form-note">Use your Fieldnotes account.</p>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="field"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="field"
          required
        />
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="button button-primary">
          Sign in
        </button>
        <p className="form-footnote">
          Don’t have an account? <Link to="/register">Create one</Link>
        </p>
      </form>
    </div>
  );
}

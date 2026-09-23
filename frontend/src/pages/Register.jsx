import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/auth/register', { name, email, password });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.msg || 'Registration failed.');
    }
  };

  return (
    <div className="auth-layout"><div className="auth-intro"><p className="eyebrow">Make a mark</p><h1>Your next favorite read starts here.</h1><p>Join a thoughtful corner of the internet for curious writers and readers.</p></div>
      <form onSubmit={handleSubmit} className="form-card">
        <h2>Create your account</h2><p className="form-note">It takes less than a minute.</p>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={e => setName(e.target.value)}
          className="field"
          required
        />
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
          placeholder="Password (min 6 chars)"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="field"
          required
        />
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="button button-primary">
          Create account
        </button>
        <p className="form-footnote">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}


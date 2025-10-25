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
      alert('Registration successful! You can now login.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.msg || 'Registration failed.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Register</h2>
      <form onSubmit={handleSubmit} className="w-80 bg-white p-6 rounded-lg shadow-md">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full mb-3 p-2 border rounded"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full mb-3 p-2 border rounded"
          required
        />
        <input
          type="password"
          placeholder="Password (min 6 chars)"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full mb-3 p-2 border rounded"
          required
        />
        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
        <button type="submit" className="w-full bg-green-600 text-white py-2 rounded">
          Register
        </button>
        <p className="text-sm mt-2 text-center">
          Already have an account? <Link className="text-blue-500" to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}


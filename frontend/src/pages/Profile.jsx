import React, { useEffect, useState } from 'react';
import { useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';

export default function Profile() {
  const [profile, setProfile] = useState({ name: '', bio: '', avatar: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const { updateUser } = useContext(AuthContext);

  useEffect(() => {
    api.get('/auth/me').then(({ data }) => setProfile({
      name: data.user.name || '', bio: data.user.bio || '', avatar: data.user.avatar || ''
    })).catch((err) => setError(err.response?.data?.message || 'Profile could not be loaded.'));
  }, []);

  const saveProfile = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const { data } = await api.patch('/auth/me', profile);
      updateUser(data.user);
      setMessage('Profile saved.');
    } catch (err) {
      setMessage('');
      setError(err.response?.data?.message || 'Profile could not be saved.');
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      const { data } = await api.patch('/auth/password', { currentPassword, newPassword });
      setMessage(data.message);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Password could not be changed.');
    }
  };

  return <section className="editor-page">
    <p className="eyebrow">Account</p><h1>Your profile</h1>
    <form onSubmit={saveProfile} className="editor-form">
      <label>Display name<input className="field" maxLength={80} required value={profile.name} onChange={event => setProfile({ ...profile, name: event.target.value })} /></label>
      <label>Profile image URL<input className="field" type="url" value={profile.avatar} onChange={event => setProfile({ ...profile, avatar: event.target.value })} /></label>
      <label>Bio<textarea className="field" maxLength={500} value={profile.bio} onChange={event => setProfile({ ...profile, bio: event.target.value })} /></label>
      {message && <p className="status-message">{message}</p>}{error && <p className="form-error">{error}</p>}
      <button className="button button-primary" type="submit">Save profile</button>
    </form>
    <div className="rule" />
    <h2>Change password</h2>
    <form onSubmit={changePassword} className="editor-form">
      <label>Current password<input className="field" type="password" autoComplete="current-password" required value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} /></label>
      <label>New password<input className="field" type="password" autoComplete="new-password" minLength={8} required value={newPassword} onChange={event => setNewPassword(event.target.value)} /></label>
      <button className="button button-primary" type="submit">Change password</button>
    </form>
  </section>;
}
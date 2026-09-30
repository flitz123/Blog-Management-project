import React, { useContext, useEffect, useState } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';

export default function Admin() {
  const [overview, setOverview] = useState(null);
  const [comments, setComments] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryName, setCategoryName] = useState('');
  const [error, setError] = useState('');
  const { user: currentUser } = useContext(AuthContext);

  const load = async () => {
    try {
      const [summary, pending, allUsers, allCategories] = await Promise.all([
        api.get('/admin/overview'), api.get('/admin/comments'), api.get('/admin/users'), api.get('/admin/categories')
      ]);
      setOverview(summary.data);
      setComments(pending.data);
      setUsers(allUsers.data);
      setCategories(allCategories.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Admin data could not be loaded.');
    }
  };

  useEffect(() => { load(); }, []);

  const moderate = async (id, status) => {
    try {
      await api.patch(`/admin/comments/${id}`, { status });
      setComments(items => items.filter(item => item._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Comment moderation failed.');
    }
  };

  const changeRole = async (id, role) => {
    try {
      const { data } = await api.patch(`/admin/users/${id}`, { role });
      setUsers(items => items.map(item => item._id === id ? data : item));
    } catch (err) {
      setError(err.response?.data?.message || 'User role could not be changed.');
    }
  };

  const deleteUser = async (account) => {
    if (!window.confirm(`Delete the account for ${account.email}?`)) return;
    try {
      await api.delete(`/admin/users/${account._id}`);
      setUsers(items => items.filter(item => item._id !== account._id));
    } catch (err) {
      setError(err.response?.data?.message || 'User could not be deleted.');
    }
  };

  const createCategory = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/admin/categories', { name: categoryName });
      setCategories(items => [...items, data].sort((a, b) => a.name.localeCompare(b.name)));
      setCategoryName('');
    } catch (err) {
      setError(err.response?.data?.message || 'Category could not be created.');
    }
  };

  const deleteCategory = async (category) => {
    try {
      await api.delete(`/admin/categories/${category._id}`);
      setCategories(items => items.filter(item => item._id !== category._id));
    } catch (err) {
      setError(err.response?.data?.message || 'Category could not be deleted.');
    }
  };

  return <div className="editor-page">
    <p className="eyebrow">Administration</p><h1>Keep the journal healthy.</h1>
    {error && <p className="form-error">{error}</p>}
    {overview && <div className="post-grid">
      <div className="post-card"><h3>{overview.posts}</h3><p>Posts</p></div>
      <div className="post-card"><h3>{overview.users}</h3><p>Users</p></div>
      <div className="post-card"><h3>{overview.views}</h3><p>Views</p></div>
      <div className="post-card"><h3>{overview.comments}</h3><p>Comments</p></div>
    </div>}
    <div className="rule" />
    <h2>Comments awaiting review</h2>
    {comments.length === 0 ? <p className="status-message">Nothing needs your attention.</p> : comments.map(comment => <div className="comment-item" key={comment._id}>
      <p>{comment.text}</p><span>{comment.author?.name || 'Reader'} on {comment.post?.title}</span>
      <div><button className="button button-primary" onClick={() => moderate(comment._id, 'approved')}>Approve</button> <button className="button button-quiet" onClick={() => moderate(comment._id, 'removed')}>Remove</button></div>
    </div>)}
    <div className="rule" />
    <h2>People</h2>
    {users.map(account => <div className="comment-item" key={account._id}>
      <div><strong>{account.name}</strong><span>{account.email}</span></div>
      <div className="nav-actions">
        <select className="field" aria-label={`Role for ${account.email}`} value={account.role} onChange={event => changeRole(account._id, event.target.value)}>
          <option value="reader">Reader</option><option value="author">Author</option><option value="admin">Admin</option>
        </select>
        {account._id !== currentUser?.id && account._id !== currentUser?._id && <button className="button button-quiet" onClick={() => deleteUser(account)}>Delete</button>}
      </div>
    </div>)}
    <div className="rule" />
    <h2>Categories</h2>
    <form className="discovery-bar" onSubmit={createCategory}>
      <input className="field" value={categoryName} onChange={event => setCategoryName(event.target.value)} placeholder="Category name" required />
      <button className="button button-primary" type="submit">Add category</button>
    </form>
    {categories.map(category => <div className="comment-item" key={category._id}>
      <strong>{category.name}</strong><button className="button button-quiet" onClick={() => deleteCategory(category)}>Delete</button>
    </div>)}
  </div>;
}

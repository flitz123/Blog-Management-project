import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function MyPosts() {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');

  const loadPosts = async () => {
    try {
      const { data } = await api.get('/posts/mine');
      setPosts(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Your writing could not be loaded.');
    }
  };

  useEffect(() => { loadPosts(); }, []);

  const updateStatus = async (post, status) => {
    try {
      await api.patch(`/posts/${post._id}`, { status });
      await loadPosts();
    } catch (err) {
      setError(err.response?.data?.message || 'Post status could not be changed.');
    }
  };

  const removePost = async (post) => {
    if (!window.confirm(`Permanently delete "${post.title}"?`)) return;
    try {
      await api.delete(`/posts/${post._id}`);
      setPosts(items => items.filter(item => item._id !== post._id));
    } catch (err) {
      setError(err.response?.data?.message || 'Post could not be deleted.');
    }
  };

  return <section className="editor-page">
    <p className="eyebrow">Author workspace</p>
    <div className="section-heading"><h1>My writing</h1><Link to="/create" className="button button-primary">New post</Link></div>
    {error && <p className="form-error">{error}</p>}
    {!posts.length && !error && <p className="status-message">You have not written anything yet.</p>}
    {posts.map(post => <article className="comment-item" key={post._id}>
      <div><p><strong>{post.title}</strong></p><span>{post.status}{post.scheduledAt ? ` · ${new Date(post.scheduledAt).toLocaleString()}` : ''}</span></div>
      <div className="nav-actions">
        {post.status === 'published' && <Link to={`/posts/${post.slug || post._id}`} className="nav-link">View</Link>}
        <Link to={`/posts/${post._id}/edit`} className="button button-quiet">Edit</Link>
        {post.status !== 'archived' && <button className="button button-quiet" onClick={() => updateStatus(post, 'archived')}>Archive</button>}
        {post.status === 'archived' && <button className="button button-quiet" onClick={() => updateStatus(post, 'draft')}>Restore</button>}
        <button className="button button-quiet" onClick={() => removePost(post)}>Delete</button>
      </div>
    </article>)}
  </section>;
}
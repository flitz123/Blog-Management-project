import React, { useEffect, useState } from 'react';
import api from '../api/axios';

export default function Admin() {
  const [overview, setOverview] = useState(null);
  const [comments, setComments] = useState([]);
  const [error, setError] = useState('');
  const load = async () => {
    try {
      const [summary, pending] = await Promise.all([api.get('/admin/overview'), api.get('/admin/comments')]);
      setOverview(summary.data); setComments(pending.data);
    } catch (err) { setError(err.response?.data?.message || 'Admin data could not be loaded.'); }
  };
  useEffect(() => { load(); }, []);
  const moderate = async (id, status) => { await api.patch(`/admin/comments/${id}`, { status }); setComments(items => items.filter(item => item._id !== id)); };
  return <div className="editor-page"><p className="eyebrow">Administration</p><h1>Keep the journal healthy.</h1>{error && <p className="form-error">{error}</p>}{overview && <div className="post-grid"><div className="post-card"><h3>{overview.posts}</h3><p>Posts</p></div><div className="post-card"><h3>{overview.users}</h3><p>Users</p></div><div className="post-card"><h3>{overview.views}</h3><p>Views</p></div><div className="post-card"><h3>{overview.comments}</h3><p>Comments</p></div></div>}<div className="rule" /><h2>Comments awaiting review</h2>{comments.length === 0 ? <p className="status-message">Nothing needs your attention.</p> : comments.map(comment => <div className="comment-item" key={comment._id}><p>{comment.text}</p><span>{comment.author?.name || 'Reader'} on {comment.post?.title}</span><div><button className="button button-primary" onClick={() => moderate(comment._id, 'approved')}>Approve</button> <button className="button button-quiet" onClick={() => moderate(comment._id, 'removed')}>Remove</button></div></div>)}</div>;
}

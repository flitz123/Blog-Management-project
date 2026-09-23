import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';

export default function PostView() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [liked, setLiked] = useState(false);
  const { user } = useContext(AuthContext);

  const fetchPost = async () => {
    const res = await api.get(`/posts/${id}`);
    setPost(res.data);
  };

  const handleLike = async () => {
    if (!user) return setError('Sign in to react to an article.');
    const res = await api.post(`/posts/${id}/like`);
    setLiked(res.data.liked);
    setPost(current => ({ ...current, likes: Array(res.data.likes) }));
  };

  const handleComment = async (e) => {
    e.preventDefault();
    try { await api.post(`/posts/${id}/comments`, { text: comment }); setComment(''); fetchPost(); } catch (err) { setError(err.response?.data?.message || 'Could not post your comment.'); }
  };

  useEffect(() => {
    fetchPost();
  }, [id]);

  if (!post) return <p className="status-message">Loading note...</p>;

  return (
    <article className="post-view"><p className="eyebrow">{post.category || 'Journal entry'}</p><h1>{post.title}</h1><p className="post-meta">By {post.author?.name || 'Anonymous'} · {new Date(post.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} · {post.views || 0} views</p><button className="button button-primary" onClick={handleLike}>{liked ? 'Liked' : 'Like'} · {post.likes?.length || 0}</button>
      <div
        className="post-content"
        dangerouslySetInnerHTML={{ __html: post.content }}
      ></div>

      <div className="rule" />

      <h2>Responses <span>{post.comments?.length || 0}</span></h2>
      {!post.comments?.length ? <p className="status-message">Be the first to leave a thought.</p> : (
        post.comments.map((c, i) => (
          <div key={c._id || i} className="comment-item">
            <p>{c.text}</p><span>by {c.author?.name || 'Reader'}</span>
          </div>
        ))
      )}

      {user && (
        <form onSubmit={handleComment} className="comment-form">
          <textarea
            className="field"
            placeholder="Add a comment..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            required
          ></textarea>
          {error && <p className="form-error">{error}</p>}<button type="submit" className="button button-dark">Post response</button>
        </form>
      )}
    </article>
  );
}


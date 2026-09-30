import React, { useEffect, useState, useContext } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';

export default function PostView() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [comment, setComment] = useState('');
  const [commentMessage, setCommentMessage] = useState('');
  const [error, setError] = useState('');
  const [liked, setLiked] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [guestName, setGuestName] = useState('');
  const { user } = useContext(AuthContext);

  const fetchPost = async () => {
    try {
      const res = await api.get(`/posts/${id}`);
      setPost(res.data);
      setLiked(Boolean(user && res.data.likes?.some(like => (like._id || like).toString() === (user.id || user._id).toString())));
      document.title = res.data.metaTitle || res.data.title;
      let description = document.querySelector('meta[name="description"]');
      if (!description) {
        description = document.createElement('meta');
        description.name = 'description';
        document.head.appendChild(description);
      }
      description.content = res.data.metaDescription || res.data.excerpt || '';
    } catch (err) {
      setError(err.response?.data?.message || 'This post could not be loaded.');
    }
  };

  const handleLike = async () => {
    if (!user) return setError('Sign in to react to an article.');
    try {
      const res = await api.post(`/posts/${post._id}/like`);
      setLiked(res.data.liked);
      setPost(current => ({ ...current, likes: Array(res.data.likes) }));
    } catch (err) {
      setError(err.response?.data?.message || 'Your reaction could not be saved.');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    setError('');
    setCommentMessage('');
    try {
      const { data } = await api.post(`/posts/${post._id}/comments`, { text: comment, parent: replyTo?._id, guestName });
      setComment('');
      setReplyTo(null);
      setGuestName('');
      setCommentMessage(data.status === 'approved' ? 'Your response is published.' : 'Your response is waiting for review.');
      await fetchPost();
    } catch (err) { setError(err.response?.data?.message || 'Could not post your comment.'); }
  };

  useEffect(() => {
    fetchPost();
  }, [id]);

  if (!post) return <>{error ? <p className="form-error">{error}</p> : <p className="status-message">Loading note...</p>}</>;

  return (
    <article className="post-view"><p className="eyebrow">{post.category || 'Journal entry'}</p><h1>{post.title}</h1><p className="post-meta">By {post.author?.name || 'Anonymous'} · {new Date(post.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} · {post.views || 0} views</p>{user && (user.role === 'admin' || (user.id || user._id)?.toString() === post.author?._id?.toString()) && <Link className="button button-quiet" to={`/posts/${post._id}/edit`}>Edit</Link>}<button className="button button-primary" onClick={handleLike}>{liked ? 'Liked' : 'Like'} · {post.likes?.length || 0}</button>
      {post.coverImage && <img src={post.coverImage} alt="" className="post-cover" />}
      <div
        className="post-content"
      ><ReactMarkdown components={{
        a: ({ href = '', children }) => /\.(mp4|webm|mov)(?:\?|$)/i.test(href)
          ? <video className="post-video" controls preload="metadata" src={href}>{children}</video>
          : <a href={href} target="_blank" rel="noreferrer">{children}</a>
      }}>{post.content}</ReactMarkdown></div>

      <div className="rule" />

      <h2>Responses <span>{post.comments?.length || 0}</span></h2>
      {!post.comments?.length ? <p className="status-message">Be the first to leave a thought.</p> : (
        post.comments.map((c, i) => (
          <div key={c._id || i} className="comment-item">
            <p>{c.text}</p><span>by {c.author?.name || c.guestName || 'Reader'}</span><button className="button button-quiet" onClick={() => setReplyTo(c)}>Reply</button>
          </div>
        ))
      )}

      <form onSubmit={handleComment} className="comment-form">
          {replyTo && <p className="status-message">Replying to {replyTo.author?.name || replyTo.guestName || 'Reader'} <button type="button" className="button button-quiet" onClick={() => setReplyTo(null)}>Cancel</button></p>}
          {!user && <input className="field" placeholder="Your name" maxLength={80} value={guestName} onChange={e => setGuestName(e.target.value)} required />}
          <textarea
            className="field"
            placeholder="Add a comment..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            required
          ></textarea>
          {commentMessage && <p className="status-message">{commentMessage}</p>}
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="button button-dark">Post response</button>
        </form>
    </article>
  );
}


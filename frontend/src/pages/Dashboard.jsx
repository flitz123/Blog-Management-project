import React, { useEffect, useState, useContext } from 'react';
import api from '../api/axios';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Dashboard() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [subscriberEmail, setSubscriberEmail] = useState('');
  const [subscriptionMessage, setSubscriptionMessage] = useState('');
  const { user } = useContext(AuthContext);

  useEffect(() => {
    api.get('/categories').then(res => setCategories(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (category) params.set('category', category);
    api.get(`/posts?${params}`).then(res => setPosts(res.data.posts || res.data)).catch(() => setError('The journal is taking a moment to wake up.')).finally(() => setLoading(false));
  }, [search, category]);

  const subscribe = async (event) => {
    event.preventDefault();
    try { await api.post('/subscribe', { email: subscriberEmail }); setSubscriptionMessage('You are on the list.'); setSubscriberEmail(''); } catch (err) { setSubscriptionMessage(err.response?.data?.message || 'Subscription failed.'); }
  };

  return (
    <div className="home-page">
      <section className="hero-panel"><div><p className="eyebrow">The Fieldnotes journal</p><h1>Ideas with a little more room to breathe.</h1><p className="hero-copy">A calm place for essays, observations, and the small discoveries that stay with you.</p></div><div className="hero-stamp">Since<br /><strong>2024</strong></div></section>
      <div className="section-heading"><div><p className="eyebrow">Fresh from the journal</p><h2>Latest notes</h2></div>{user && <Link to="/create" className="button button-primary">Write a note <span>↗</span></Link>}</div>
      <div className="discovery-bar"><input className="field" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search articles..." aria-label="Search articles" /><select className="field" value={category} onChange={e => setCategory(e.target.value)} aria-label="Filter by category"><option value="">All categories</option>{categories.map(item => <option key={item._id} value={item.name}>{item.name}</option>)}</select></div>
      {loading && <p className="status-message">Loading the latest notes...</p>}
      {error && <p className="form-error">{error}</p>}
      {!loading && !error && posts.length === 0 && <div className="empty-state"><h3>The first note is yours.</h3><p>Start a conversation worth returning to.</p>{user && <Link to="/create" className="button button-primary">Write the first note</Link>}</div>}
      <div className="post-grid">{posts.map((post, index) => <article key={post._id} className={`post-card post-card-${index % 3}`}><div className="post-card-top"><span>{String(index + 1).padStart(2, '0')}</span><span>{new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span></div><Link to={`/posts/${post._id}`}><h3>{post.title}</h3></Link><p className="post-excerpt">{post.excerpt || post.content.replace(/<[^>]+>/g, '').slice(0, 150)}...</p><p className="byline">By {post.author?.name || 'Anonymous'}</p>{post.tags?.length > 0 && <div className="tag-row">{post.tags.slice(0, 3).map(tag => <span key={tag}>{tag}</span>)}</div>}</article>)}</div>
      <section className="section-heading"><div><p className="eyebrow">Stay close</p><h2>New notes, occasionally.</h2></div><form onSubmit={subscribe} className="discovery-bar"><input className="field" type="email" required placeholder="you@example.com" value={subscriberEmail} onChange={e => setSubscriberEmail(e.target.value)} aria-label="Email for newsletter" /><button className="button button-dark">Subscribe</button></form>{subscriptionMessage && <p className="status-message">{subscriptionMessage}</p>}</section>
    </div>
  );
}


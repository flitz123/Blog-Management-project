import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function CreatePost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('draft');
  const [error, setError] = useState('');
  const nav = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!title || !content) {
      setError('Title and content are required.');
      return;
    }

    try {
      const res = await api.post('/posts', {
        title,
        content,
        category,
        status,
        tags: tags.split(',').map(tag => tag.trim()).filter(Boolean)
      });
      nav(`/posts/${res.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.msg || 'Failed to create post.');
    }
  };

  return (
    <div className="editor-page"><div className="editor-heading"><p className="eyebrow">New entry</p><h1>Put something good into the world.</h1><p>Write plainly. Leave space for the reader.</p></div><form onSubmit={handleSubmit} className="editor-form">
        <input
          type="text"
          placeholder="Post title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="field field-title"
          required
        />
        <input
          type="text"
          placeholder="Tags (comma separated)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="field"
        />
        <input type="text" placeholder="Category" value={category} onChange={e => setCategory(e.target.value)} className="field" />
        <select value={status} onChange={e => setStatus(e.target.value)} className="field" aria-label="Post status"><option value="draft">Save as draft</option><option value="published">Publish now</option></select>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your post here..."
          className="field editor-textarea"
          required
        />
        {error && <p className="form-error">{error}</p>}<button type="submit" className="button button-primary">Publish note <span>↗</span></button>
      </form>
    </div>
  );
}

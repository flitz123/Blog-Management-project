import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import api from '../api/axios';

export default function CreatePost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
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
        tags: tags.split(',').map(tag => tag.trim()).filter(Boolean)
      });
      alert('Post created successfully!');
      nav(`/posts/${res.data._id}`);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to create post.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Create a New Post</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Post title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border rounded p-2"
          required
        />
        <input
          type="text"
          placeholder="Tags (comma separated)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="w-full border rounded p-2"
        />
        <ReactQuill
          theme="snow"
          value={content}
          onChange={setContent}
          placeholder="Write your post here..."
          className="bg-white rounded"
        />
        {error && <p className="text-red-600">{error}</p>}
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Publish Post
        </button>
      </form>
    </div>
  );
}

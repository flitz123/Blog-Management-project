import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';

export default function PostView() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [comment, setComment] = useState('');
  const { user } = useContext(AuthContext);

  const fetchPost = async () => {
    const res = await api.get(`/posts/${id}`);
    setPost(res.data);
  };

  const handleComment = async (e) => {
    e.preventDefault();
    await api.post(`/posts/${id}/comments`, { text: comment });
    setComment('');
    fetchPost();
  };

  useEffect(() => {
    fetchPost();
  }, [id]);

  if (!post) return <p>Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-3xl font-bold mb-2">{post.title}</h2>
      <p className="text-gray-600 text-sm mb-4">by {post.author?.name}</p>
      <div
        className="prose"
        dangerouslySetInnerHTML={{ __html: post.content }}
      ></div>

      <hr className="my-4" />

      <h3 className="text-lg font-semibold mb-2">Comments</h3>
      {post.comments.length === 0 ? <p>No comments yet.</p> : (
        post.comments.map((c, i) => (
          <div key={i} className="border-t py-2">
            <p className="text-gray-800">{c.text}</p>
            <span className="text-sm text-gray-500">by {c.author?.name || 'User'}</span>
          </div>
        ))
      )}

      {user && (
        <form onSubmit={handleComment} className="mt-4">
          <textarea
            className="w-full border rounded p-2"
            placeholder="Add a comment..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            required
          ></textarea>
          <button type="submit" className="bg-blue-600 text-white px-3 py-1 mt-2 rounded">
            Post Comment
          </button>
        </form>
      )}
    </div>
  );
}


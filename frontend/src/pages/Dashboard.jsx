import React, { useEffect, useState, useContext } from 'react';
import api from '../api/axios';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Dashboard() {
  const [posts, setPosts] = useState([]);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    api.get('/posts')
      .then(res => setPosts(res.data))
      .catch(err => console.error('Error fetching posts:', err));
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">All Blog Posts</h2>
        {user && (
          <Link to="/create" className="bg-blue-600 text-white px-3 py-1 rounded">
            + Create Post
          </Link>
        )}
      </div>
      {posts.length === 0 ? (
        <p>No posts yet.</p>
      ) : (
        posts.map(post => (
          <div key={post._id} className="border p-3 mb-3 rounded hover:shadow">
            <Link to={`/posts/${post._id}`} className="text-lg font-semibold text-blue-600">
              {post.title}
            </Link>
            <p className="text-sm text-gray-500">
              by {post.author?.name || 'Anonymous'} on {new Date(post.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))
      )}
    </div>
  );
}


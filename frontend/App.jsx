
import React from "react";
import { Navigate, Routes, Route } from "react-router-dom";
import Navbar from "./src/components/Navbar";
import ProtectedRoute from "./src/components/ProtectedRoute";

import Login from "./src/pages/Login";
import Register from "./src/pages/Register";
import Dashboard from "./src/pages/Dashboard";
import CreatePost from "./src/pages/CreatePost";
import PostView from "./src/pages/PostView";
import Admin from "./src/pages/Admin";
import MyPosts from "./src/pages/MyPosts";
import Profile from "./src/pages/Profile";

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="page-frame">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/posts/:id" element={<PostView />} />
          <Route path="/posts/:id/edit" element={<ProtectedRoute roles={["author", "admin"]}><CreatePost /></ProtectedRoute>} />
          <Route path="/my-posts" element={<ProtectedRoute roles={["author", "admin"]}><MyPosts /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><Admin /></ProtectedRoute>} />
          <Route
            path="/create"
            element={
              <ProtectedRoute roles={["author", "admin"]}>
                <CreatePost />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}


import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./src/components/Navbar";
import ProtectedRoute from "./src/components/ProtectedRoute";

import Login from "./src/pages/Login";
import Register from "./src/pages/Register";
import Dashboard from "./src/pages/Dashboard";
import CreatePost from "./src/pages/CreatePost";
import PostView from "./src/pages/PostView";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <Navbar />
      <div className="p-4">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/posts/:id" element={<PostView />} />
          <Route
            path="/create"
            element={
              <ProtectedRoute>
                <CreatePost />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </div>
  );
}

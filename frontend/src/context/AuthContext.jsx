import React, { createContext, useState, useEffect } from "react";
import api from "../api/axios";

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user")) || null;
  } catch {
    return null;
  }
};

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    const loggedUser = res.data.user;
    const token = res.data.token;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(loggedUser));

    setUser(loggedUser);
  };

  const register = async (name, email, password) => {
    await api.post("/auth/register", { name, email, password });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && !user) {
      const storedUser = getStoredUser();
      if (storedUser) setUser(storedUser);
      else logout();
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};


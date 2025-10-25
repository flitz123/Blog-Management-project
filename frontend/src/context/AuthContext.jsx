import React, { createContext, useState, useEffect } from 'react';
import { setAuthToken } from '../api/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(()=> JSON.parse(localStorage.getItem('user')));
  const [token, setToken] = useState(()=> localStorage.getItem('token'));

  useEffect(()=> {
    if(token) setAuthToken(token);
    else setAuthToken(null);
  }, [token]);

  const login = (data) => {
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('token', data.token);
    setAuthToken(data.token);
  };

  const logout = () => {
    setUser(null); setToken(null);
    localStorage.removeItem('user'); localStorage.removeItem('token');
    setAuthToken(null);
  };

  return <AuthContext.Provider value={{ user, token, login, logout }}>{children}</AuthContext.Provider>;
};

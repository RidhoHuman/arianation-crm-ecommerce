import api from './api';

export async function login(credentials) {
  const res = await api.post('/auth/login', credentials);
  return res.data;
}

export async function register(payload) {
  const res = await api.post('/auth/register', payload);
  return res.data;
}

export async function me() {
  const res = await api.get('/auth/me');
  return res.data;
}

export async function logout() {
  try {
    await api.post('/auth/logout');
  } catch (e) {
    // ignore
  }
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

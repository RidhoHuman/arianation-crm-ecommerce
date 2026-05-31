import api from './api';

export async function login(credentials) {
  console.log('📤 authService.login() POST ke /auth/login');
  const res = await api.post('/auth/login', credentials);
  console.log('📥 Raw axios response:', res);
  console.log('📦 res.data:', res.data);
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

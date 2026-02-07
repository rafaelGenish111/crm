import api from './api';

const authService = {
  async login(email, password) {
    return api.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async signup(userData) {
    return api.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async getMe() {
    return api.request('/auth/me');
  },
};

export default authService;

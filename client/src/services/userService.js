import api from './api';

const userService = {
  async getUsers() {
    return api.request('/users');
  },

  async getUserById(id) {
    return api.request(`/users/${id}`);
  },

  async createUser(userData) {
    return api.request('/users', {
      method: 'POST',
      body: userData,
    });
  },

  async updateUser(id, userData) {
    return api.request(`/users/${id}`, {
      method: 'PUT',
      body: userData,
    });
  },

  async deleteUser(id) {
    return api.request(`/users/${id}`, {
      method: 'DELETE',
    });
  },
};

export default userService;

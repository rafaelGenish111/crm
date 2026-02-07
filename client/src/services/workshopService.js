import api from './api';

const workshopService = {
  async getWorkshops(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return api.request(`/workshops${params ? `?${params}` : ''}`);
  },

  async getWorkshopById(id) {
    return api.request(`/workshops/${id}`);
  },

  async createWorkshop(workshopData) {
    return api.request('/workshops', {
      method: 'POST',
      body: workshopData,
    });
  },

  async updateWorkshop(id, workshopData) {
    return api.request(`/workshops/${id}`, {
      method: 'PUT',
      body: workshopData,
    });
  },

  async deleteWorkshop(id) {
    return api.request(`/workshops/${id}`, {
      method: 'DELETE',
    });
  },

  async enrollInWorkshop(id, enrollmentData) {
    return api.request(`/workshops/${id}/enroll`, {
      method: 'POST',
      body: enrollmentData,
    });
  },
};

export default workshopService;

import api from './api';

const customerService = {
  async getCustomers(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return api.request(`/customers${params ? `?${params}` : ''}`);
  },

  async getCustomerById(id) {
    return api.request(`/customers/${id}`);
  },

  async createCustomer(customerData) {
    return api.request('/customers', {
      method: 'POST',
      body: customerData,
    });
  },

  async updateCustomer(id, customerData) {
    return api.request(`/customers/${id}`, {
      method: 'PUT',
      body: customerData,
    });
  },

  async deleteCustomer(id) {
    return api.request(`/customers/${id}`, {
      method: 'DELETE',
    });
  },

  async resetCustomerPassword(id) {
    return api.request(`/customers/${id}/reset-password`, {
      method: 'POST',
    });
  },
};

export default customerService;

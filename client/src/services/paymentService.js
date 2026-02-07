import api from './api';

const paymentService = {
  async getPaymentById(paymentId) {
    return api.request(`/payments/${paymentId}`);
  },

  async updatePaymentStatus(paymentId, data) {
    return api.request(`/payments/${paymentId}/status`, {
      method: 'PUT',
      body: data,
    });
  },

  async getPendingPayments(customerId) {
    return api.request(`/payments/customer/${customerId}/pending`);
  },

  async createPaymentLink(data) {
    return api.request('/payments/link', {
      method: 'POST',
      body: data,
    });
  },
};

export default paymentService;

import api from './api';

const accountingService = {
  async getBalance(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return api.request(`/accounting/balance${params ? `?${params}` : ''}`);
  },

  async getProfitabilityBreakdown(type) {
    return api.request(`/accounting/profitability?type=${type}`);
  },

  async getReports(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return api.request(`/accounting/reports${params ? `?${params}` : ''}`);
  },

  async getInvoicesByCustomers(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return api.request(`/accounting/invoices${params ? `?${params}` : ''}`);
  },

  async getInvoicesByCustomer(customerId, filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return api.request(`/accounting/invoices/customer/${customerId}${params ? `?${params}` : ''}`);
  },

  async getCustomersWithDebts(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return api.request(`/accounting/customers/debts${params ? `?${params}` : ''}`);
  },
};

export default accountingService;

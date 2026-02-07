import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import accountingService from '../../services/accountingService';
import { formatDate, formatCurrency } from '../../utils/configUtils';
import { useBusinessConfig } from '../../context/BusinessConfigContext';

function CustomersWithDebts() {
  const navigate = useNavigate();
  const { config } = useBusinessConfig();
  const [customers, setCustomers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showInvoicesModal, setShowInvoicesModal] = useState(false);
  const [minAmount, setMinAmount] = useState('');

  useEffect(() => {
    loadCustomers();
  }, [minAmount]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (minAmount) params.minAmount = minAmount;

      const data = await accountingService.getCustomersWithDebts(params);
      setCustomers(data.customers || []);
      setSummary(data.summary || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewInvoices = (customer) => {
    setSelectedCustomer(customer);
    setShowInvoicesModal(true);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">טוען לקוחות עם חובות...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">לקוחות עם חובות</h1>
          <button
            onClick={() => navigate('/accounting')}
            className="text-gray-600 hover:text-gray-800"
          >
            ← חזרה לדשבורד
          </button>
        </div>

        {error && (
          <Card className="bg-red-50 border-red-200">
            <p className="text-red-600">{error}</p>
          </Card>
        )}

        {/* Summary */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-blue-50">
              <p className="text-sm text-gray-600 mb-1">מספר לקוחות</p>
              <p className="text-2xl font-bold text-blue-600">{summary.totalCustomers}</p>
            </Card>
            <Card className="p-4 bg-red-50">
              <p className="text-sm text-gray-600 mb-1">סה"כ חוב</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(summary.totalDebt, config)}
              </p>
            </Card>
            <Card className="p-4 bg-yellow-50">
              <p className="text-sm text-gray-600 mb-1">מספר חשבונות</p>
              <p className="text-2xl font-bold text-yellow-600">{summary.totalInvoices}</p>
            </Card>
            <Card className="p-4 bg-orange-50">
              <p className="text-sm text-gray-600 mb-1">חשבונות באיחור</p>
              <p className="text-2xl font-bold text-orange-600">{summary.totalOverdueInvoices}</p>
            </Card>
          </div>
        )}

        {/* Filter */}
        <Card className="p-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">חוב מינימלי (₪)</label>
              <input
                type="number"
                min="0"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                placeholder="הזן סכום מינימלי"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => setMinAmount('')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              נקה
            </button>
          </div>
        </Card>

        {/* Customers Table */}
        <DataTable
          columns={[
            {
              key: 'customer',
              label: 'לקוח',
              render: (value) => (
                <div>
                  <div className="font-semibold">{value?.name || '-'}</div>
                  <div className="text-sm text-gray-500">
                    {value?.phone || ''} {value?.email ? `• ${value.email}` : ''}
                  </div>
                </div>
              ),
            },
            {
              key: 'totalDebt',
              label: 'סה"כ חוב',
              render: (value) => (
                <span className="font-bold text-red-600 text-lg">
                  {formatCurrency(value, config)}
                </span>
              ),
              sortable: true,
            },
            {
              key: 'totalInvoices',
              label: 'מספר חשבונות',
              render: (value) => (
                <span className="font-semibold">{value}</span>
              ),
            },
            {
              key: 'overdueInvoices',
              label: 'חשבונות באיחור',
              render: (value) => (
                <span className={`font-semibold ${value > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  {value}
                </span>
              ),
            },
            {
              key: 'actions',
              label: 'פעולות',
              render: (value, row) => (
                <button
                  onClick={() => handleViewInvoices(row)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
                >
                  צפה בחשבונות
                </button>
              ),
            },
          ]}
          data={customers}
        />

        {customers.length === 0 && !loading && (
          <Card className="p-6 text-center">
            <p className="text-gray-600">לא נמצאו לקוחות עם חובות</p>
          </Card>
        )}

        {/* Invoices Modal */}
        <Modal
          isOpen={showInvoicesModal}
          onClose={() => setShowInvoicesModal(false)}
          title={`חשבונות של ${selectedCustomer?.customer?.name || ''}`}
          size="large"
        >
          {selectedCustomer && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">סה"כ חוב</p>
                    <p className="text-xl font-bold text-red-600">
                      {formatCurrency(selectedCustomer.totalDebt, config)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">מספר חשבונות</p>
                    <p className="text-xl font-bold">{selectedCustomer.totalInvoices}</p>
                  </div>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-right">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-sm font-semibold">מספר חשבון</th>
                      <th className="px-4 py-2 text-sm font-semibold">תאריך הנפקה</th>
                      <th className="px-4 py-2 text-sm font-semibold">תאריך פירעון</th>
                      <th className="px-4 py-2 text-sm font-semibold">סכום כולל</th>
                      <th className="px-4 py-2 text-sm font-semibold">שולם</th>
                      <th className="px-4 py-2 text-sm font-semibold">יתרה</th>
                      <th className="px-4 py-2 text-sm font-semibold">סטטוס</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCustomer.invoices.map((invoice, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="px-4 py-2">{invoice.invoiceNumber}</td>
                        <td className="px-4 py-2">{formatDate(invoice.issueDate, config)}</td>
                        <td className="px-4 py-2">
                          {invoice.dueDate ? formatDate(invoice.dueDate, config) : '-'}
                        </td>
                        <td className="px-4 py-2">{formatCurrency(invoice.totalAmount, config)}</td>
                        <td className="px-4 py-2">{formatCurrency(invoice.paidAmount, config)}</td>
                        <td
                          className={`px-4 py-2 font-semibold ${invoice.balance > 0
                              ? invoice.isOverdue
                                ? 'text-red-600'
                                : 'text-yellow-600'
                              : 'text-green-600'
                            }`}
                        >
                          {formatCurrency(invoice.balance, config)}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`px-2 py-1 rounded text-xs ${invoice.status === 'paid'
                                  ? 'bg-green-100 text-green-800'
                                  : invoice.status === 'sent'
                                    ? 'bg-blue-100 text-blue-800'
                                    : invoice.status === 'cancelled'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-gray-100 text-gray-800'
                                }`}
                            >
                              {invoice.status === 'paid'
                                ? 'שולם'
                                : invoice.status === 'sent'
                                  ? 'נשלח'
                                  : invoice.status === 'cancelled'
                                    ? 'בוטל'
                                    : 'טיוטה'}
                            </span>
                            {invoice.isOverdue && (
                              <span className="text-xs text-red-600 font-semibold">איחור</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}

export default CustomersWithDebts;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import accountingService from '../../services/accountingService';
import { formatDate, formatCurrency } from '../../utils/configUtils';
import { useBusinessConfig } from '../../context/BusinessConfigContext';

function InvoicesByCustomers() {
  const navigate = useNavigate();
  const { config } = useBusinessConfig();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    loadInvoices();
  }, [filters]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const data = await accountingService.getInvoicesByCustomers(params);
      setInvoices(data.invoices || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const statusLabels = {
    draft: 'טיוטה',
    sent: 'נשלח',
    paid: 'שולם',
    cancelled: 'בוטל',
  };

  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    sent: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">טוען חשבונות...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">חשבונות לפי לקוחות</h1>
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

        {/* Filters */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">סטטוס</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">כל הסטטוסים</option>
                <option value="draft">טיוטה</option>
                <option value="sent">נשלח</option>
                <option value="paid">שולם</option>
                <option value="cancelled">בוטל</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">מתאריך</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">עד תאריך</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ status: '', startDate: '', endDate: '' })}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                נקה פילטרים
              </button>
            </div>
          </div>
        </Card>

        {/* Summary */}
        {invoices.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-blue-50">
              <p className="text-sm text-gray-600 mb-1">סה"כ חשבונות</p>
              <p className="text-2xl font-bold text-blue-600">{invoices.length}</p>
            </Card>
            <Card className="p-4 bg-green-50">
              <p className="text-sm text-gray-600 mb-1">סה"כ סכום</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(
                  invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0),
                  config
                )}
              </p>
            </Card>
            <Card className="p-4 bg-yellow-50">
              <p className="text-sm text-gray-600 mb-1">סה"כ חוב</p>
              <p className="text-2xl font-bold text-yellow-600">
                {formatCurrency(
                  invoices.reduce((sum, inv) => sum + (inv.balance || 0), 0),
                  config
                )}
              </p>
            </Card>
          </div>
        )}

        {/* Invoices Table */}
        <DataTable
          columns={[
            {
              key: 'invoiceNumber',
              label: 'מספר חשבון',
              sortable: true,
            },
            {
              key: 'customer',
              label: 'לקוח',
              render: (value) => (
                <div>
                  <div className="font-semibold">{value?.name || '-'}</div>
                  <div className="text-sm text-gray-500">{value?.phone || ''}</div>
                </div>
              ),
            },
            {
              key: 'issueDate',
              label: 'תאריך הנפקה',
              render: (value) => formatDate(value, config),
              sortable: true,
            },
            {
              key: 'dueDate',
              label: 'תאריך פירעון',
              render: (value) => (value ? formatDate(value, config) : '-'),
              sortable: true,
            },
            {
              key: 'totalAmount',
              label: 'סכום כולל',
              render: (value) => formatCurrency(value, config),
              sortable: true,
            },
            {
              key: 'paidAmount',
              label: 'שולם',
              render: (value) => formatCurrency(value || 0, config),
            },
            {
              key: 'balance',
              label: 'יתרה',
              render: (value, row) => (
                <span
                  className={`font-semibold ${value > 0
                      ? row.isOverdue
                        ? 'text-red-600'
                        : 'text-yellow-600'
                      : 'text-green-600'
                    }`}
                >
                  {formatCurrency(value || 0, config)}
                </span>
              ),
            },
            {
              key: 'status',
              label: 'סטטוס',
              render: (value, row) => (
                <div className="flex flex-col gap-1">
                  <span className={`px-2 py-1 rounded text-sm ${statusColors[value] || 'bg-gray-100 text-gray-800'}`}>
                    {statusLabels[value] || value}
                  </span>
                  {row.isOverdue && (
                    <span className="text-xs text-red-600 font-semibold">איחור בתשלום</span>
                  )}
                </div>
              ),
            },
          ]}
          data={invoices}
        />

        {invoices.length === 0 && !loading && (
          <Card className="p-6 text-center">
            <p className="text-gray-600">לא נמצאו חשבונות</p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

export default InvoicesByCustomers;

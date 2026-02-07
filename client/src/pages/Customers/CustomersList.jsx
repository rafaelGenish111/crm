import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import customerService from '../../services/customerService';

function CustomersList() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    source: 'direct',
    notes: '',
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await customerService.getCustomers();
      setCustomers(data.customers);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await customerService.updateCustomer(editingCustomer.id, formData);
      } else {
        await customerService.createCustomer(formData);
      }
      await loadCustomers();
      resetForm();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer({ id: customer._id || customer.id });
    setFormData({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      source: customer.source || 'direct',
      notes: customer.notes || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (customerId) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק לקוח זה?')) {
      return;
    }
    try {
      await customerService.deleteCustomer(customerId);
      await loadCustomers();
    } catch (err) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      source: 'direct',
      notes: '',
    });
    setEditingCustomer(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">טוען לקוחות...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">ניהול לקוחות</h1>
          <Button
            onClick={() => setShowForm(true)}
            variant="primary"
          >
            הוסף לקוח
          </Button>
        </div>

        {error && (
          <Card className="bg-red-50 border-red-200">
            <p className="text-red-600">{error}</p>
          </Card>
        )}

        <DataTable
          columns={[
            { key: 'name', label: 'שם', sortable: true },
            { key: 'email', label: 'אימייל', sortable: true },
            { key: 'phone', label: 'טלפון', sortable: true },
            {
              key: 'source',
              label: 'מקור',
              render: (value) => {
                const sources = {
                  lead_conversion: 'המרה מליד',
                  direct: 'ישיר',
                  referral: 'המלצה',
                  other: 'אחר',
                };
                return sources[value] || value;
              },
            },
            {
              key: 'actions',
              label: 'פעולות',
              render: (value, row) => (
                <div className="flex space-x-2 space-x-reverse">
                  <button
                    onClick={() => navigate(`/customers/${row._id || row.id}`)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    צפה
                  </button>
                  <button
                    onClick={() => handleEdit(row)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ערוך
                  </button>
                  <button
                    onClick={() => handleDelete(row._id || row.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    מחק
                  </button>
                </div>
              ),
            },
          ]}
          data={customers}
          onRowClick={(row) => navigate(`/customers/${row._id || row.id}`)}
        />

        <Modal
          isOpen={showForm}
          onClose={resetForm}
          title={editingCustomer ? 'ערוך לקוח' : 'לקוח חדש'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">שם *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">טלפון *</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">אימייל</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">מקור</label>
              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="direct">ישיר</option>
                <option value="lead_conversion">המרה מליד</option>
                <option value="referral">המלצה</option>
                <option value="other">אחר</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">הערות</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                rows="3"
              />
            </div>
            <div className="flex justify-start space-x-4 space-x-reverse">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                {editingCustomer ? 'עדכן' : 'צור'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
              >
                ביטול
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}

export default CustomersList;

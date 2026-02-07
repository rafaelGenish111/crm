import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import DataTable from '../../components/ui/DataTable';
import workshopService from '../../services/workshopService';
import customerService from '../../services/customerService';
import leadService from '../../services/leadService';
import { formatDate, formatCurrency } from '../../utils/configUtils';
import { useBusinessConfig } from '../../context/BusinessConfigContext';

function WorkshopDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { config } = useBusinessConfig();
  const [workshop, setWorkshop] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showCreateLeadModal, setShowCreateLeadModal] = useState(false);
  const [enrollmentData, setEnrollmentData] = useState({
    customerId: '',
    leadId: '',
    notes: '',
  });
  const [leadData, setLeadData] = useState({
    name: '',
    email: '',
    phone: '',
    source: 'other',
  });

  useEffect(() => {
    loadWorkshopData();
    loadCustomers();
    loadLeads();
  }, [id]);

  const loadWorkshopData = async () => {
    try {
      setLoading(true);
      const data = await workshopService.getWorkshopById(id);
      setWorkshop(data.workshop);
      setEnrollments(data.enrollments || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const data = await customerService.getCustomers();
      setCustomers(data.customers || []);
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  };

  const loadLeads = async () => {
    try {
      const data = await leadService.getLeads();
      setLeads(data.leads || []);
    } catch (err) {
      console.error('Failed to load leads:', err);
    }
  };

  const handleEnroll = async (e) => {
    e.preventDefault();
    try {
      await workshopService.enrollInWorkshop(id, enrollmentData);
      await loadWorkshopData();
      setShowEnrollModal(false);
      setEnrollmentData({ customerId: '', leadId: '', notes: '' });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateLeadAndEnroll = async (e) => {
    e.preventDefault();
    try {
      await workshopService.enrollInWorkshop(id, {
        leadData,
        notes: '',
      });
      await loadWorkshopData();
      setShowCreateLeadModal(false);
      setLeadData({ name: '', email: '', phone: '', source: 'other' });
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">טוען פרטי סדנה...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !workshop) {
    return (
      <DashboardLayout>
        <Card className="bg-red-50 border-red-200">
          <p className="text-red-600">{error || 'סדנה לא נמצאה'}</p>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{workshop.name}</h1>
            <div className="mt-4 flex flex-wrap gap-4">
              <div>
                <span className="text-sm text-gray-500">מנחה:</span>
                <span className="mr-2 font-medium">{workshop.instructor?.name || '-'}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">תאריך:</span>
                <span className="mr-2 font-medium">{formatDate(workshop.date, config)}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">מחיר:</span>
                <span className="mr-2 font-medium">{formatCurrency(workshop.price, config)}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">קיבולת:</span>
                <span className="mr-2 font-medium">{enrollments.length} / {workshop.capacity}</span>
              </div>
            </div>
            {workshop.location && (
              <div className="mt-2">
                <span className="text-sm text-gray-500">מיקום:</span>
                <span className="mr-2 font-medium">{workshop.location}</span>
              </div>
            )}
          </div>
          <div className="flex space-x-4 space-x-reverse">
            <button
              onClick={() => setShowEnrollModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              שיבוץ משתתף
            </button>
            <button
              onClick={() => navigate('/workshops')}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
            >
              חזרה
            </button>
          </div>
        </div>

        {error && (
          <Card className="bg-red-50 border-red-200">
            <p className="text-red-600">{error}</p>
          </Card>
        )}

        <Card>
          <h2 className="text-xl font-semibold mb-4">משתתפים</h2>
          <DataTable
            columns={[
              {
                key: 'name',
                label: 'שם',
                render: (value, row) => {
                  if (row.customer) {
                    return row.customer.name;
                  }
                  if (row.lead) {
                    return row.lead.name;
                  }
                  return '-';
                },
              },
              {
                key: 'type',
                label: 'סוג',
                render: (value, row) => (row.customer ? 'לקוח' : 'ליד'),
              },
              {
                key: 'phone',
                label: 'טלפון',
                render: (value, row) => {
                  if (row.customer) {
                    return row.customer.phone;
                  }
                  if (row.lead) {
                    return row.lead.phone;
                  }
                  return '-';
                },
              },
              {
                key: 'enrolledAt',
                label: 'תאריך רישום',
                render: (value) => formatDate(value, config),
              },
              {
                key: 'status',
                label: 'סטטוס',
              },
            ]}
            data={enrollments}
          />
        </Card>

        {/* Enroll Modal - Similar to CourseDetails */}
        <Modal
          isOpen={showEnrollModal}
          onClose={() => setShowEnrollModal(false)}
          title="שיבוץ משתתף לסדנה"
        >
          <form onSubmit={handleEnroll} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">בחר לקוח</label>
              <select
                value={enrollmentData.customerId}
                onChange={(e) => setEnrollmentData({ ...enrollmentData, customerId: e.target.value, leadId: '' })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">-- בחר לקוח --</option>
                {customers.map((customer) => (
                  <option key={customer._id || customer.id} value={customer._id || customer.id}>
                    {customer.name} - {customer.phone}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-center text-gray-500">או</div>
            <div>
              <label className="block text-sm font-medium mb-2">בחר ליד</label>
              <select
                value={enrollmentData.leadId}
                onChange={(e) => setEnrollmentData({ ...enrollmentData, leadId: e.target.value, customerId: '' })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">-- בחר ליד --</option>
                {leads.map((lead) => (
                  <option key={lead._id || lead.id} value={lead._id || lead.id}>
                    {lead.name} - {lead.phone}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">הערות</label>
              <textarea
                value={enrollmentData.notes}
                onChange={(e) => setEnrollmentData({ ...enrollmentData, notes: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                rows="3"
              />
            </div>
            <div className="flex justify-start space-x-4 space-x-reverse">
              <button
                type="submit"
                disabled={!enrollmentData.customerId && !enrollmentData.leadId}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                שׁבּץ
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowEnrollModal(false);
                  setShowCreateLeadModal(true);
                }}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
              >
                צור ליד חדש
              </button>
              <button
                type="button"
                onClick={() => setShowEnrollModal(false)}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
              >
                ביטול
              </button>
            </div>
          </form>
        </Modal>

        {/* Create Lead Modal */}
        <Modal
          isOpen={showCreateLeadModal}
          onClose={() => setShowCreateLeadModal(false)}
          title="צור ליד חדש ושיבוץ לסדנה"
        >
          <form onSubmit={handleCreateLeadAndEnroll} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">שם *</label>
              <input
                type="text"
                value={leadData.name}
                onChange={(e) => setLeadData({ ...leadData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">טלפון *</label>
              <input
                type="tel"
                value={leadData.phone}
                onChange={(e) => setLeadData({ ...leadData, phone: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">אימייל</label>
              <input
                type="email"
                value={leadData.email}
                onChange={(e) => setLeadData({ ...leadData, email: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div className="flex justify-start space-x-4 space-x-reverse">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                צור ושיבוץ
              </button>
              <button
                type="button"
                onClick={() => setShowCreateLeadModal(false)}
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

export default WorkshopDetails;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import KanbanBoard from '../../components/ui/KanbanBoard';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import leadService from '../../services/leadService';

const statusColumns = [
  { id: 'new', title: 'חדש', color: '#3B82F6' },
  { id: 'contacted', title: 'נוצר קשר', color: '#8B5CF6' },
  { id: 'qualified', title: 'מאומת', color: '#10B981' },
  { id: 'converted', title: 'הומר', color: '#059669' },
  { id: 'lost', title: 'אבוד', color: '#EF4444' },
];

function LeadsList() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'table'
  const [showForm, setShowForm] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    source: 'other',
    sourceDetails: '',
    notes: '',
  });

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await leadService.getLeads();
      setLeads(data.leads.map(lead => ({
        id: lead._id || lead.id,
        title: lead.name,
        description: lead.phone,
        status: lead.status || 'new',
        meta: {
          email: lead.email || '-',
          source: lead.source,
        },
        ...lead,
      })));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedLead) {
        await leadService.updateLead(selectedLead.id, formData);
      } else {
        await leadService.createLead(formData);
      }
      await loadLeads();
      resetForm();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (lead) => {
    setSelectedLead(lead);
    setFormData({
      name: lead.name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      source: lead.source || 'other',
      sourceDetails: lead.sourceDetails || '',
      notes: lead.notes || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק ליד זה?')) {
      return;
    }
    try {
      await leadService.deleteLead(id);
      await loadLeads();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleItemClick = (item) => {
    navigate(`/leads/${item.id}/interactions`);
  };

  const handleItemMove = async (itemId, newStatus) => {
    try {
      await leadService.updateLead(itemId, { status: newStatus });
      await loadLeads();
    } catch (err) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      source: 'other',
      sourceDetails: '',
      notes: '',
    });
    setSelectedLead(null);
    setShowForm(false);
  };

  const sourceLabels = {
    landing_page: 'דף נחיתה',
    referral: 'המלצה',
    social_media: 'רשתות חברתיות',
    advertisement: 'פרסום',
    phone_call: 'שיחה טלפונית',
    other: 'אחר',
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">טוען לידים...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">ניהול לידים</h1>
          <div className="flex space-x-4 space-x-reverse">
            <button
              onClick={() => setViewMode(viewMode === 'kanban' ? 'table' : 'kanban')}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {viewMode === 'kanban' ? 'תצוגת טבלה' : 'תצוגת קנבן'}
            </button>
            <Button
              onClick={() => setShowForm(true)}
              variant="primary"
            >
              הוסף ליד
            </Button>
          </div>
        </div>

        {error && (
          <Card className="bg-red-50 border-red-200">
            <p className="text-red-600">{error}</p>
          </Card>
        )}

        {viewMode === 'kanban' ? (
          <KanbanBoard
            columns={statusColumns}
            items={leads}
            onItemMove={handleItemMove}
            onItemClick={handleItemClick}
            allowStatusChange={true}
          />
        ) : (
          <DataTable
            columns={[
              { key: 'name', label: 'שם', sortable: true },
              { key: 'email', label: 'אימייל', sortable: true },
              { key: 'phone', label: 'טלפון', sortable: true },
              {
                key: 'source',
                label: 'מקור',
                render: (value) => sourceLabels[value] || value,
              },
              {
                key: 'status',
                label: 'סטטוס',
                render: (value) => statusColumns.find(col => col.id === value)?.title || value,
              },
              {
                key: 'actions',
                label: 'פעולות',
                render: (value, row) => (
                  <div className="flex space-x-2 space-x-reverse">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/leads/${row.id}/interactions`);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      צפה
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(row);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ערוך
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(row.id);
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      מחק
                    </button>
                  </div>
                ),
              },
            ]}
            data={leads}
            onRowClick={handleEdit}
          />
        )}

        <Modal
          isOpen={showForm}
          onClose={resetForm}
          title={selectedLead ? 'ערוך ליד' : 'ליד חדש'}
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
                {Object.entries(sourceLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
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
                {selectedLead ? 'עדכן' : 'צור'}
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

export default LeadsList;

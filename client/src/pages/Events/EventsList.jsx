import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import eventService from '../../services/eventService';
import campaignService from '../../services/campaignService';
import customerService from '../../services/customerService';
import leadService from '../../services/leadService';
import userService from '../../services/userService';
import { formatDate, formatCurrency } from '../../utils/configUtils';
import { useBusinessConfig } from '../../context/BusinessConfigContext';

function EventsList() {
  const navigate = useNavigate();
  const { config } = useBusinessConfig();
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'conference',
    description: '',
    organizer: '',
    startDate: '',
    endDate: '',
    location: '',
    onlineLink: '',
    isOnline: false,
    price: '',
    capacity: '',
    speakers: [],
    agenda: [],
    tags: [],
    status: 'draft',
    registrationDeadline: '',
  });
  const [speakerInput, setSpeakerInput] = useState({ name: '', title: '', bio: '' });
  const [agendaItem, setAgendaItem] = useState({ time: '', title: '', description: '', speaker: '' });
  const [tagInput, setTagInput] = useState('');
  const [participantData, setParticipantData] = useState({ customerId: '', leadId: '', amountPaid: '', notes: '' });
  const [filters, setFilters] = useState({ type: '', status: '', search: '' });

  useEffect(() => {
    loadEvents();
    loadUsers();
    loadCustomers();
    loadLeads();
  }, [filters]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await eventService.getEvents(filters);
      setEvents(data.events || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await userService.getUsers();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Failed to load users:', err);
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

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      const eventData = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        capacity: parseInt(formData.capacity),
        startDate: formData.startDate,
        endDate: formData.endDate,
        registrationDeadline: formData.registrationDeadline || undefined,
        organizer: formData.organizer,
      };

      await eventService.createEvent(eventData);
      await loadEvents();
      setShowForm(false);
      resetForm();
    } catch (err) {
      setError(err.message || 'שגיאה ביצירת אירוע');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'conference',
      description: '',
      organizer: '',
      startDate: '',
      endDate: '',
      location: '',
      onlineLink: '',
      isOnline: false,
      price: '',
      capacity: '',
      speakers: [],
      agenda: [],
      tags: [],
      status: 'draft',
      registrationDeadline: '',
    });
    setSpeakerInput({ name: '', title: '', bio: '' });
    setAgendaItem({ time: '', title: '', description: '', speaker: '' });
    setTagInput('');
  };

  const addSpeaker = () => {
    if (speakerInput.name.trim()) {
      setFormData(prev => ({
        ...prev,
        speakers: [...prev.speakers, { ...speakerInput }],
      }));
      setSpeakerInput({ name: '', title: '', bio: '' });
    }
  };

  const removeSpeaker = (index) => {
    setFormData(prev => ({
      ...prev,
      speakers: prev.speakers.filter((_, i) => i !== index),
    }));
  };

  const addAgendaItem = () => {
    if (agendaItem.title.trim()) {
      setFormData(prev => ({
        ...prev,
        agenda: [...prev.agenda, { ...agendaItem }],
      }));
      setAgendaItem({ time: '', title: '', description: '', speaker: '' });
    }
  };

  const removeAgendaItem = (index) => {
    setFormData(prev => ({
      ...prev,
      agenda: prev.agenda.filter((_, i) => i !== index),
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  const handleAddParticipant = async () => {
    try {
      setError(null);
      await eventService.addParticipant(selectedEvent._id, {
        customerId: participantData.customerId || undefined,
        leadId: participantData.leadId || undefined,
        amountPaid: parseFloat(participantData.amountPaid) || 0,
        notes: participantData.notes || undefined,
      });
      await loadEvents();
      setShowParticipantModal(false);
      setParticipantData({ customerId: '', leadId: '', amountPaid: '', notes: '' });
      setSelectedEvent(null);
    } catch (err) {
      setError(err.message || 'שגיאה בהוספת משתתף');
    }
  };

  const handleCreateCampaign = async (campaignData) => {
    try {
      setError(null);
      await campaignService.createCampaign({
        ...campaignData,
        event: selectedEvent._id,
      });
      setShowCampaignModal(false);
      setSelectedEvent(null);
      alert('קמפיין נוצר בהצלחה!');
    } catch (err) {
      setError(err.message || 'שגיאה ביצירת קמפיין');
    }
  };

  const typeLabels = {
    conference: 'כנס',
    webinar: 'וובינר',
    workshop: 'סדנה',
    seminar: 'סמינר',
    meetup: 'מיטאפ',
    other: 'אחר',
  };

  const statusLabels = {
    draft: 'טיוטה',
    published: 'פורסם',
    ongoing: 'מתקיים',
    completed: 'הושלם',
    cancelled: 'בוטל',
  };

  if (loading && events.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">טוען אירועים...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">ניהול אירועים</h1>
          <Button onClick={() => setShowForm(true)}>➕ הוסף אירוע</Button>
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
              <label className="block text-sm font-medium mb-2">סוג</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">כל הסוגים</option>
                {Object.entries(typeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">סטטוס</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">כל הסטטוסים</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">חיפוש</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="חפש..."
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => setFilters({ type: '', status: '', search: '' })}
                variant="neutral"
              >
                נקה פילטרים
              </Button>
            </div>
          </div>
        </Card>

        {/* Events Table */}
        <DataTable
          columns={[
            { key: 'name', label: 'שם אירוע', sortable: true },
            {
              key: 'type',
              label: 'סוג',
              render: (value) => typeLabels[value] || value,
            },
            {
              key: 'organizer',
              label: 'מארגן',
              render: (value) => value?.name || '-',
            },
            {
              key: 'startDate',
              label: 'תאריך התחלה',
              render: (value) => formatDate(value, config),
            },
            {
              key: 'price',
              label: 'מחיר',
              render: (value) => formatCurrency(value, config),
            },
            {
              key: 'enrollmentCount',
              label: 'רשומים',
              render: (value, row) => `${value || 0}/${row.capacity}`,
            },
            {
              key: 'status',
              label: 'סטטוס',
              render: (value) => (
                <span className={`px-2 py-1 rounded text-sm ${value === 'published' ? 'bg-green-100 text-green-800' :
                    value === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                      value === 'completed' ? 'bg-gray-100 text-gray-800' :
                        value === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                  }`}>
                  {statusLabels[value] || value}
                </span>
              ),
            },
            {
              key: 'actions',
              label: 'פעולות',
              render: (value, row) => (
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/events/${row._id}`);
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    צפה
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEvent(row);
                      setShowParticipantModal(true);
                    }}
                    className="text-green-600 hover:text-green-800 text-sm"
                  >
                    הוסף משתתף
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEvent(row);
                      setShowCampaignModal(true);
                    }}
                    className="text-purple-600 hover:text-purple-800 text-sm"
                  >
                    צור קמפיין
                  </button>
                </div>
              ),
            },
          ]}
          data={events}
          onRowClick={(row) => navigate(`/events/${row._id}`)}
        />

        {/* Create Event Modal */}
        <Modal
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            resetForm();
          }}
          title="הוסף אירוע חדש"
          size="large"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">שם אירוע *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">סוג אירוע *</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                >
                  {Object.entries(typeLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">תיאור</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                className="w-full px-4 py-2 border rounded-lg"
                rows="3"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">מארגן *</label>
                <select
                  name="organizer"
                  value={formData.organizer}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                >
                  <option value="">בחר מארגן</option>
                  {users.map(user => (
                    <option key={user._id} value={user._id}>{user.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">סטטוס</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">תאריך התחלה *</label>
                <input
                  type="datetime-local"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">תאריך סיום *</label>
                <input
                  type="datetime-local"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isOnline"
                name="isOnline"
                checked={formData.isOnline}
                onChange={handleFormChange}
                className="w-5 h-5"
              />
              <label htmlFor="isOnline" className="text-sm font-medium">
                אירוע מקוון
              </label>
            </div>

            {formData.isOnline ? (
              <div>
                <label className="block text-sm font-medium mb-2">קישור מקוון</label>
                <input
                  type="url"
                  name="onlineLink"
                  value={formData.onlineLink}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="https://..."
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-2">מיקום</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">מחיר *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border rounded-lg"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">קיבולת *</label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border rounded-lg"
                  min="1"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">תאריך אחרון לרישום</label>
              <input
                type="datetime-local"
                name="registrationDeadline"
                value={formData.registrationDeadline}
                onChange={handleFormChange}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            {/* Speakers */}
            <div>
              <label className="block text-sm font-medium mb-2">מרצים</label>
              <div className="space-y-2 mb-2">
                <input
                  type="text"
                  placeholder="שם מרצה"
                  value={speakerInput.name}
                  onChange={(e) => setSpeakerInput({ ...speakerInput, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="תפקיד/כותרת"
                  value={speakerInput.title}
                  onChange={(e) => setSpeakerInput({ ...speakerInput, title: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <textarea
                  placeholder="ביוגרפיה"
                  value={speakerInput.bio}
                  onChange={(e) => setSpeakerInput({ ...speakerInput, bio: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows="2"
                />
                <Button type="button" onClick={addSpeaker}>הוסף מרצה</Button>
              </div>
              <div className="space-y-1">
                {formData.speakers.map((speaker, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>{speaker.name} {speaker.title && `- ${speaker.title}`}</span>
                    <button type="button" onClick={() => removeSpeaker(idx)} className="text-red-600">×</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium mb-2">תגיות</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="הוסף תגית..."
                  className="flex-1 px-4 py-2 border rounded-lg"
                />
                <Button type="button" onClick={addTag}>הוסף</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, idx) => (
                  <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg flex items-center gap-2">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="text-blue-600">×</button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" onClick={() => { setShowForm(false); resetForm(); }} variant="neutral">
                ביטול
              </Button>
              <Button type="submit">צור אירוע</Button>
            </div>
          </form>
        </Modal>

        {/* Add Participant Modal */}
        <Modal
          isOpen={showParticipantModal}
          onClose={() => {
            setShowParticipantModal(false);
            setParticipantData({ customerId: '', leadId: '', amountPaid: '', notes: '' });
            setSelectedEvent(null);
          }}
          title="הוסף משתתף לאירוע"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">לקוח</label>
              <select
                value={participantData.customerId}
                onChange={(e) => setParticipantData({ ...participantData, customerId: e.target.value, leadId: '' })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">בחר לקוח</option>
                {customers.map(customer => (
                  <option key={customer._id} value={customer._id}>{customer.name} ({customer.email})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">או ליד</label>
              <select
                value={participantData.leadId}
                onChange={(e) => setParticipantData({ ...participantData, leadId: e.target.value, customerId: '' })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">בחר ליד</option>
                {leads.map(lead => (
                  <option key={lead._id} value={lead._id}>{lead.name} ({lead.email})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">סכום ששולם</label>
              <input
                type="number"
                value={participantData.amountPaid}
                onChange={(e) => setParticipantData({ ...participantData, amountPaid: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">הערות</label>
              <textarea
                value={participantData.notes}
                onChange={(e) => setParticipantData({ ...participantData, notes: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                rows="3"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                onClick={() => {
                  setShowParticipantModal(false);
                  setParticipantData({ customerId: '', leadId: '', amountPaid: '', notes: '' });
                  setSelectedEvent(null);
                }}
                variant="neutral"
              >
                ביטול
              </Button>
              <Button onClick={handleAddParticipant}>הוסף משתתף</Button>
            </div>
          </div>
        </Modal>

        {/* Create Campaign Modal */}
        <Modal
          isOpen={showCampaignModal}
          onClose={() => {
            setShowCampaignModal(false);
            setSelectedEvent(null);
          }}
          title={`צור קמפיין לאירוע: ${selectedEvent?.name || ''}`}
          size="large"
        >
          <CampaignForm
            event={selectedEvent}
            onSubmit={handleCreateCampaign}
            onCancel={() => {
              setShowCampaignModal(false);
              setSelectedEvent(null);
            }}
          />
        </Modal>
      </div>
    </DashboardLayout>
  );
}

// Simple Campaign Form Component
function CampaignForm({ event, onSubmit, onCancel }) {
  const [campaignData, setCampaignData] = useState({
    name: event ? `קמפיין - ${event.name}` : '',
    description: '',
    startDate: event?.startDate ? new Date(event.startDate).toISOString().slice(0, 16) : '',
    endDate: event?.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : '',
    budget: '',
    marketingChannels: [],
    status: 'draft',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      const channels = campaignData.marketingChannels;
      if (checked) {
        setCampaignData({ ...campaignData, marketingChannels: [...channels, value] });
      } else {
        setCampaignData({ ...campaignData, marketingChannels: channels.filter(c => c !== value) });
      }
    } else {
      setCampaignData({ ...campaignData, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...campaignData,
      budget: campaignData.budget ? parseFloat(campaignData.budget) : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">שם קמפיין *</label>
        <input
          type="text"
          name="name"
          value={campaignData.name}
          onChange={handleChange}
          className="w-full px-4 py-2 border rounded-lg"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">תיאור</label>
        <textarea
          name="description"
          value={campaignData.description}
          onChange={handleChange}
          className="w-full px-4 py-2 border rounded-lg"
          rows="3"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">תאריך התחלה *</label>
          <input
            type="datetime-local"
            name="startDate"
            value={campaignData.startDate}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">תאריך סיום</label>
          <input
            type="datetime-local"
            name="endDate"
            value={campaignData.endDate}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">תקציב</label>
        <input
          type="number"
          name="budget"
          value={campaignData.budget}
          onChange={handleChange}
          className="w-full px-4 py-2 border rounded-lg"
          min="0"
          step="0.01"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">ערוצי שיווק</label>
        <div className="space-y-2">
          {['facebook', 'instagram', 'google_ads', 'email', 'whatsapp', 'other'].map(channel => (
            <label key={channel} className="flex items-center gap-2">
              <input
                type="checkbox"
                value={channel}
                checked={campaignData.marketingChannels.includes(channel)}
                onChange={handleChange}
                className="w-5 h-5"
              />
              <span>{channel}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" onClick={onCancel} variant="neutral">ביטול</Button>
        <Button type="submit">צור קמפיין</Button>
      </div>
    </form>
  );
}

export default EventsList;

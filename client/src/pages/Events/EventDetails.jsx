import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import eventService from '../../services/eventService';
import customerService from '../../services/customerService';
import leadService from '../../services/leadService';
import campaignService from '../../services/campaignService';
import { formatDate, formatCurrency } from '../../utils/configUtils';
import { useBusinessConfig } from '../../context/BusinessConfigContext';

function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { config } = useBusinessConfig();
  const [event, setEvent] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [participantData, setParticipantData] = useState({
    customerId: '',
    leadId: '',
    amountPaid: '',
    notes: '',
  });
  const [campaignData, setCampaignData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    budget: '',
    marketingChannels: [],
    status: 'draft',
  });

  useEffect(() => {
    if (id) {
      loadEvent();
      loadCustomers();
      loadLeads();
    }
  }, [id]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const data = await eventService.getEventById(id);
      setEvent(data.event);
      setEnrollments(data.event.enrollments || []);
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

  const handleAddParticipant = async () => {
    try {
      setError(null);
      await eventService.addParticipant(id, {
        customerId: participantData.customerId || undefined,
        leadId: participantData.leadId || undefined,
        amountPaid: parseFloat(participantData.amountPaid) || 0,
        notes: participantData.notes || undefined,
      });
      await loadEvent();
      setShowParticipantModal(false);
      setParticipantData({ customerId: '', leadId: '', amountPaid: '', notes: '' });
    } catch (err) {
      setError(err.message || 'שגיאה בהוספת משתתף');
    }
  };

  const handleUpdateEnrollment = async (enrollmentId, updateData) => {
    try {
      await eventService.updateEnrollment(id, enrollmentId, updateData);
      await loadEvent();
    } catch (err) {
      setError(err.message || 'שגיאה בעדכון רישום');
    }
  };

  const handleRemoveParticipant = async (enrollmentId) => {
    if (!window.confirm('האם אתה בטוח שברצונך להסיר משתתף זה?')) {
      return;
    }
    try {
      await eventService.removeParticipant(id, enrollmentId);
      await loadEvent();
    } catch (err) {
      setError(err.message || 'שגיאה בהסרת משתתף');
    }
  };

  const handleCreateCampaign = async () => {
    try {
      setError(null);
      await campaignService.createCampaign({
        ...campaignData,
        event: id,
        budget: campaignData.budget ? parseFloat(campaignData.budget) : undefined,
      });
      setShowCampaignModal(false);
      setCampaignData({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        budget: '',
        marketingChannels: [],
        status: 'draft',
      });
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

  const enrollmentStatusLabels = {
    pending: 'ממתין',
    confirmed: 'מאושר',
    attended: 'השתתף',
    cancelled: 'בוטל',
    no_show: 'לא הגיע',
  };

  const paymentStatusLabels = {
    pending: 'ממתין',
    partial: 'חלקי',
    completed: 'שולם',
    refunded: 'הוחזר',
    cancelled: 'בוטל',
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">טוען פרטי אירוע...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !event) {
    return (
      <DashboardLayout>
        <Card className="bg-red-50 border-red-200">
          <p className="text-red-600">{error}</p>
          <Button onClick={() => navigate('/events')} className="mt-4">
            חזור לרשימת אירועים
          </Button>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <button
              onClick={() => navigate('/events')}
              className="text-blue-600 hover:text-blue-800 mb-4"
            >
              ← חזור לרשימת אירועים
            </button>
            <h1 className="text-3xl font-bold text-gray-900">{event?.name}</h1>
            <p className="text-gray-600 mt-2">{event?.description}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowParticipantModal(true)}>
              ➕ הוסף משתתף
            </Button>
            <Button onClick={() => setShowCampaignModal(true)} variant="success">
              📢 צור קמפיין
            </Button>
          </div>
        </div>

        {error && (
          <Card className="bg-red-50 border-red-200">
            <p className="text-red-600">{error}</p>
          </Card>
        )}

        {/* Event Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <h2 className="text-xl font-semibold mb-4">פרטי אירוע</h2>
            <div className="space-y-3">
              <div>
                <span className="font-medium">סוג:</span> {typeLabels[event?.type] || event?.type}
              </div>
              <div>
                <span className="font-medium">מארגן:</span> {event?.organizer?.name || '-'}
              </div>
              <div>
                <span className="font-medium">תאריך התחלה:</span>{' '}
                {formatDate(event?.startDate, config)}
              </div>
              <div>
                <span className="font-medium">תאריך סיום:</span>{' '}
                {formatDate(event?.endDate, config)}
              </div>
              {event?.isOnline ? (
                <div>
                  <span className="font-medium">קישור מקוון:</span>{' '}
                  <a href={event?.onlineLink} target="_blank" rel="noopener noreferrer" className="text-blue-600">
                    {event?.onlineLink}
                  </a>
                </div>
              ) : (
                <div>
                  <span className="font-medium">מיקום:</span> {event?.location || '-'}
                </div>
              )}
              <div>
                <span className="font-medium">מחיר:</span> {formatCurrency(event?.price, config)}
              </div>
              <div>
                <span className="font-medium">קיבולת:</span> {event?.enrollmentCount || 0} / {event?.capacity}
              </div>
              <div>
                <span className="font-medium">סטטוס:</span>{' '}
                <span className={`px-2 py-1 rounded text-sm ${event?.status === 'published' ? 'bg-green-100 text-green-800' :
                  event?.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                    event?.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                      event?.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                  }`}>
                  {statusLabels[event?.status] || event?.status}
                </span>
              </div>
            </div>
          </Card>

          {/* Speakers */}
          {event?.speakers && event.speakers.length > 0 && (
            <Card>
              <h2 className="text-xl font-semibold mb-4">מרצים</h2>
              <div className="space-y-3">
                {event.speakers.map((speaker, idx) => (
                  <div key={idx} className="border-b pb-3">
                    <div className="font-medium">{speaker.name}</div>
                    {speaker.title && <div className="text-sm text-gray-600">{speaker.title}</div>}
                    {speaker.bio && <div className="text-sm text-gray-500 mt-1">{speaker.bio}</div>}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Agenda */}
        {event?.agenda && event.agenda.length > 0 && (
          <Card>
            <h2 className="text-xl font-semibold mb-4">אג'נדה</h2>
            <div className="space-y-3">
              {event.agenda.map((item, idx) => (
                <div key={idx} className="border-b pb-3">
                  {item.time && <div className="font-medium text-blue-600">{item.time}</div>}
                  <div className="font-medium">{item.title}</div>
                  {item.description && <div className="text-sm text-gray-600">{item.description}</div>}
                  {item.speaker && <div className="text-sm text-gray-500">מרצה: {item.speaker}</div>}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Participants */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">משתתפים ({enrollments.length})</h2>
          <DataTable
            columns={[
              {
                key: 'participant',
                label: 'משתתף',
                render: (value, row) => {
                  if (row.customer) {
                    return `${row.customer.name} (${row.customer.email})`;
                  }
                  if (row.lead) {
                    return `${row.lead.name} (${row.lead.email})`;
                  }
                  return '-';
                },
              },
              {
                key: 'registeredAt',
                label: 'תאריך רישום',
                render: (value) => formatDate(value, config),
              },
              {
                key: 'status',
                label: 'סטטוס',
                render: (value, row) => (
                  <select
                    value={value}
                    onChange={(e) => handleUpdateEnrollment(row._id, { status: e.target.value })}
                    className="px-2 py-1 border rounded text-sm"
                  >
                    {Object.entries(enrollmentStatusLabels).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                ),
              },
              {
                key: 'paymentStatus',
                label: 'סטטוס תשלום',
                render: (value) => (
                  <span className={`px-2 py-1 rounded text-sm ${value === 'completed' ? 'bg-green-100 text-green-800' :
                    value === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                      value === 'refunded' ? 'bg-blue-100 text-blue-800' :
                        value === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                    }`}>
                    {paymentStatusLabels[value] || value}
                  </span>
                ),
              },
              {
                key: 'amountPaid',
                label: 'סכום ששולם',
                render: (value, row) => `${formatCurrency(value, config)} / ${formatCurrency(event?.price, config)}`,
              },
              {
                key: 'actions',
                label: 'פעולות',
                render: (value, row) => (
                  <button
                    onClick={() => handleRemoveParticipant(row._id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    הסר
                  </button>
                ),
              },
            ]}
            data={enrollments}
          />
        </Card>

        {/* Add Participant Modal */}
        <Modal
          isOpen={showParticipantModal}
          onClose={() => {
            setShowParticipantModal(false);
            setParticipantData({ customerId: '', leadId: '', amountPaid: '', notes: '' });
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
                  <option key={customer._id} value={customer._id}>
                    {customer.name} ({customer.email})
                  </option>
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
                  <option key={lead._id} value={lead._id}>
                    {lead.name} ({lead.email})
                  </option>
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
            setCampaignData({
              name: '',
              description: '',
              startDate: '',
              endDate: '',
              budget: '',
              marketingChannels: [],
              status: 'draft',
            });
          }}
          title={`צור קמפיין לאירוע: ${event?.name || ''}`}
          size="large"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">שם קמפיין *</label>
              <input
                type="text"
                value={campaignData.name}
                onChange={(e) => setCampaignData({ ...campaignData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">תיאור</label>
              <textarea
                value={campaignData.description}
                onChange={(e) => setCampaignData({ ...campaignData, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                rows="3"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">תאריך התחלה *</label>
                <input
                  type="datetime-local"
                  value={campaignData.startDate}
                  onChange={(e) => setCampaignData({ ...campaignData, startDate: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">תאריך סיום</label>
                <input
                  type="datetime-local"
                  value={campaignData.endDate}
                  onChange={(e) => setCampaignData({ ...campaignData, endDate: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">תקציב</label>
              <input
                type="number"
                value={campaignData.budget}
                onChange={(e) => setCampaignData({ ...campaignData, budget: e.target.value })}
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
                      checked={campaignData.marketingChannels.includes(channel)}
                      onChange={(e) => {
                        const channels = campaignData.marketingChannels;
                        if (e.target.checked) {
                          setCampaignData({ ...campaignData, marketingChannels: [...channels, channel] });
                        } else {
                          setCampaignData({ ...campaignData, marketingChannels: channels.filter(c => c !== channel) });
                        }
                      }}
                      className="w-5 h-5"
                    />
                    <span>{channel}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                onClick={() => {
                  setShowCampaignModal(false);
                  setCampaignData({
                    name: '',
                    description: '',
                    startDate: '',
                    endDate: '',
                    budget: '',
                    marketingChannels: [],
                    status: 'draft',
                  });
                }}
                variant="neutral"
              >
                ביטול
              </Button>
              <Button onClick={handleCreateCampaign}>צור קמפיין</Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}

export default EventDetails;

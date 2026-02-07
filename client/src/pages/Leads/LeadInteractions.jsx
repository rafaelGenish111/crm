import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Timeline from '../../components/ui/Timeline';
import Modal from '../../components/ui/Modal';
import { PhoneIcon, EmailIcon, MessageIcon, DocumentIcon, NoteIcon, HandshakeIcon } from '../../components/ui/Icons';
import leadService from '../../services/leadService';
import { formatDate } from '../../utils/configUtils';
import { useBusinessConfig } from '../../context/BusinessConfigContext';
import { useAuth } from '../../context/AuthContext';

function LeadInteractions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { config } = useBusinessConfig();
  const { user } = useAuth();
  const [lead, setLead] = useState(null);
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddInteractionModal, setShowAddInteractionModal] = useState(false);
  const [interactionData, setInteractionData] = useState({
    type: 'call',
    title: '',
    description: '',
    content: '',
    scheduledAt: '',
  });

  useEffect(() => {
    loadLeadData();
  }, [id]);

  const loadLeadData = async () => {
    try {
      setLoading(true);
      const data = await leadService.getLeadById(id);
      setLead(data.lead);
      setInteractions(data.interactions || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddInteraction = async (e) => {
    e.preventDefault();
    try {
      const response = await leadService.createInteraction(id, interactionData);
      await loadLeadData();
      setShowAddInteractionModal(false);
      setInteractionData({
        type: 'call',
        title: '',
        description: '',
        content: '',
        scheduledAt: '',
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleConvertToCustomer = async () => {
    if (!window.confirm('האם אתה בטוח שברצונך להמיר ליד זה ללקוח?')) {
      return;
    }
    try {
      await leadService.convertToCustomer(id);
      navigate('/customers');
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">טוען פרטי ליד...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !lead) {
    return (
      <DashboardLayout>
        <Card className="bg-red-50 border-red-200">
          <p className="text-red-600">{error || 'ליד לא נמצא'}</p>
        </Card>
      </DashboardLayout>
    );
  }

  const interactionItems = interactions.map(interaction => ({
    title: interaction.title,
    description: interaction.description,
    date: interaction.createdAt,
    color: getInteractionColor(interaction.type),
    icon: getInteractionIcon(interaction.type),
    meta: {
      סוג: getInteractionTypeLabel(interaction.type),
      מבצע: interaction.performedBy?.name || '-',
    },
  }));

  function getInteractionColor(type) {
    const colors = {
      call: '#3B82F6',
      whatsapp: '#25D366',
      email: '#8B5CF6',
      meeting: '#10B981',
      document: '#F59E0B',
      note: '#6B7280',
    };
    return colors[type] || '#3B82F6';
  }

  function getInteractionIcon(type) {
    const icons = {
      call: PhoneIcon,
      whatsapp: MessageIcon,
      email: EmailIcon,
      meeting: HandshakeIcon,
      document: DocumentIcon,
      note: NoteIcon,
    };
    const IconComponent = icons[type] || NoteIcon;
    return <IconComponent className="w-5 h-5" />;
  }

  function getInteractionTypeLabel(type) {
    const labels = {
      call: 'שיחה',
      whatsapp: 'ווצאפ',
      email: 'אימייל',
      meeting: 'פגישה',
      document: 'מסמך',
      note: 'הערה',
    };
    return labels[type] || type;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{lead.name}</h1>
            <p className="text-gray-600 mt-2">{lead.phone}</p>
            {lead.email && <p className="text-gray-600">{lead.email}</p>}
          </div>
          <div className="flex space-x-4 space-x-reverse">
            <button
              onClick={() => setShowAddInteractionModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              הוסף אינטראקציה
            </button>
            {lead.status !== 'converted' && (
              <button
                onClick={handleConvertToCustomer}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                המר ללקוח
              </button>
            )}
            <button
              onClick={() => navigate('/leads')}
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
          <h2 className="text-xl font-semibold mb-4">אינטראקציות</h2>
          {interactionItems.length > 0 ? (
            <Timeline items={interactionItems} />
          ) : (
            <p className="text-gray-500 text-center py-8">אין אינטראקציות עדיין</p>
          )}
        </Card>

        {/* Add Interaction Modal */}
        <Modal
          isOpen={showAddInteractionModal}
          onClose={() => setShowAddInteractionModal(false)}
          title="הוסף אינטראקציה"
        >
          <form onSubmit={handleAddInteraction} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">סוג אינטראקציה</label>
              <select
                value={interactionData.type}
                onChange={(e) => setInteractionData({ ...interactionData, type: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="call">שיחה</option>
                <option value="whatsapp">ווצאפ</option>
                <option value="email">אימייל</option>
                <option value="meeting">פגישה</option>
                <option value="document">מסמך</option>
                <option value="note">הערה</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">כותרת *</label>
              <input
                type="text"
                value={interactionData.title}
                onChange={(e) => setInteractionData({ ...interactionData, title: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">תיאור</label>
              <textarea
                value={interactionData.description}
                onChange={(e) => setInteractionData({ ...interactionData, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                rows="3"
              />
            </div>
            {(interactionData.type === 'whatsapp' || interactionData.type === 'email') && (
              <div>
                <label className="block text-sm font-medium mb-2">תוכן ההודעה</label>
                <textarea
                  value={interactionData.content}
                  onChange={(e) => setInteractionData({ ...interactionData, content: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows="4"
                />
              </div>
            )}
            {(interactionData.type === 'call' || interactionData.type === 'meeting') && (
              <div>
                <label className="block text-sm font-medium mb-2">תאריך מתוכנן</label>
                <input
                  type="datetime-local"
                  value={interactionData.scheduledAt}
                  onChange={(e) => setInteractionData({ ...interactionData, scheduledAt: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            )}
            <div className="flex justify-start space-x-4 space-x-reverse">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                שמור
              </button>
              <button
                type="button"
                onClick={() => setShowAddInteractionModal(false)}
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

export default LeadInteractions;

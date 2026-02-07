import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import campaignService from '../../services/campaignService';
import { formatDate } from '../../utils/configUtils';
import { useBusinessConfig } from '../../context/BusinessConfigContext';

function CampaignsList() {
  const navigate = useNavigate();
  const { config } = useBusinessConfig();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [embedCode, setEmbedCode] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const data = await campaignService.getCampaigns();
      setCampaigns(data.campaigns);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק את הקמפיין?')) {
      return;
    }
    try {
      await campaignService.deleteCampaign(id);
      await loadCampaigns();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGetEmbedCode = async (id) => {
    try {
      const response = await campaignService.getEmbedCode(id);
      setEmbedCode(response.embedCode);
      setSelectedCampaignId(id);
      setShowEmbedModal(true);
    } catch (err) {
      setError(err.message || 'שגיאה בקבלת קוד הטמעה');
    }
  };

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(embedCode).then(() => {
      alert('קוד ההטמעה הועתק ללוח');
    }).catch(() => {
      alert('שגיאה בהעתקה');
    });
  };

  const statusLabels = {
    draft: 'טיוטה',
    active: 'פעיל',
    paused: 'מושהה',
    completed: 'הושלם',
    cancelled: 'בוטל',
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">טוען קמפיינים...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">ניהול קמפיינים</h1>
          <button
            onClick={() => navigate('/campaigns/new')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            צור קמפיין חדש
          </button>
        </div>

        {error && (
          <Card className="bg-red-50 border-red-200">
            <p className="text-red-600">{error}</p>
          </Card>
        )}

        <DataTable
          columns={[
            { key: 'name', label: 'שם קמפיין', sortable: true },
            {
              key: 'status',
              label: 'סטטוס',
              render: (value) => (
                <span className={`px-2 py-1 rounded text-sm ${value === 'active' ? 'bg-green-100 text-green-800' :
                  value === 'draft' ? 'bg-gray-100 text-gray-800' :
                    value === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                      value === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                  }`}>
                  {statusLabels[value] || value}
                </span>
              ),
            },
            {
              key: 'startDate',
              label: 'תאריך התחלה',
              render: (value) => formatDate(value, config),
            },
            {
              key: 'budget',
              label: 'תקציב',
              render: (value) => value ? `${value.toLocaleString()} ₪` : '-',
            },
            {
              key: 'actions',
              label: 'פעולות',
              render: (value, row) => (
                <div className="flex gap-2">
                  {row.popup?.enabled && (
                    <button
                      onClick={() => handleGetEmbedCode(row._id)}
                      className="text-purple-600 hover:text-purple-800 text-sm"
                      title="קוד הטמעה"
                    >
                      🔗
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/campaigns/${row._id}/analytics`)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                    title="אנליטיקס"
                  >
                    📊
                  </button>
                  <button
                    onClick={() => navigate(`/campaigns/${row._id}/edit`)}
                    className="text-green-600 hover:text-green-800 text-sm"
                    title="עריכה"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(row._id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                    title="מחיקה"
                  >
                    🗑️
                  </button>
                </div>
              ),
            },
          ]}
          data={campaigns}
        />

        {/* Embed Code Modal */}
        <Modal
          isOpen={showEmbedModal}
          onClose={() => setShowEmbedModal(false)}
          title="קוד הטמעה לפופאפ"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              העתק את הקוד הבא והדבק אותו ב-HTML של האתר שבו תרצה להציג את הפופאפ:
            </p>
            <div className="relative">
              <textarea
                value={embedCode}
                readOnly
                className="w-full px-4 py-2 border rounded-lg font-mono text-sm bg-gray-50"
                rows="6"
                onClick={(e) => e.target.select()}
              />
              <button
                onClick={copyEmbedCode}
                className="absolute top-2 left-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                העתק
              </button>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-2">
              <p className="text-sm text-yellow-800">
                <strong>הערה:</strong> ודא שהקמפיין פעיל ומוגדר עם פופאפ כדי שהקוד יעבוד.
              </p>
              <p className="text-sm text-yellow-800">
                <strong>טרגטינג לפי לקוח/ליד:</strong> כדי לזהות משתמש ספציפי, הוסף query parameters ל-URL:
              </p>
              <code className="block text-xs bg-yellow-100 p-2 rounded mt-2">
                ?customerId=ID_של_הלקוח<br />
                ?leadId=ID_של_הליד
              </code>
              <p className="text-sm text-yellow-800 mt-2">
                <strong>טרגטינג לפי קורס/סדנה:</strong> הפופאפ יוצג אוטומטית למשתתפים הרשומים לקורסים/סדנאות שנבחרו בטרגטינג, בהתבסס על ה-customerId/leadId שמועבר.
              </p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowEmbedModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                סגור
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}

export default CampaignsList;

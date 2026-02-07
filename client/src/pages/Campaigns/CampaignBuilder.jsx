import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import TargetingForm from '../../components/Campaigns/TargetingForm';
import campaignService from '../../services/campaignService';
import customerService from '../../services/customerService';
import leadService from '../../services/leadService';
import courseService from '../../services/courseService';
import workshopService from '../../services/workshopService';
import { useBusinessConfig } from '../../context/BusinessConfigContext';
import { useAuth } from '../../context/AuthContext';

function CampaignBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { config } = useBusinessConfig();
  const { user } = useAuth();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [courses, setCourses] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [showPopupForm, setShowPopupForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetAudience: {
      ageRange: { min: '', max: '' },
      interests: [],
      location: '',
    },
    marketingChannels: [],
    budget: '',
    startDate: '',
    endDate: '',
    status: 'draft',
    popup: {
      enabled: false,
      title: '',
      message: '',
      imageUrl: '',
      ctaText: 'לחץ כאן',
      ctaUrl: '',
      position: 'center',
      delay: 3000,
      backgroundColor: '#ffffff',
      textColor: '#000000',
      buttonColor: '#007bff',
      buttonTextColor: '#ffffff',
    },
    targeting: {
      customerIds: [],
      leadIds: [],
      courseIds: [],
      workshopIds: [],
      allowedDomains: [],
      showToAll: false,
    },
  });

  const marketingChannelsOptions = [
    { value: 'facebook', label: 'פייסבוק' },
    { value: 'instagram', label: 'אינסטגרם' },
    { value: 'google_ads', label: 'גוגל אדס' },
    { value: 'email', label: 'אימייל' },
    { value: 'whatsapp', label: 'וואטסאפ' },
    { value: 'other', label: 'אחר' },
  ];

  useEffect(() => {
    loadCustomersAndLeads();
    loadCoursesAndWorkshops();
    if (isEditMode) {
      loadCampaign();
    }
  }, [id]);

  const loadCustomersAndLeads = async () => {
    try {
      const [customersData, leadsData] = await Promise.all([
        customerService.getCustomers(),
        leadService.getLeads(),
      ]);
      setCustomers(customersData.customers || []);
      setLeads(leadsData.leads || []);
    } catch (err) {
      console.error('Error loading customers/leads:', err);
    }
  };

  const loadCoursesAndWorkshops = async () => {
    try {
      const [coursesData, workshopsData] = await Promise.all([
        courseService.getCourses(),
        workshopService.getWorkshops(),
      ]);
      setCourses(coursesData.courses || []);
      setWorkshops(workshopsData.workshops || []);
    } catch (err) {
      console.error('Error loading courses/workshops:', err);
    }
  };

  const loadCampaign = async () => {
    try {
      setLoading(true);
      const response = await campaignService.getCampaignById(id);
      const campaign = response.campaign;
      setFormData({
        name: campaign.name || '',
        description: campaign.description || '',
        targetAudience: campaign.targetAudience || {
          ageRange: { min: '', max: '' },
          interests: [],
          location: '',
        },
        marketingChannels: campaign.marketingChannels || [],
        budget: campaign.budget || '',
        startDate: campaign.startDate ? new Date(campaign.startDate).toISOString().split('T')[0] : '',
        endDate: campaign.endDate ? new Date(campaign.endDate).toISOString().split('T')[0] : '',
        status: campaign.status || 'draft',
        popup: campaign.popup || {
          enabled: false,
          title: '',
          message: '',
          imageUrl: '',
          ctaText: 'לחץ כאן',
          ctaUrl: '',
          position: 'center',
          delay: 3000,
          backgroundColor: '#ffffff',
          textColor: '#000000',
          buttonColor: '#007bff',
          buttonTextColor: '#ffffff',
        },
        targeting: campaign.targeting || {
          customerIds: [],
          leadIds: [],
          courseIds: [],
          workshopIds: [],
          allowedDomains: [],
          showToAll: false,
        },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTargetingChange = (updates) => {
    setFormData(prev => ({
      ...prev,
      ...updates,
    }));
  };

  const handleChannelToggle = (channel) => {
    const current = formData.marketingChannels || [];
    const updated = current.includes(channel)
      ? current.filter(c => c !== channel)
      : [...current, channel];
    handleInputChange('marketingChannels', updated);
  };

  const handlePopupChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      popup: {
        ...prev.popup,
        [field]: value,
      },
    }));
  };

  const handleTargetingChangePopup = (field, value) => {
    setFormData(prev => ({
      ...prev,
      targeting: {
        ...prev.targeting,
        [field]: value,
      },
    }));
  };

  const handleAddDomain = (domain) => {
    if (domain && !formData.targeting.allowedDomains.includes(domain)) {
      handleTargetingChangePopup('allowedDomains', [...formData.targeting.allowedDomains, domain]);
    }
  };

  const handleRemoveDomain = (domain) => {
    handleTargetingChangePopup('allowedDomains', formData.targeting.allowedDomains.filter(d => d !== domain));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const submitData = {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : 0,
        startDate: formData.startDate ? new Date(formData.startDate) : new Date(),
        endDate: formData.endDate ? new Date(formData.endDate) : null,
      };

      if (isEditMode) {
        await campaignService.updateCampaign(id, submitData);
      } else {
        await campaignService.createCampaign(submitData);
      }

      navigate('/campaigns');
    } catch (err) {
      setError(err.message || 'שגיאה בשמירת קמפיין');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">טוען קמפיין...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditMode ? 'עריכת קמפיין' : 'יצירת קמפיין חדש'}
          </h1>
          <button
            onClick={() => navigate('/campaigns')}
            className="text-gray-600 hover:text-gray-800"
          >
            ← חזרה לרשימה
          </button>
        </div>

        {error && (
          <Card className="bg-red-50 border-red-200">
            <p className="text-red-600">{error}</p>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">מידע בסיסי</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">שם קמפיין *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">תיאור</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="4"
                  placeholder="תיאור מפורט של הקמפיין..."
                />
              </div>
            </div>
          </Card>

          {/* Targeting */}
          <TargetingForm formData={formData} onChange={handleTargetingChange} />

          {/* Marketing Channels */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">ערוצי שיווק</h2>
            <div className="flex flex-wrap gap-3">
              {marketingChannelsOptions.map((option) => {
                const isSelected = formData.marketingChannels.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleChannelToggle(option.value)}
                    className={`px-4 py-2 rounded-lg border transition-all ${isSelected
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                      }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Budget & Dates */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">תקציב ותאריכים</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">תקציב (₪)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.budget}
                  onChange={(e) => handleInputChange('budget', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">תאריך התחלה *</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">תאריך סיום</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min={formData.startDate}
                />
              </div>
            </div>
          </Card>

          {/* Popup Configuration */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">פופאפ באתר</h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.popup?.enabled || false}
                  onChange={(e) => handlePopupChange('enabled', e.target.checked)}
                  className="w-5 h-5"
                />
                <span>הפעל פופאפ</span>
              </label>
            </div>

            {formData.popup?.enabled && (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">כותרת</label>
                    <input
                      type="text"
                      value={formData.popup.title || ''}
                      onChange={(e) => handlePopupChange('title', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="כותרת הפופאפ"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">קישור לכפתור</label>
                    <input
                      type="url"
                      value={formData.popup.ctaUrl || ''}
                      onChange={(e) => handlePopupChange('ctaUrl', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">הודעה</label>
                  <textarea
                    value={formData.popup.message || ''}
                    onChange={(e) => handlePopupChange('message', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    placeholder="תוכן הפופאפ"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">כתובת תמונה (URL)</label>
                    <input
                      type="url"
                      value={formData.popup.imageUrl || ''}
                      onChange={(e) => handlePopupChange('imageUrl', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">טקסט כפתור</label>
                    <input
                      type="text"
                      value={formData.popup.ctaText || 'לחץ כאן'}
                      onChange={(e) => handlePopupChange('ctaText', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">מיקום</label>
                    <select
                      value={formData.popup.position || 'center'}
                      onChange={(e) => handlePopupChange('position', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="center">מרכז</option>
                      <option value="bottom-right">פינה ימנית תחתונה</option>
                      <option value="bottom-left">פינה שמאלית תחתונה</option>
                      <option value="top-right">פינה ימנית עליונה</option>
                      <option value="top-left">פינה שמאלית עליונה</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">עיכוב לפני הצגה (מילישניות)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.popup.delay || 3000}
                      onChange={(e) => handlePopupChange('delay', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">צבע רקע</label>
                    <input
                      type="color"
                      value={formData.popup.backgroundColor || '#ffffff'}
                      onChange={(e) => handlePopupChange('backgroundColor', e.target.value)}
                      className="w-full h-10 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">צבע טקסט</label>
                    <input
                      type="color"
                      value={formData.popup.textColor || '#000000'}
                      onChange={(e) => handlePopupChange('textColor', e.target.value)}
                      className="w-full h-10 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">צבע כפתור</label>
                    <input
                      type="color"
                      value={formData.popup.buttonColor || '#007bff'}
                      onChange={(e) => handlePopupChange('buttonColor', e.target.value)}
                      className="w-full h-10 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">צבע טקסט כפתור</label>
                    <input
                      type="color"
                      value={formData.popup.buttonTextColor || '#ffffff'}
                      onChange={(e) => handlePopupChange('buttonTextColor', e.target.value)}
                      className="w-full h-10 border rounded-lg"
                    />
                  </div>
                </div>

                {/* Targeting */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-lg font-semibold mb-4">טרגטינג</h3>
                  <div className="space-y-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.targeting?.showToAll || false}
                        onChange={(e) => handleTargetingChangePopup('showToAll', e.target.checked)}
                        className="w-5 h-5"
                      />
                      <span>הצג לכולם</span>
                    </label>

                    {!formData.targeting?.showToAll && (
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-2">לקוחות ספציפיים</label>
                          <select
                            multiple
                            value={formData.targeting?.customerIds || []}
                            onChange={(e) => {
                              const selected = Array.from(e.target.selectedOptions, option => option.value);
                              handleTargetingChangePopup('customerIds', selected);
                            }}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            size="5"
                          >
                            {customers.map(customer => (
                              <option key={customer._id || customer.id} value={customer._id || customer.id}>
                                {customer.name} - {customer.phone}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">החזק Ctrl/Cmd לבחירה מרובה</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">לידים ספציפיים</label>
                          <select
                            multiple
                            value={formData.targeting?.leadIds || []}
                            onChange={(e) => {
                              const selected = Array.from(e.target.selectedOptions, option => option.value);
                              handleTargetingChangePopup('leadIds', selected);
                            }}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            size="5"
                          >
                            {leads.map(lead => (
                              <option key={lead._id || lead.id} value={lead._id || lead.id}>
                                {lead.name} - {lead.phone}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">החזק Ctrl/Cmd לבחירה מרובה</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">קורסים ספציפיים</label>
                          <p className="text-xs text-gray-500 mb-2">הפופאפ יוצג רק למשתתפים הרשומים לקורסים שנבחרו</p>
                          <select
                            multiple
                            value={formData.targeting?.courseIds || []}
                            onChange={(e) => {
                              const selected = Array.from(e.target.selectedOptions, option => option.value);
                              handleTargetingChangePopup('courseIds', selected);
                            }}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            size="5"
                          >
                            {courses.map(course => (
                              <option key={course._id || course.id} value={course._id || course.id}>
                                {course.name} - {course.instructor?.name || 'ללא מדריך'}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">החזק Ctrl/Cmd לבחירה מרובה</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">סדנאות ספציפיות</label>
                          <p className="text-xs text-gray-500 mb-2">הפופאפ יוצג רק למשתתפים הרשומים לסדנאות שנבחרו</p>
                          <select
                            multiple
                            value={formData.targeting?.workshopIds || []}
                            onChange={(e) => {
                              const selected = Array.from(e.target.selectedOptions, option => option.value);
                              handleTargetingChangePopup('workshopIds', selected);
                            }}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            size="5"
                          >
                            {workshops.map(workshop => (
                              <option key={workshop._id || workshop.id} value={workshop._id || workshop.id}>
                                {workshop.name} - {workshop.instructor?.name || 'ללא מדריך'}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">החזק Ctrl/Cmd לבחירה מרובה</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">דומיינים מורשים</label>
                          <div className="flex gap-2 mb-2">
                            <input
                              type="text"
                              placeholder="example.com"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddDomain(e.target.value.trim());
                                  e.target.value = '';
                                }
                              }}
                              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                const input = e.target.previousElementSibling;
                                handleAddDomain(input.value.trim());
                                input.value = '';
                              }}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              הוסף
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {formData.targeting?.allowedDomains?.map((domain, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 bg-gray-100 rounded-lg flex items-center gap-2"
                              >
                                {domain}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDomain(domain)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Status (only for edit mode) */}
          {isEditMode && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">סטטוס</h2>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full md:w-64 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="draft">טיוטה</option>
                <option value="active">פעיל</option>
                <option value="paused">מושהה</option>
                <option value="completed">הושלם</option>
                <option value="cancelled">בוטל</option>
              </select>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-start space-x-4 space-x-reverse">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'שומר...' : isEditMode ? 'עדכן קמפיין' : 'צור קמפיין'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/campaigns')}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

export default CampaignBuilder;

import { useState, useEffect } from 'react';
import { useBusinessConfig } from '../../context/BusinessConfigContext';

import DashboardLayout from '../../components/Layout/DashboardLayout'

function BusinessConfig() {
  const { config, loading, error, updateConfig } = useBusinessConfig();
  const [formData, setFormData] = useState({
    name: '',
    nameEn: '',
    type: 'school',
    description: '',
    logo: '',
    favicon: '',
    contact: {
      phone: '',
      email: '',
      address: '',
      website: '',
    },
    branding: {
      primaryColor: '#3B82F6',
      secondaryColor: '#8B5CF6',
      accentColor: '#10B981',
      fontFamily: 'system-ui',
      rtl: true,
    },
    features: {
      whatsappEnabled: true,
      emailEnabled: true,
      paymentEnabled: true,
      aiBotEnabled: true,
      campaignsEnabled: true,
    },
    settings: {
      currency: 'ILS',
      currencySymbol: '₪',
      dateFormat: 'DD/MM/YYYY',
      timezone: 'Asia/Jerusalem',
      language: 'he',
    },
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: type === 'checkbox' ? checked : value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage('');

    try {
      await updateConfig(formData);
      setSaveMessage('הקונפיגורציה עודכנה בהצלחה!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      setSaveMessage('שגיאה בעדכון הקונפיגורציה: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">טוען קונפיגורציה...</div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          הגדרות העסק
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {saveMessage && (
          <div className={`border rounded-lg p-4 mb-6 ${saveMessage.includes('שגיאה')
            ? 'bg-red-50 border-red-200 text-red-600'
            : 'bg-green-50 border-green-200 text-green-600'
            }`}>
            {saveMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* פרטי העסק */}
          <section>
            <h2 className="text-xl font-semibold mb-4">פרטי העסק</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">שם העסק (עברית)</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">שם העסק (אנגלית)</label>
                <input
                  type="text"
                  name="nameEn"
                  value={formData.nameEn}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">סוג העסק</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="school">בית ספר</option>
                  <option value="institute">מכון</option>
                  <option value="academy">אקדמיה</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">לוגו (URL)</label>
                <input
                  type="text"
                  name="logo"
                  value={formData.logo}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">תיאור</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
                rows="3"
              />
            </div>
          </section>

          {/* פרטי יצירת קשר */}
          <section>
            <h2 className="text-xl font-semibold mb-4">פרטי יצירת קשר</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">טלפון</label>
                <input
                  type="text"
                  name="contact.phone"
                  value={formData.contact.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">אימייל</label>
                <input
                  type="email"
                  name="contact.email"
                  value={formData.contact.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">כתובת</label>
                <input
                  type="text"
                  name="contact.address"
                  value={formData.contact.address}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">אתר</label>
                <input
                  type="url"
                  name="contact.website"
                  value={formData.contact.website}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>
          </section>

          {/* Branding */}
          <section>
            <h2 className="text-xl font-semibold mb-4">עיצוב ומותג</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">צבע ראשי</label>
                <input
                  type="color"
                  name="branding.primaryColor"
                  value={formData.branding.primaryColor}
                  onChange={handleChange}
                  className="w-full h-10 border rounded-lg"
                />
                <input
                  type="text"
                  value={formData.branding.primaryColor}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    branding: { ...prev.branding, primaryColor: e.target.value }
                  }))}
                  className="w-full mt-2 px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">צבע משני</label>
                <input
                  type="color"
                  name="branding.secondaryColor"
                  value={formData.branding.secondaryColor}
                  onChange={handleChange}
                  className="w-full h-10 border rounded-lg"
                />
                <input
                  type="text"
                  value={formData.branding.secondaryColor}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    branding: { ...prev.branding, secondaryColor: e.target.value }
                  }))}
                  className="w-full mt-2 px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">צבע דגש</label>
                <input
                  type="color"
                  name="branding.accentColor"
                  value={formData.branding.accentColor}
                  onChange={handleChange}
                  className="w-full h-10 border rounded-lg"
                />
                <input
                  type="text"
                  value={formData.branding.accentColor}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    branding: { ...prev.branding, accentColor: e.target.value }
                  }))}
                  className="w-full mt-2 px-4 py-2 border rounded-lg"
                />
              </div>
            </div>
          </section>

          {/* הגדרות */}
          <section>
            <h2 className="text-xl font-semibold mb-4">הגדרות</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">מטבע</label>
                <select
                  name="settings.currency"
                  value={formData.settings.currency}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="ILS">שקל (ILS)</option>
                  <option value="USD">דולר (USD)</option>
                  <option value="EUR">יורו (EUR)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">סמל מטבע</label>
                <input
                  type="text"
                  name="settings.currencySymbol"
                  value={formData.settings.currencySymbol}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>
          </section>

          {/* Features */}
          <section>
            <h2 className="text-xl font-semibold mb-4">תכונות</h2>
            <div className="space-y-2">
              {Object.keys(formData.features).map((feature) => (
                <label key={feature} className="flex items-center space-x-2 space-x-reverse">
                  <input
                    type="checkbox"
                    name={`features.${feature}`}
                    checked={formData.features[feature]}
                    onChange={handleChange}
                    className="w-4 h-4"
                  />
                  <span>{feature.replace('Enabled', '')}</span>
                </label>
              ))}
            </div>
          </section>

          <div className="flex justify-start pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? 'שומר...' : 'שמור שינויים'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

export default BusinessConfig;

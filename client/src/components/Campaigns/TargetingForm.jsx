import { useState } from 'react';
import Card from '../ui/Card';

function TargetingForm({ formData, onChange }) {
  const [localData, setLocalData] = useState({
    targetAudience: formData.targetAudience || {
      ageRange: { min: '', max: '' },
      interests: [],
      location: '',
    },
  });

  const availableInterests = [
    'טכנולוגיה',
    'עסקים',
    'אמנות',
    'ספורט',
    'בריאות',
    'חינוך',
    'תקשורת',
    'שיווק',
    'אחר',
  ];

  const handleChange = (field, value) => {
    const updated = {
      ...localData,
      targetAudience: {
        ...localData.targetAudience,
        [field]: value,
      },
    };
    setLocalData(updated);
    onChange({ targetAudience: updated.targetAudience });
  };

  const handleInterestToggle = (interest) => {
    const currentInterests = localData.targetAudience.interests || [];
    const updated = currentInterests.includes(interest)
      ? currentInterests.filter(i => i !== interest)
      : [...currentInterests, interest];

    handleChange('interests', updated);
  };

  const handleAgeRangeChange = (field, value) => {
    const updated = {
      ...localData.targetAudience,
      ageRange: {
        ...localData.targetAudience.ageRange,
        [field]: value ? parseInt(value) : '',
      },
    };
    setLocalData({ ...localData, targetAudience: updated });
    onChange({ targetAudience: updated });
  };

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-4">טרגוט קהל יעד</h3>

      <div className="space-y-6">
        {/* Age Range */}
        <div>
          <label className="block text-sm font-medium mb-2">טווח גילאים</label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">מינימום</label>
              <input
                type="number"
                min="0"
                max="120"
                value={localData.targetAudience.ageRange?.min || ''}
                onChange={(e) => handleAgeRangeChange('min', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="גיל מינימלי"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">מקסימום</label>
              <input
                type="number"
                min="0"
                max="120"
                value={localData.targetAudience.ageRange?.max || ''}
                onChange={(e) => handleAgeRangeChange('max', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="גיל מקסימלי"
              />
            </div>
          </div>
        </div>

        {/* Interests */}
        <div>
          <label className="block text-sm font-medium mb-2">תחומי עניין</label>
          <div className="flex flex-wrap gap-2">
            {availableInterests.map((interest) => {
              const isSelected = localData.targetAudience.interests?.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => handleInterestToggle(interest)}
                  className={`px-4 py-2 rounded-lg border transition-all ${isSelected
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                    }`}
                >
                  {interest}
                </button>
              );
            })}
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium mb-2">מיקום</label>
          <input
            type="text"
            value={localData.targetAudience.location || ''}
            onChange={(e) => handleChange('location', e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="לדוגמה: תל אביב, מרכז, כל הארץ"
          />
        </div>
      </div>
    </Card>
  );
}

export default TargetingForm;

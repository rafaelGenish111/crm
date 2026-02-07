import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import courseService from '../../services/courseService';
import userService from '../../services/userService';
import { formatDate, formatCurrency } from '../../utils/configUtils';
import { useBusinessConfig } from '../../context/BusinessConfigContext';

function CoursesList() {
  const navigate = useNavigate();
  const { config } = useBusinessConfig();
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    instructor: '',
    startDate: '',
    endDate: '',
    price: '',
    capacity: '',
    description: '',
    numberOfSessions: '',
    dayOfWeek: '',
    location: '',
    requiredEquipment: [],
    additionalStaff: [],
    holidays: [],
  });
  const [equipmentInput, setEquipmentInput] = useState('');
  const [holidayInput, setHolidayInput] = useState('');
  const [filters, setFilters] = useState({
    subject: '',
    instructor: '',
    startDate: '',
  });

  useEffect(() => {
    loadCourses();
  }, [filters]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const queryFilters = {};
      if (filters.subject) queryFilters.subject = filters.subject;
      if (filters.instructor) queryFilters.instructor = filters.instructor;
      if (filters.startDate) queryFilters.startDate = filters.startDate;

      const data = await courseService.getCourses(queryFilters);
      setCourses(data.courses);
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

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      const courseData = {
        name: formData.name,
        subject: formData.subject,
        instructor: formData.instructor,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        price: parseFloat(formData.price),
        capacity: parseInt(formData.capacity),
        description: formData.description || undefined,
        numberOfSessions: formData.numberOfSessions ? parseInt(formData.numberOfSessions) : undefined,
        dayOfWeek: formData.dayOfWeek || undefined,
        location: formData.location || undefined,
        requiredEquipment: formData.requiredEquipment.length > 0 ? formData.requiredEquipment : undefined,
        additionalStaff: formData.additionalStaff.length > 0 ? formData.additionalStaff : undefined,
        holidays: formData.holidays.length > 0 ? formData.holidays : undefined,
      };

      await courseService.createCourse(courseData);
      await loadCourses();
      setShowForm(false);
      resetForm();
    } catch (err) {
      setError(err.message || 'שגיאה ביצירת קורס');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      instructor: '',
      startDate: '',
      endDate: '',
      price: '',
      capacity: '',
      description: '',
      numberOfSessions: '',
      dayOfWeek: '',
      location: '',
      requiredEquipment: [],
      additionalStaff: [],
      holidays: [],
    });
    setEquipmentInput('');
    setHolidayInput('');
  };

  const addEquipment = () => {
    if (equipmentInput.trim()) {
      setFormData(prev => ({
        ...prev,
        requiredEquipment: [...prev.requiredEquipment, equipmentInput.trim()],
      }));
      setEquipmentInput('');
    }
  };

  const removeEquipment = (index) => {
    setFormData(prev => ({
      ...prev,
      requiredEquipment: prev.requiredEquipment.filter((_, i) => i !== index),
    }));
  };

  const addHoliday = () => {
    if (holidayInput) {
      setFormData(prev => ({
        ...prev,
        holidays: [...prev.holidays, holidayInput],
      }));
      setHolidayInput('');
    }
  };

  const removeHoliday = (index) => {
    setFormData(prev => ({
      ...prev,
      holidays: prev.holidays.filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">טוען קורסים...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">ניהול קורסים</h1>
          <Button
            onClick={() => setShowForm(true)}
            variant="primary"
          >
            הוסף קורס
          </Button>
        </div>

        {error && (
          <Card className="bg-red-50 border-red-200">
            <p className="text-red-600">{error}</p>
          </Card>
        )}

        <Card>
          <h3 className="font-semibold mb-4">סינון</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="נושא"
              value={filters.subject}
              onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
              className="px-4 py-2 border rounded-lg"
            />
            <input
              type="text"
              placeholder="מנחה"
              value={filters.instructor}
              onChange={(e) => setFilters({ ...filters, instructor: e.target.value })}
              className="px-4 py-2 border rounded-lg"
            />
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="px-4 py-2 border rounded-lg"
            />
          </div>
        </Card>

        <DataTable
          columns={[
            { key: 'name', label: 'שם קורס', sortable: true },
            { key: 'subject', label: 'נושא', sortable: true },
            {
              key: 'instructor',
              label: 'מנחה',
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
              key: 'capacity',
              label: 'קיבולת',
            },
            {
              key: 'actions',
              label: 'פעולות',
              render: (value, row) => (
                <div className="flex space-x-2 space-x-reverse">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/courses/${row._id || row.id}`);
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    צפה
                  </button>
                </div>
              ),
            },
          ]}
          data={courses}
          onRowClick={(row) => navigate(`/courses/${row._id || row.id}`)}
        />

        {/* Create Course Modal */}
        <Modal
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            resetForm();
          }}
          title="הוסף קורס חדש"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">שם קורס *</label>
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
              <label className="block text-sm font-medium mb-2">נושא *</label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleFormChange}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">מנחה *</label>
              <select
                name="instructor"
                value={formData.instructor}
                onChange={handleFormChange}
                className="w-full px-4 py-2 border rounded-lg"
                required
              >
                <option value="">-- בחר מנחה --</option>
                {users.map((user) => (
                  <option key={user.id || user._id} value={user.id || user._id}>
                    {user.name} {user.email ? `(${user.email})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">תאריך התחלה *</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">תאריך סיום</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
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
              <label className="block text-sm font-medium mb-2">תיאור</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                className="w-full px-4 py-2 border rounded-lg"
                rows="3"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">מספר מפגשים</label>
                <input
                  type="number"
                  name="numberOfSessions"
                  value={formData.numberOfSessions}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border rounded-lg"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">יום בשבוע</label>
                <select
                  name="dayOfWeek"
                  value={formData.dayOfWeek}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">-- בחר יום --</option>
                  <option value="sunday">ראשון</option>
                  <option value="monday">שני</option>
                  <option value="tuesday">שלישי</option>
                  <option value="wednesday">רביעי</option>
                  <option value="thursday">חמישי</option>
                  <option value="friday">שישי</option>
                  <option value="saturday">שבת</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">מיקום</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleFormChange}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="כתובת או שם המקום"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">אנשי צוות נוספים</label>
              <select
                multiple
                name="additionalStaff"
                value={formData.additionalStaff}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value);
                  setFormData(prev => ({ ...prev, additionalStaff: selected }));
                }}
                className="w-full px-4 py-2 border rounded-lg"
                size="3"
              >
                {users.filter(u => u.id !== formData.instructor).map((user) => (
                  <option key={user.id || user._id} value={user.id || user._id}>
                    {user.name} {user.email ? `(${user.email})` : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">החזק Ctrl (או Cmd ב-Mac) כדי לבחור מספר אפשרויות</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">ציוד נדרש</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={equipmentInput}
                  onChange={(e) => setEquipmentInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEquipment())}
                  className="flex-1 px-4 py-2 border rounded-lg"
                  placeholder="הוסף ציוד"
                />
                <button
                  type="button"
                  onClick={addEquipment}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                >
                  הוסף
                </button>
              </div>
              {formData.requiredEquipment.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.requiredEquipment.map((equipment, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      {equipment}
                      <button
                        type="button"
                        onClick={() => removeEquipment(index)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">חופשים</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="date"
                  value={holidayInput}
                  onChange={(e) => setHolidayInput(e.target.value)}
                  className="flex-1 px-4 py-2 border rounded-lg"
                />
                <button
                  type="button"
                  onClick={addHoliday}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                >
                  הוסף
                </button>
              </div>
              {formData.holidays.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.holidays.map((holiday, index) => (
                    <span
                      key={index}
                      className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      {new Date(holiday).toLocaleDateString('he-IL')}
                      <button
                        type="button"
                        onClick={() => removeHoliday(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
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
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
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

export default CoursesList;

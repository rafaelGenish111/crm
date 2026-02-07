import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import knowledgeBaseService from '../../services/knowledgeBaseService';
import courseService from '../../services/courseService';

function KnowledgeBaseManagement() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    courseId: '',
    search: '',
  });
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general_advice',
    course: '',
    tags: [],
    isActive: true,
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    loadEntries();
    loadCourses();
  }, [filters]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.category) params.category = filters.category;
      if (filters.courseId) params.courseId = filters.courseId;
      if (filters.search) params.search = filters.search;

      const data = await knowledgeBaseService.getKnowledgeEntries(params);
      setEntries(data.entries || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const data = await courseService.getCourses();
      setCourses(data.courses || []);
    } catch (err) {
      console.error('Error loading courses:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      if (editingEntry) {
        await knowledgeBaseService.updateKnowledgeEntry(editingEntry._id, formData);
      } else {
        await knowledgeBaseService.createKnowledgeEntry(formData);
      }
      await loadEntries();
      resetForm();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setFormData({
      title: entry.title,
      content: entry.content,
      category: entry.category,
      course: entry.course?._id || '',
      tags: entry.tags || [],
      isActive: entry.isActive,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק ערך ידע זה?')) {
      return;
    }
    try {
      await knowledgeBaseService.deleteKnowledgeEntry(id);
      await loadEntries();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleImportFromCourse = async (courseId) => {
    if (!window.confirm('האם אתה בטוח שברצונך לייבא את תוכנית הלימודים של הקורס?')) {
      return;
    }
    try {
      setLoading(true);
      await knowledgeBaseService.importFromCourse(courseId);
      await loadEntries();
      alert('הייבוא הושלם בהצלחה!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      category: 'general_advice',
      course: '',
      tags: [],
      isActive: true,
    });
    setTagInput('');
    setEditingEntry(null);
    setShowForm(false);
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  const categoryLabels = {
    course_material: 'חומר לימוד',
    study_guide: 'מדריך לימוד',
    exam_prep: 'הכנה לבחינה',
    general_advice: 'ייעוץ כללי',
    course_specific: 'ספציפי לקורס',
  };

  if (loading && entries.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">טוען בסיס ידע...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">ניהול בסיס ידע</h1>
          <Button onClick={() => setShowForm(true)}>➕ הוסף ערך ידע</Button>
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
              <label className="block text-sm font-medium mb-2">קטגוריה</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">כל הקטגוריות</option>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">קורס</label>
              <select
                value={filters.courseId}
                onChange={(e) => setFilters({ ...filters, courseId: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">כל הקורסים</option>
                <option value="null">ידע כללי</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.name}
                  </option>
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
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => setFilters({ category: '', courseId: '', search: '' })}
                variant="neutral"
              >
                נקה פילטרים
              </Button>
            </div>
          </div>
        </Card>

        {/* Entries Table */}
        <DataTable
          columns={[
            {
              key: 'title',
              label: 'כותרת',
              sortable: true,
            },
            {
              key: 'category',
              label: 'קטגוריה',
              render: (value) => categoryLabels[value] || value,
            },
            {
              key: 'course',
              label: 'קורס',
              render: (value) => value?.name || 'כללי',
            },
            {
              key: 'tags',
              label: 'תגיות',
              render: (value) => (
                <div className="flex flex-wrap gap-1">
                  {value?.slice(0, 3).map((tag, idx) => (
                    <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                  {value?.length > 3 && (
                    <span className="text-xs text-gray-500">+{value.length - 3}</span>
                  )}
                </div>
              ),
            },
            {
              key: 'usageCount',
              label: 'שימושים',
              render: (value) => value || 0,
            },
            {
              key: 'isActive',
              label: 'סטטוס',
              render: (value) => (
                <span
                  className={`px-2 py-1 rounded text-sm ${value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}
                >
                  {value ? 'פעיל' : 'לא פעיל'}
                </span>
              ),
            },
            {
              key: 'actions',
              label: 'פעולות',
              render: (value, row) => (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(row)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
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
          data={entries}
        />

        {/* Form Modal */}
        <Modal
          isOpen={showForm}
          onClose={resetForm}
          title={editingEntry ? 'עריכת ערך ידע' : 'יצירת ערך ידע חדש'}
          size="large"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">כותרת *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">תוכן *</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="8"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">קטגוריה</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">קורס (אופציונלי)</label>
                <select
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">ידע כללי</option>
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">תגיות</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="הוסף תגית..."
                  className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <Button type="button" onClick={addTag}>
                  הוסף
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg flex items-center gap-2"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-5 h-5"
              />
              <label htmlFor="isActive" className="text-sm font-medium">
                פעיל
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" onClick={resetForm} variant="neutral">
                ביטול
              </Button>
              <Button type="submit">{editingEntry ? 'עדכן' : 'צור'}</Button>
            </div>
          </form>
        </Modal>

        {/* Import from Course */}
        {courses.length > 0 && (
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-4">ייבוא מתוכנית לימודים</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {courses.map((course) => (
                <div
                  key={course._id}
                  className="p-4 border rounded-lg flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold">{course.name}</p>
                    <p className="text-sm text-gray-600">{course.subject}</p>
                  </div>
                  <Button
                    onClick={() => handleImportFromCourse(course._id)}
                    variant="success"
                    size="sm"
                  >
                    ייבא
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

export default KnowledgeBaseManagement;

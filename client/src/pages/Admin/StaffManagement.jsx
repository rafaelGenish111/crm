import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import userService from '../../services/userService';

function StaffManagement() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'instructor',
  });

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userService.getUsers();
      // Filter to show only staff roles (instructor, sales, admin_staff)
      const staffMembers = (data.users || []).filter(
        user => ['instructor', 'sales', 'admin_staff', 'admin'].includes(user.role)
      );
      setStaff(staffMembers);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStaff) {
        const { password, ...updateData } = formData;
        if (!password) {
          // Don't update password if empty
          await userService.updateUser(editingStaff.id, updateData);
        } else {
          await userService.updateUser(editingStaff.id, formData);
        }
      } else {
        await userService.createUser(formData);
      }
      await loadStaff();
      resetForm();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (member) => {
    setEditingStaff({ id: member.id });
    setFormData({
      name: member.name,
      email: member.email,
      password: '',
      phone: member.phone || '',
      role: member.role,
    });
    setShowForm(true);
  };

  const handleDelete = async (memberId) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק איש צוות זה?')) {
      return;
    }

    try {
      await userService.deleteUser(memberId);
      await loadStaff();
    } catch (err) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      role: 'instructor',
    });
    setEditingStaff(null);
    setShowForm(false);
  };

  const roleLabels = {
    instructor: 'מנחה',
    sales: 'מכירות',
    admin_staff: 'צוות אדמין',
    admin: 'אדמין',
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">טוען אנשי צוות...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">ניהול צוות</h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            הוסף איש צוות
          </button>
        </div>

        {error && (
          <Card className="bg-red-50 border-red-200">
            <p className="text-red-600">{error}</p>
          </Card>
        )}

        <Card>
          <DataTable
            columns={[
              { key: 'name', label: 'שם', sortable: true },
              { key: 'email', label: 'אימייל', sortable: true },
              { key: 'phone', label: 'טלפון' },
              {
                key: 'role',
                label: 'תפקיד',
                render: (value) => roleLabels[value] || value,
              },
              {
                key: 'actions',
                label: 'פעולות',
                render: (value, row) => (
                  <div className="flex space-x-2 space-x-reverse">
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
            data={staff}
          />
        </Card>

        {/* Form Modal */}
        <Modal
          isOpen={showForm}
          onClose={resetForm}
          title={editingStaff ? 'ערוך איש צוות' : 'הוסף איש צוות חדש'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">שם *</label>
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
              <label className="block text-sm font-medium mb-2">אימייל *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
                required
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                {editingStaff ? 'סיסמה חדשה (השאר ריק אם לא רוצה לשנות)' : 'סיסמה *'}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
                required={!editingStaff}
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">טלפון</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">תפקיד *</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
                required
              >
                <option value="instructor">מנחה</option>
                <option value="sales">מכירות</option>
                <option value="admin_staff">צוות אדמין</option>
                <option value="admin">אדמין</option>
              </select>
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
                {editingStaff ? 'עדכן' : 'צור'}
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

export default StaffManagement;

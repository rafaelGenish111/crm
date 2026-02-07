import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import workshopService from '../../services/workshopService';
import { formatDate } from '../../utils/configUtils';
import { useBusinessConfig } from '../../context/BusinessConfigContext';

function WorkshopsList() {
  const navigate = useNavigate();
  const { config } = useBusinessConfig();
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadWorkshops();
  }, []);

  const loadWorkshops = async () => {
    try {
      setLoading(true);
      const data = await workshopService.getWorkshops();
      setWorkshops(data.workshops);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">טוען סדנאות...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">ניהול סדנאות</h1>
          <button
            onClick={() => navigate('/workshops/new')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            הוסף סדנה
          </button>
        </div>

        {error && (
          <Card className="bg-red-50 border-red-200">
            <p className="text-red-600">{error}</p>
          </Card>
        )}

        <DataTable
          columns={[
            { key: 'name', label: 'שם סדנה', sortable: true },
            {
              key: 'instructor',
              label: 'מנחה',
              render: (value) => value?.name || '-',
            },
            {
              key: 'date',
              label: 'תאריך',
              render: (value) => formatDate(value, config),
            },
            {
              key: 'price',
              label: 'מחיר',
              render: (value) => `${value} ₪`,
            },
            {
              key: 'actions',
              label: 'פעולות',
              render: (value, row) => (
                <div className="flex space-x-2 space-x-reverse">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/workshops/${row._id || row.id}`);
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    צפה
                  </button>
                </div>
              ),
            },
          ]}
          data={workshops}
          onRowClick={(row) => navigate(`/workshops/${row._id || row.id}`)}
        />
      </div>
    </DashboardLayout>
  );
}

export default WorkshopsList;

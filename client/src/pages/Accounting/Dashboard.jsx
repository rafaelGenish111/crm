import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import Card from '../../components/ui/Card';
import BarChart from '../../components/Charts/BarChart';
import PieChart from '../../components/Charts/PieChart';
import accountingService from '../../services/accountingService';
import { formatCurrency } from '../../utils/configUtils';
import { useBusinessConfig } from '../../context/BusinessConfigContext';

function AccountingDashboard() {
  const navigate = useNavigate();
  const { config } = useBusinessConfig();
  const [balance, setBalance] = useState(null);
  const [courseBreakdown, setCourseBreakdown] = useState([]);
  const [workshopBreakdown, setWorkshopBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [balanceData, coursesData, workshopsData] = await Promise.all([
        accountingService.getBalance(),
        accountingService.getProfitabilityBreakdown('course'),
        accountingService.getProfitabilityBreakdown('workshop'),
      ]);

      setBalance(balanceData);
      setCourseBreakdown(coursesData.breakdown || []);
      setWorkshopBreakdown(workshopsData.breakdown || []);
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
          <div className="text-xl">טוען נתונים...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">דשבורד חשבונות</h1>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/accounting/invoices')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              חשבונות לפי לקוחות
            </button>
            <button
              onClick={() => navigate('/accounting/debts')}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              לקוחות עם חובות
            </button>
            <button
              onClick={() => navigate('/accounting/reports')}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              דוחות מפורטים
            </button>
          </div>
        </div>

        {error && (
          <Card className="bg-red-50 border-red-200">
            <p className="text-red-600">{error}</p>
          </Card>
        )}

        {balance && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-green-50">
              <p className="text-sm text-gray-600 mb-2">הכנסות</p>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(balance.revenue, config)}
              </p>
            </Card>
            <Card className="bg-red-50">
              <p className="text-sm text-gray-600 mb-2">הוצאות</p>
              <p className="text-3xl font-bold text-red-600">
                {formatCurrency(balance.expenses, config)}
              </p>
            </Card>
            <Card className="bg-blue-50">
              <p className="text-sm text-gray-600 mb-2">רווח נקי</p>
              <p className="text-3xl font-bold text-blue-600">
                {formatCurrency(balance.profit, config)}
              </p>
            </Card>
          </div>
        )}

        {courseBreakdown.length > 0 && (
          <Card>
            <h2 className="text-xl font-semibold mb-4">רווחיות לפי קורסים</h2>
            <BarChart
              data={courseBreakdown.map(c => ({
                name: c.name,
                הכנסות: c.revenue,
              }))}
              dataKeys={['הכנסות']}
            />
          </Card>
        )}

        {workshopBreakdown.length > 0 && (
          <Card>
            <h2 className="text-xl font-semibold mb-4">רווחיות לפי סדנאות</h2>
            <PieChart
              data={workshopBreakdown.map(w => ({
                name: w.name,
                value: w.revenue,
              }))}
              dataKey="value"
              nameKey="name"
            />
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

export default AccountingDashboard;

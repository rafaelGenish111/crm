import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import BarChart from '../../components/Charts/BarChart';
import PieChart from '../../components/Charts/PieChart';
import accountingService from '../../services/accountingService';
import { formatCurrency, formatDate } from '../../utils/configUtils';
import { useBusinessConfig } from '../../context/BusinessConfigContext';

function Reports() {
  const { config } = useBusinessConfig();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [reports, setReports] = useState({
    transactions: [],
    invoices: [],
    receipts: [],
    courseBreakdown: [],
    workshopBreakdown: [],
    customerBreakdown: [],
  });

  useEffect(() => {
    loadReports();
  }, [dateRange]);

  const loadReports = async () => {
    try {
      setLoading(true);
      // In a real implementation, you would have specific API endpoints for reports
      // For now, we'll use existing endpoints with date filters
      const [balanceData, coursesData, workshopsData] = await Promise.all([
        accountingService.getBalance(),
        accountingService.getProfitabilityBreakdown('course'),
        accountingService.getProfitabilityBreakdown('workshop'),
      ]);

      setReports({
        transactions: [],
        invoices: [],
        receipts: [],
        courseBreakdown: coursesData.breakdown || [],
        workshopBreakdown: workshopsData.breakdown || [],
        customerBreakdown: [],
        balance: balanceData,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      alert('אין נתונים לייצוא');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => row[header] || '').join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">טוען דוחות...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">דוחות מפורטים</h1>
        </div>

        {error && (
          <Card className="bg-red-50 border-red-200">
            <p className="text-red-600">{error}</p>
          </Card>
        )}

        {/* Date Range Filter */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">סינון לפי תאריכים</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">תאריך התחלה</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">תאריך סיום</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={loadReports}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                עדכן דוחות
              </button>
            </div>
          </div>
        </Card>

        {/* Summary Cards */}
        {reports.balance && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-green-50">
              <p className="text-sm text-gray-600 mb-1">סה"כ הכנסות</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(reports.balance.revenue, config)}
              </p>
            </Card>
            <Card className="p-4 bg-red-50">
              <p className="text-sm text-gray-600 mb-1">סה"כ הוצאות</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(reports.balance.expenses, config)}
              </p>
            </Card>
            <Card className="p-4 bg-blue-50">
              <p className="text-sm text-gray-600 mb-1">רווח נקי</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(reports.balance.profit, config)}
              </p>
            </Card>
            <Card className="p-4 bg-purple-50">
              <p className="text-sm text-gray-600 mb-1">שיעור רווחיות</p>
              <p className="text-2xl font-bold text-purple-600">
                {reports.balance.revenue > 0
                  ? ((reports.balance.profit / reports.balance.revenue) * 100).toFixed(1)
                  : 0}%
              </p>
            </Card>
          </div>
        )}

        {/* Course Breakdown */}
        {reports.courseBreakdown.length > 0 && (
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">רווחיות לפי קורסים</h2>
              <button
                onClick={() => exportToCSV(reports.courseBreakdown, 'course_breakdown')}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                ייצא ל-CSV
              </button>
            </div>
            <DataTable
              columns={[
                { key: 'name', label: 'שם קורס', sortable: true },
                {
                  key: 'revenue',
                  label: 'הכנסות',
                  render: (value) => formatCurrency(value, config),
                  sortable: true,
                },
                {
                  key: 'expenses',
                  label: 'הוצאות',
                  render: (value) => formatCurrency(value || 0, config),
                  sortable: true,
                },
                {
                  key: 'profit',
                  label: 'רווח',
                  render: (value, row) => {
                    const profit = (row.revenue || 0) - (row.expenses || 0);
                    return formatCurrency(profit, config);
                  },
                  sortable: true,
                },
              ]}
              data={reports.courseBreakdown}
            />
            <div className="mt-4">
              <BarChart
                data={reports.courseBreakdown.map(c => ({
                  name: c.name,
                  הכנסות: c.revenue || 0,
                  הוצאות: c.expenses || 0,
                }))}
                dataKeys={['הכנסות', 'הוצאות']}
                height={300}
              />
            </div>
          </Card>
        )}

        {/* Workshop Breakdown */}
        {reports.workshopBreakdown.length > 0 && (
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">רווחיות לפי סדנאות</h2>
              <button
                onClick={() => exportToCSV(reports.workshopBreakdown, 'workshop_breakdown')}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                ייצא ל-CSV
              </button>
            </div>
            <DataTable
              columns={[
                { key: 'name', label: 'שם סדנה', sortable: true },
                {
                  key: 'revenue',
                  label: 'הכנסות',
                  render: (value) => formatCurrency(value, config),
                  sortable: true,
                },
                {
                  key: 'expenses',
                  label: 'הוצאות',
                  render: (value) => formatCurrency(value || 0, config),
                  sortable: true,
                },
                {
                  key: 'profit',
                  label: 'רווח',
                  render: (value, row) => {
                    const profit = (row.revenue || 0) - (row.expenses || 0);
                    return formatCurrency(profit, config);
                  },
                  sortable: true,
                },
              ]}
              data={reports.workshopBreakdown}
            />
            <div className="mt-4">
              <PieChart
                data={reports.workshopBreakdown.map(w => ({
                  name: w.name,
                  value: w.revenue || 0,
                }))}
                dataKey="value"
                nameKey="name"
                height={300}
              />
            </div>
          </Card>
        )}

        {reports.courseBreakdown.length === 0 && reports.workshopBreakdown.length === 0 && (
          <Card className="p-6 text-center">
            <p className="text-gray-600">אין נתונים זמינים לתקופה שנבחרה</p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

export default Reports;

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import Card from '../../components/ui/Card';
import LineChart from '../../components/Charts/LineChart';
import BarChart from '../../components/Charts/BarChart';
import campaignService from '../../services/campaignService';
import { formatDate, formatCurrency } from '../../utils/configUtils';
import { useBusinessConfig } from '../../context/BusinessConfigContext';

function CampaignAnalytics() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { config } = useBusinessConfig();
  const [campaign, setCampaign] = useState(null);
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await campaignService.getCampaignById(id);
      setCampaign(response.campaign);
      setPerformance(response.performance || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = () => {
    if (!performance.length) return null;

    const total = performance.reduce(
      (acc, p) => ({
        impressions: acc.impressions + (p.impressions || 0),
        clicks: acc.clicks + (p.clicks || 0),
        conversions: acc.conversions + (p.conversions || 0),
        leads: acc.leads + (p.leads || 0),
        cost: acc.cost + (p.cost || 0),
        revenue: acc.revenue + (p.revenue || 0),
      }),
      { impressions: 0, clicks: 0, conversions: 0, leads: 0, cost: 0, revenue: 0 }
    );

    const ctr = total.impressions > 0 ? (total.clicks / total.impressions) * 100 : 0;
    const conversionRate = total.clicks > 0 ? (total.conversions / total.clicks) * 100 : 0;
    const roas = total.cost > 0 ? (total.revenue / total.cost) : 0;
    const cpc = total.clicks > 0 ? total.cost / total.clicks : 0;
    const cpl = total.leads > 0 ? total.cost / total.leads : 0;

    return {
      ...total,
      ctr: ctr.toFixed(2),
      conversionRate: conversionRate.toFixed(2),
      roas: roas.toFixed(2),
      cpc: cpc.toFixed(2),
      cpl: cpl.toFixed(2),
    };
  };

  const metrics = calculateMetrics();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">טוען נתונים...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !campaign) {
    return (
      <DashboardLayout>
        <Card className="bg-red-50 border-red-200">
          <p className="text-red-600">{error || 'קמפיין לא נמצא'}</p>
          <button
            onClick={() => navigate('/campaigns')}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            ← חזרה לרשימה
          </button>
        </Card>
      </DashboardLayout>
    );
  }

  const chartData = performance.map(p => ({
    date: formatDate(p.date, config),
    impressions: p.impressions || 0,
    clicks: p.clicks || 0,
    conversions: p.conversions || 0,
    cost: p.cost || 0,
    revenue: p.revenue || 0,
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">אנליטיקס קמפיין</h1>
            <p className="text-gray-600 mt-1">{campaign.name}</p>
          </div>
          <button
            onClick={() => navigate('/campaigns')}
            className="text-gray-600 hover:text-gray-800"
          >
            ← חזרה לרשימה
          </button>
        </div>

        {/* Campaign Info */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">תאריך התחלה</p>
              <p className="text-lg font-semibold">{formatDate(campaign.startDate, config)}</p>
            </div>
            {campaign.endDate && (
              <div>
                <p className="text-sm text-gray-600">תאריך סיום</p>
                <p className="text-lg font-semibold">{formatDate(campaign.endDate, config)}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">תקציב</p>
              <p className="text-lg font-semibold">
                {campaign.budget ? formatCurrency(campaign.budget, config) : 'לא מוגדר'}
              </p>
            </div>
          </div>
        </Card>

        {/* Key Metrics */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-blue-50">
              <p className="text-sm text-gray-600 mb-1">הצגות</p>
              <p className="text-2xl font-bold text-blue-600">{metrics.impressions.toLocaleString()}</p>
            </Card>
            <Card className="p-4 bg-green-50">
              <p className="text-sm text-gray-600 mb-1">קליקים</p>
              <p className="text-2xl font-bold text-green-600">{metrics.clicks.toLocaleString()}</p>
            </Card>
            <Card className="p-4 bg-purple-50">
              <p className="text-sm text-gray-600 mb-1">המרות</p>
              <p className="text-2xl font-bold text-purple-600">{metrics.conversions.toLocaleString()}</p>
            </Card>
            <Card className="p-4 bg-yellow-50">
              <p className="text-sm text-gray-600 mb-1">לידים</p>
              <p className="text-2xl font-bold text-yellow-600">{metrics.leads.toLocaleString()}</p>
            </Card>
          </div>
        )}

        {/* Performance Metrics */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="p-4">
              <p className="text-sm text-gray-600 mb-1">CTR</p>
              <p className="text-xl font-semibold">{metrics.ctr}%</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600 mb-1">שיעור המרה</p>
              <p className="text-xl font-semibold">{metrics.conversionRate}%</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600 mb-1">ROAS</p>
              <p className="text-xl font-semibold">{metrics.roas}x</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600 mb-1">CPC</p>
              <p className="text-xl font-semibold">{formatCurrency(metrics.cpc, config)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600 mb-1">CPL</p>
              <p className="text-xl font-semibold">{formatCurrency(metrics.cpl, config)}</p>
            </Card>
          </div>
        )}

        {/* Financial Summary */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-red-50">
              <p className="text-sm text-gray-600 mb-1">עלות כוללת</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(metrics.cost, config)}
              </p>
            </Card>
            <Card className="p-4 bg-green-50">
              <p className="text-sm text-gray-600 mb-1">הכנסות</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(metrics.revenue, config)}
              </p>
            </Card>
            <Card className="p-4 bg-blue-50">
              <p className="text-sm text-gray-600 mb-1">רווח נקי</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(metrics.revenue - metrics.cost, config)}
              </p>
            </Card>
          </div>
        )}

        {/* Charts */}
        {chartData.length > 0 && (
          <>
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">ביצועים לאורך זמן</h2>
              <LineChart
                data={chartData}
                dataKeys={['impressions', 'clicks', 'conversions']}
                height={300}
              />
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">עלויות והכנסות</h2>
              <BarChart
                data={chartData}
                dataKeys={['cost', 'revenue']}
                height={300}
              />
            </Card>
          </>
        )}

        {performance.length === 0 && (
          <Card className="p-6 text-center">
            <p className="text-gray-600">אין נתוני ביצועים זמינים עדיין</p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

export default CampaignAnalytics;

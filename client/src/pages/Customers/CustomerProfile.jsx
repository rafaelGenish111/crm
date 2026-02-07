import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Tabs from '../../components/ui/Tabs';
import Timeline from '../../components/ui/Timeline';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { PhoneIcon, EmailIcon, MessageIcon, DocumentIcon, NoteIcon, HandshakeIcon } from '../../components/ui/Icons';
import customerService from '../../services/customerService';
import paymentService from '../../services/paymentService';
import courseService from '../../services/courseService';
import { formatCurrency, formatDate } from '../../utils/configUtils';
import { useBusinessConfig } from '../../context/BusinessConfigContext';

function CustomerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { config } = useBusinessConfig();
  const [customer, setCustomer] = useState(null);
  const [interactions, setInteractions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [courseEnrollments, setCourseEnrollments] = useState([]);
  const [workshopEnrollments, setWorkshopEnrollments] = useState([]);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({});
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [newInitialPassword, setNewInitialPassword] = useState(null);

  useEffect(() => {
    loadCustomerData();
  }, [id]);

  const loadCustomerData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await customerService.getCustomerById(id);
      setCustomer(data.customer);
      setInteractions(data.interactions || []);
      setPayments(data.payments || []);
      setCourseEnrollments(data.courseEnrollments || []);
      setWorkshopEnrollments(data.workshopEnrollments || []);
      setTotalValue(data.totalValue || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics - MUST be before any conditional returns (Rules of Hooks)
  const stats = useMemo(() => {
    const activeCourses = courseEnrollments.filter(e => e.status === 'enrolled').length;
    const completedCourses = courseEnrollments.filter(e => e.status === 'completed').length;
    const activeWorkshops = workshopEnrollments.filter(e => e.status === 'enrolled').length;
    const completedWorkshops = workshopEnrollments.filter(e => e.status === 'completed').length;

    const completedPayments = payments.filter(p => p.status === 'completed');
    const pendingPayments = payments.filter(p => p.status === 'pending');
    const totalPaid = completedPayments.reduce((sum, p) => sum + p.amount, 0);

    // Payment by method
    const paymentByMethod = completedPayments.reduce((acc, p) => {
      acc[p.paymentMethod] = (acc[p.paymentMethod] || 0) + p.amount;
      return acc;
    }, {});

    // Payments by month
    const paymentsByMonth = completedPayments.reduce((acc, p) => {
      const month = new Date(p.paymentDate).toLocaleDateString('he-IL', { year: 'numeric', month: 'short' });
      acc[month] = (acc[month] || 0) + p.amount;
      return acc;
    }, {});

    const monthlyData = Object.entries(paymentsByMonth).map(([month, amount]) => ({
      month,
      amount: Math.round(amount),
    })).sort((a, b) => new Date(a.month) - new Date(b.month));

    // Interaction types
    const interactionTypes = interactions.reduce((acc, i) => {
      acc[i.type] = (acc[i.type] || 0) + 1;
      return acc;
    }, {});

    return {
      activeCourses,
      completedCourses,
      activeWorkshops,
      completedWorkshops,
      totalPaid,
      pendingPayments: pendingPayments.length,
      paymentByMethod,
      monthlyData,
      interactionTypes,
    };
  }, [payments, courseEnrollments, workshopEnrollments, interactions]);

  // Helper functions - MUST be before any conditional returns
  function getInteractionColor(type) {
    const colors = {
      call: '#3B82F6',
      whatsapp: '#25D366',
      email: '#8B5CF6',
      meeting: '#10B981',
      document: '#F59E0B',
      note: '#6B7280',
    };
    return colors[type] || '#3B82F6';
  }

  function getInteractionIcon(type) {
    const icons = {
      call: PhoneIcon,
      whatsapp: MessageIcon,
      email: EmailIcon,
      meeting: HandshakeIcon,
      document: DocumentIcon,
      note: NoteIcon,
    };
    const IconComponent = icons[type] || NoteIcon;
    return <IconComponent className="w-5 h-5" />;
  }

  function getInteractionTypeLabel(type) {
    const labels = {
      call: 'שיחה',
      whatsapp: 'ווצאפ',
      email: 'אימייל',
      meeting: 'פגישה',
      document: 'מסמך',
      note: 'הערה',
    };
    return labels[type] || type;
  }

  const interactionItems = (interactions || []).map(interaction => ({
    title: interaction.title,
    description: interaction.description,
    date: interaction.createdAt,
    color: getInteractionColor(interaction.type),
    icon: getInteractionIcon(interaction.type),
    meta: {
      סוג: getInteractionTypeLabel(interaction.type),
      מבצע: interaction.performedBy?.name || '-',
    },
  }));

  const handleEdit = () => {
    setEditData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone,
      notes: customer.notes || '',
      isActive: customer.isActive,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      await customerService.updateCustomer(id, editData);
      await loadCustomerData();
      setShowEditModal(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCall = () => {
    window.location.href = `tel:${customer.phone}`;
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(`שלום ${customer.name},`);
    window.open(`https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
  };

  const handleEmail = () => {
    if (customer.email) {
      window.location.href = `mailto:${customer.email}`;
    }
  };

  const handleResetPassword = () => {
    setShowResetPasswordModal(true);
    setNewInitialPassword(null);
  };

  const handleConfirmResetPassword = async () => {
    try {
      setResetPasswordLoading(true);
      setError(null);
      const data = await customerService.resetCustomerPassword(id);
      setNewInitialPassword(data.initialPassword);
    } catch (err) {
      setError(err.message || 'שגיאה באיפוס סיסמה');
    } finally {
      setResetPasswordLoading(false);
    }
  };

  const paymentMethodLabels = {
    cash: 'מזומן',
    credit_card: 'כרטיס אשראי',
    bank_transfer: 'העברה בנקאית',
    check: 'צ\'ק',
    other: 'אחר',
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  // Conditional returns - MUST be after all hooks
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">טוען פרטי לקוח...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !customer) {
    return (
      <DashboardLayout>
        <Card className="bg-red-50 border-red-200">
          <p className="text-red-600">{error || 'לקוח לא נמצא'}</p>
        </Card>
      </DashboardLayout>
    );
  }

  const tabs = [
    {
      id: 'details',
      label: 'פרטים',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <h3 className="text-lg font-semibold mb-4">מידע אישי</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">שם</label>
                <p className="text-lg font-semibold">{customer.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">טלפון</label>
                <p className="text-lg">{customer.phone}</p>
              </div>
              {customer.email && (
                <div>
                  <label className="text-sm font-medium text-gray-500">אימייל</label>
                  <p className="text-lg">{customer.email}</p>
                </div>
              )}
            </div>
          </Card>
          <Card>
            <h3 className="text-lg font-semibold mb-4">מידע נוסף</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">מקור</label>
                <p className="text-lg">
                  {customer.source === 'lead_conversion' ? 'המרה מליד' :
                    customer.source === 'direct' ? 'ישיר' :
                      customer.source === 'referral' ? 'המלצה' : 'אחר'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">תאריך יצירה</label>
                <p className="text-lg">{formatDate(customer.createdAt, config)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">עדכון אחרון</label>
                <p className="text-lg">{formatDate(customer.updatedAt, config)}</p>
              </div>
              {customer.convertedFromLead && (
                <div>
                  <label className="text-sm font-medium text-gray-500">הומר מליד</label>
                  <p className="text-lg">{customer.convertedFromLead.name || 'ליד'}</p>
                </div>
              )}
            </div>
          </Card>
          {customer.notes && (
            <Card className="md:col-span-2">
              <h3 className="text-lg font-semibold mb-2">הערות</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{customer.notes}</p>
            </Card>
          )}
        </div>
      ),
    },
    {
      id: 'interactions',
      label: 'אינטראקציות',
      badge: interactions.length,
      content: (
        <div className="space-y-6">
          {Object.keys(stats.interactionTypes).length > 0 && (
            <Card>
              <h3 className="text-lg font-semibold mb-4">סיכום אינטראקציות</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(stats.interactionTypes).map(([type, count]) => (
                  <div key={type} className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl mb-1">{getInteractionIcon(type)}</p>
                    <p className="text-sm text-gray-600">{getInteractionTypeLabel(type)}</p>
                    <p className="text-lg font-semibold">{count}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
          {interactionItems.length > 0 ? (
            <div>
              <h3 className="text-lg font-semibold mb-4">היסטוריית אינטראקציות</h3>
              <Timeline items={interactionItems} />
            </div>
          ) : (
            <Card>
              <p className="text-gray-500 text-center py-8">אין אינטראקציות</p>
            </Card>
          )}
        </div>
      ),
    },
    {
      id: 'payments',
      label: 'תשלומים',
      badge: payments.length,
      content: (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-blue-50 border-blue-200">
              <div className="text-center">
                <p className="text-sm text-gray-600">סה"כ שווי</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(stats.totalPaid, config)}
                </p>
              </div>
            </Card>
            <Card className="bg-green-50 border-green-200">
              <div className="text-center">
                <p className="text-sm text-gray-600">תשלומים הושלמו</p>
                <p className="text-2xl font-bold text-green-600">
                  {payments.filter(p => p.status === 'completed').length}
                </p>
              </div>
            </Card>
            <Card className="bg-yellow-50 border-yellow-200">
              <div className="text-center">
                <p className="text-sm text-gray-600">תשלומים ממתינים</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.pendingPayments}
                </p>
              </div>
            </Card>
          </div>

          {/* Charts */}
          {payments.filter(p => p.status === 'completed').length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {stats.monthlyData.length > 0 && (
                <Card>
                  <h3 className="text-lg font-semibold mb-4">תשלומים לפי חודש</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={stats.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value, config)} />
                      <Bar dataKey="amount" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}
              {Object.keys(stats.paymentByMethod).length > 0 && (
                <Card>
                  <h3 className="text-lg font-semibold mb-4">תשלומים לפי שיטה</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={Object.entries(stats.paymentByMethod).map(([method, amount]) => ({
                          name: paymentMethodLabels[method] || method,
                          value: Math.round(amount),
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {Object.keys(stats.paymentByMethod).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value, config)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
              )}
            </div>
          )}

          {/* Payments List */}
          {payments.length > 0 ? (
            <div>
              <h3 className="text-lg font-semibold mb-4">רשימת תשלומים</h3>
              <div className="space-y-2">
                {payments.map((payment) => (
                  <Card key={payment._id || payment.id} className="hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-lg">{formatCurrency(payment.amount, config)}</p>
                          <span className={`text-xs px-2 py-1 rounded ${payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                            payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              payment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                            {payment.status === 'completed' ? 'הושלם' :
                              payment.status === 'pending' ? 'ממתין' :
                                payment.status === 'cancelled' ? 'בוטל' :
                                  payment.status === 'refunded' ? 'הוחזר' : payment.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {formatDate(payment.paymentDate, config)}
                        </p>
                        {payment.description && (
                          <p className="text-sm text-gray-500 mt-1">{payment.description}</p>
                        )}
                        {payment.receiptNumber && (
                          <p className="text-xs text-gray-400 mt-1">קבלה #{payment.receiptNumber}</p>
                        )}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-700">
                          {paymentMethodLabels[payment.paymentMethod] || payment.paymentMethod}
                        </p>
                        {payment.numberOfPayments > 1 && (
                          <p className="text-xs text-gray-500 mt-1">
                            תשלום {payment.paymentIndex}/{payment.numberOfPayments}
                          </p>
                        )}
                        {payment.recordedBy && (
                          <p className="text-xs text-gray-500 mt-1">
                            נרשם על ידי: {payment.recordedBy.name}
                          </p>
                        )}
                        {payment.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="accent"
                            onClick={() => navigate(`/payment/${payment._id || payment.id}`)}
                            className="mt-2"
                          >
                            שלם עכשיו
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Card>
              <p className="text-gray-500 text-center py-8">אין תשלומים</p>
            </Card>
          )}
        </div>
      ),
    },
    {
      id: 'enrollments',
      label: 'שיוכים',
      badge: (courseEnrollments.length + workshopEnrollments.length) || undefined,
      content: (
        <div className="space-y-6">
          {/* Course Enrollments */}
          <div>
            <h3 className="text-lg font-semibold mb-4">קורסים</h3>
            {courseEnrollments.length > 0 ? (
              <div className="space-y-3">
                {courseEnrollments.map((enrollment) => {
                  const statusLabels = {
                    pending: 'ממתין לתשלום',
                    approved: 'מאושר',
                    enrolled: 'רשום',
                    completed: 'הושלם',
                    cancelled: 'בוטל',
                  };
                  const statusColors = {
                    pending: 'bg-yellow-100 text-yellow-800',
                    approved: 'bg-green-100 text-green-800',
                    enrolled: 'bg-blue-100 text-blue-800',
                    completed: 'bg-purple-100 text-purple-800',
                    cancelled: 'bg-gray-100 text-gray-800',
                  };
                  return (
                    <Card key={enrollment._id || enrollment.id} className="hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 cursor-pointer" onClick={() => enrollment.course && navigate(`/courses/${enrollment.course._id || enrollment.course.id}`)}>
                          <h4 className="font-semibold text-lg">{enrollment.course?.name || '-'}</h4>
                          <p className="text-sm text-gray-600 mt-1">{enrollment.course?.subject || ''}</p>
                          {enrollment.course?.instructor && (
                            <p className="text-sm text-gray-500 mt-1">
                              מנחה: {enrollment.course.instructor.name}
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-4">
                            <span className={`text-xs px-2 py-1 rounded ${statusColors[enrollment.status] || 'bg-gray-100 text-gray-800'}`}>
                              {statusLabels[enrollment.status] || enrollment.status}
                            </span>
                            <span className="text-xs text-gray-500">
                              נרשם: {formatDate(enrollment.enrolledAt, config)}
                            </span>
                          </div>
                        </div>
                        <div className="text-left flex flex-col items-end gap-2">
                          {enrollment.course?.price && (
                            <p className="font-semibold">{formatCurrency(enrollment.course.price, config)}</p>
                          )}
                          <div className="flex gap-2">
                            {enrollment.status === 'pending' && enrollment.pendingPaymentId && (
                              <Button
                                size="sm"
                                variant="accent"
                                onClick={() => navigate(`/payment/${enrollment.pendingPaymentId}`)}
                              >
                                שלם עכשיו
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={async () => {
                                if (window.confirm('האם אתה בטוח שברצונך להסיר את הלקוח מהקורס?')) {
                                  try {
                                    await courseService.removeEnrollment(enrollment._id || enrollment.id);
                                    await loadCustomerData();
                                  } catch (err) {
                                    setError(err.message);
                                  }
                                }
                              }}
                            >
                              הסר
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <p className="text-gray-500 text-center py-4">אין הרשמות לקורסים</p>
              </Card>
            )}
          </div>

          {/* Workshop Enrollments */}
          <div>
            <h3 className="text-lg font-semibold mb-4">סדנאות</h3>
            {workshopEnrollments.length > 0 ? (
              <div className="space-y-3">
                {workshopEnrollments.map((enrollment) => (
                  <Card key={enrollment._id || enrollment.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => enrollment.workshop && navigate(`/workshops/${enrollment.workshop._id || enrollment.workshop.id}`)}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{enrollment.workshop?.name || '-'}</h4>
                        {enrollment.workshop?.instructor && (
                          <p className="text-sm text-gray-500 mt-1">
                            מנחה: {enrollment.workshop.instructor.name}
                          </p>
                        )}
                        {enrollment.workshop?.date && (
                          <p className="text-sm text-gray-600 mt-1">
                            תאריך: {formatDate(enrollment.workshop.date, config)}
                          </p>
                        )}
                        {enrollment.workshop?.location && (
                          <p className="text-sm text-gray-600 mt-1">
                            מיקום: {enrollment.workshop.location}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-4">
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                            {enrollment.status === 'enrolled' ? 'רשום' : enrollment.status === 'completed' ? 'הושלם' : 'בוטל'}
                          </span>
                          <span className="text-xs text-gray-500">
                            נרשם: {formatDate(enrollment.enrolledAt, config)}
                          </span>
                        </div>
                      </div>
                      {enrollment.workshop?.price && (
                        <div className="text-left">
                          <p className="font-semibold">{formatCurrency(enrollment.workshop.price, config)}</p>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <p className="text-gray-500 text-center py-4">אין הרשמות לסדנאות</p>
              </Card>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'statistics',
      label: 'סטטיסטיקות',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <h3 className="text-lg font-semibold mb-4">סיכום פעילות</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-gray-700">סה"כ תשלומים</span>
                  <span className="font-semibold text-blue-600">{payments.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-gray-700">תשלומים הושלמו</span>
                  <span className="font-semibold text-green-600">
                    {payments.filter(p => p.status === 'completed').length}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span className="text-gray-700">קורסים נרשמו</span>
                  <span className="font-semibold text-purple-600">{courseEnrollments.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <span className="text-gray-700">סדנאות נרשמו</span>
                  <span className="font-semibold text-orange-600">{workshopEnrollments.length}</span>
                </div>
              </div>
            </Card>
            <Card>
              <h3 className="text-lg font-semibold mb-4">סטטוס הרשמות</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-gray-700">קורסים פעילים</span>
                  <span className="font-semibold text-blue-600">{stats.activeCourses}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-gray-700">קורסים הושלמו</span>
                  <span className="font-semibold text-green-600">{stats.completedCourses}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span className="text-gray-700">סדנאות פעילות</span>
                  <span className="font-semibold text-purple-600">{stats.activeWorkshops}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <span className="text-gray-700">סדנאות הושלמו</span>
                  <span className="font-semibold text-orange-600">{stats.completedWorkshops}</span>
                </div>
              </div>
            </Card>
          </div>
          {customer.createdAt && (
            <Card>
              <h3 className="text-lg font-semibold mb-4">מידע נוסף</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">תאריך יצירה</label>
                  <p className="text-lg">{formatDate(customer.createdAt, config)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">עדכון אחרון</label>
                  <p className="text-lg">{formatDate(customer.updatedAt, config)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">לקוח פעיל</label>
                  <p className="text-lg">{customer.isActive ? 'כן' : 'לא'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">מקור</label>
                  <p className="text-lg">
                    {customer.source === 'lead_conversion' ? 'המרה מליד' :
                      customer.source === 'direct' ? 'ישיר' :
                        customer.source === 'referral' ? 'המלצה' : 'אחר'}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with Actions */}
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{customer.name}</h1>
              {customer.isActive ? (
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">פעיל</span>
              ) : (
                <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">לא פעיל</span>
              )}
            </div>
            <div className="mt-2 space-y-1">
              <p className="text-gray-600 flex items-center gap-2">
                <PhoneIcon className="w-5 h-5" />
                <a href={`tel:${customer.phone}`} className="hover:text-blue-600">{customer.phone}</a>
              </p>
              {customer.email && (
                <p className="text-gray-600 flex items-center gap-2">
                  <EmailIcon className="w-5 h-5" />
                  <a href={`mailto:${customer.email}`} className="hover:text-blue-600">{customer.email}</a>
                </p>
              )}
              {customer.convertedFromLead && (
                <p className="text-sm text-gray-500">
                  הומר מליד: {customer.convertedFromLead.name || 'ליד'}
                </p>
              )}
            </div>
          </div>
          <div className="flex space-x-2 space-x-reverse">
            <Button
              onClick={handleCall}
              variant="accent"
              size="md"
            >
              התקשר
            </Button>
            <Button
              onClick={handleWhatsApp}
              variant="success"
              size="md"
            >
              ווצאפ
            </Button>
            {customer.email && (
              <Button
                onClick={handleEmail}
                variant="primary"
                size="md"
              >
                אימייל
              </Button>
            )}
            <Button
              onClick={handleEdit}
              variant="neutral"
              size="md"
            >
              ערוך
            </Button>
            <Button
              onClick={handleResetPassword}
              variant="warning"
              size="md"
            >
              אפס סיסמה
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-origami-ocean/20 to-origami-sky/20 border-origami-ocean/30 origami-card-standard">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">סה"כ שווי תשלומים</p>
              <p className="text-3xl font-bold text-origami-ocean">{formatCurrency(stats.totalPaid, config)}</p>
              {stats.pendingPayments > 0 && (
                <p className="text-xs text-gray-500 mt-1">{stats.pendingPayments} תשלומים ממתינים</p>
              )}
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-origami-mint/20 to-origami-sage/20 border-origami-mint/30 origami-card-standard">
            <div className="text-center">
              <p className="text-sm text-origami-text-secondary mb-1">אינטראקציות</p>
              <p className="text-3xl font-bold text-origami-sage">{interactions.length}</p>
              <p className="text-xs text-gray-500 mt-1">סה"כ פעילויות</p>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-origami-peach/20 to-origami-coral/20 border-origami-peach/30 origami-card-standard">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">קורסים פעילים</p>
              <p className="text-3xl font-bold text-origami-coral">{stats.activeCourses}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.completedCourses} הושלמו</p>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-origami-sand/20 to-origami-cream/20 border-origami-sand/30 origami-card-standard">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">סדנאות פעילות</p>
              <p className="text-3xl font-bold text-origami-sand">{stats.activeWorkshops}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.completedWorkshops} הושלמו</p>
            </div>
          </Card>
        </div>

        {error && (
          <Card className="bg-red-50 border-red-200">
            <p className="text-red-600">{error}</p>
          </Card>
        )}

        <Tabs tabs={tabs} />

        {/* Reset Password Modal */}
        <Modal
          isOpen={showResetPasswordModal}
          onClose={() => {
            setShowResetPasswordModal(false);
            setNewInitialPassword(null);
          }}
          title="איפוס סיסמה ראשונית"
        >
          {newInitialPassword ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium mb-2">סיסמה אופסה בהצלחה!</p>
                <p className="text-sm text-green-700 mb-3">הסיסמה הראשונית החדשה:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-white border border-green-300 rounded text-lg font-mono text-center tracking-wider">
                    {newInitialPassword}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(newInitialPassword);
                      alert('הסיסמה הועתקה ללוח');
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    העתק
                  </button>
                </div>
                <p className="text-xs text-green-700 mt-3">
                  שמור את הסיסמה במקום בטוח ושלח אותה ללקוח.
                </p>
              </div>
              <div className="flex justify-start space-x-4 space-x-reverse">
                <button
                  onClick={() => {
                    setShowResetPasswordModal(false);
                    setNewInitialPassword(null);
                    loadCustomerData();
                  }}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  סגור
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-700">
                האם אתה בטוח שברצונך לאפס את הסיסמה הראשונית של {customer.name}?
                <br />
                <strong>תיווצר סיסמה ראשונית חדשה.</strong>
              </p>
              <div className="flex justify-start space-x-4 space-x-reverse">
                <button
                  onClick={handleConfirmResetPassword}
                  disabled={resetPasswordLoading}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {resetPasswordLoading ? 'מאפס...' : 'אפס סיסמה'}
                </button>
                <button
                  onClick={() => {
                    setShowResetPasswordModal(false);
                    setNewInitialPassword(null);
                  }}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
                >
                  ביטול
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* Edit Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="ערוך לקוח"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">שם *</label>
              <input
                type="text"
                value={editData.name || ''}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">טלפון *</label>
              <input
                type="tel"
                value={editData.phone || ''}
                onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">אימייל</label>
              <input
                type="email"
                value={editData.email || ''}
                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">הערות</label>
              <textarea
                value={editData.notes || ''}
                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                rows="3"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={editData.isActive !== false}
                onChange={(e) => setEditData({ ...editData, isActive: e.target.checked })}
                className="ml-2"
              />
              <label htmlFor="isActive" className="text-sm font-medium">
                לקוח פעיל
              </label>
            </div>
            <div className="flex justify-start space-x-4 space-x-reverse">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                שמור
              </button>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
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

export default CustomerProfile;

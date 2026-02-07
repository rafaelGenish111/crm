import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import paymentService from '../../services/paymentService';
import { formatCurrency } from '../../utils/configUtils';
import { useBusinessConfig } from '../../context/BusinessConfigContext';

function PaymentPage() {
  const { paymentId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { config } = useBusinessConfig();

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  // פרטי כרטיס (מדומה)
  const [cardData, setCardData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardHolder: '',
  });

  useEffect(() => {
    if (paymentId) {
      loadPayment();
    } else {
      // אם אין paymentId, נסה לקבל מהקווארי
      const id = searchParams.get('id');
      if (id) {
        loadPaymentById(id);
      } else {
        setError('מספר תשלום לא נמצא');
        setLoading(false);
      }
    }
  }, [paymentId, searchParams]);

  const loadPayment = async () => {
    try {
      setLoading(true);
      const data = await paymentService.getPaymentById(paymentId);
      setPayment(data.payment);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentById = async (id) => {
    try {
      setLoading(true);
      const data = await paymentService.getPaymentById(id);
      setPayment(data.payment);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    // אחרי תשלום מוצלח, חזור לדף הלקוח או הקורס
    if (payment?.customer?._id) {
      navigate(`/customers/${payment.customer._id}`);
    } else if (payment?.relatedTo?.id) {
      navigate(`/courses/${payment.relatedTo.id}`);
    } else {
      navigate('/home');
    }
  };

  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\s/g, '');
    if (value.length <= 16) {
      // הוספת רווחים כל 4 ספרות
      value = value.match(/.{1,4}/g)?.join(' ') || value;
      setCardData({ ...cardData, cardNumber: value });
    }
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) {
      if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2);
      }
      setCardData({ ...cardData, expiryDate: value });
    }
  };

  const handleCvvChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 3) {
      setCardData({ ...cardData, cvv: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!cardData.cardNumber || !cardData.expiryDate || !cardData.cvv || !cardData.cardHolder) {
      setError('אנא מלא את כל השדות');
      return;
    }

    setProcessing(true);
    setError(null);

    // סימולציה של תהליך תשלום
    setTimeout(async () => {
      try {
        // עדכון סטטוס התשלום
        await paymentService.updatePaymentStatus(paymentId || payment._id, {
          status: 'completed',
          paymentMethod: 'cardcom',
          cardLastDigits: cardData.cardNumber.slice(-4),
          transactionId: `TXN${Date.now()}`,
        });

        // הצגת הודעה והפנייה
        alert('התשלום בוצע בהצלחה!');
        handlePaymentSuccess();
      } catch (err) {
        setError('שגיאה בעיבוד התשלום. אנא נסה שוב.');
        setProcessing(false);
      }
    }, 2000);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">טוען פרטי תשלום...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !payment) {
    return (
      <DashboardLayout>
        <Card className="bg-red-50 border-red-200">
          <p className="text-red-600">{error}</p>
        </Card>
      </DashboardLayout>
    );
  }

  if (!payment) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">תשלום מאובטח</h1>
          <p className="text-gray-600">Cardcom Payment Gateway</p>
        </div>

        {/* Payment Details */}
        <Card>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b">
              <span className="text-gray-600">סכום לתשלום:</span>
              <span className="text-2xl font-bold text-origami-coral">
                {formatCurrency(payment.amount, config)}
              </span>
            </div>

            {payment.description && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">תיאור:</span>
                <span className="text-gray-800">{payment.description}</span>
              </div>
            )}

            {payment.numberOfPayments > 1 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">תשלום:</span>
                <span className="text-gray-800">
                  {payment.paymentIndex} מתוך {payment.numberOfPayments}
                </span>
              </div>
            )}

            {payment.customer && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">לקוח:</span>
                <span className="text-gray-800">
                  {payment.customer.name || payment.customer}
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Payment Form */}
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                מספר כרטיס אשראי *
              </label>
              <input
                type="text"
                value={cardData.cardNumber}
                onChange={handleCardNumberChange}
                placeholder="1234 5678 9012 3456"
                maxLength="19"
                className="origami-input w-full"
                required
                dir="ltr"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  תאריך תפוגה *
                </label>
                <input
                  type="text"
                  value={cardData.expiryDate}
                  onChange={handleExpiryChange}
                  placeholder="MM/YY"
                  maxLength="5"
                  className="origami-input w-full"
                  required
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CVV *
                </label>
                <input
                  type="text"
                  value={cardData.cvv}
                  onChange={handleCvvChange}
                  placeholder="123"
                  maxLength="3"
                  className="origami-input w-full"
                  required
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                שם בעל הכרטיס *
              </label>
              <input
                type="text"
                value={cardData.cardHolder}
                onChange={(e) => setCardData({ ...cardData, cardHolder: e.target.value })}
                placeholder="שם מלא כפי שמופיע על הכרטיס"
                className="origami-input w-full"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-origami p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex space-x-4 space-x-reverse">
              <Button
                type="submit"
                variant="primary"
                disabled={processing}
                loading={processing}
                className="flex-1"
              >
                {processing ? 'מעבד תשלום...' : 'אשר תשלום'}
              </Button>
              <Button
                type="button"
                variant="neutral"
                onClick={() => navigate(-1)}
                disabled={processing}
              >
                ביטול
              </Button>
            </div>

            <div className="text-center text-xs text-gray-500 pt-4 border-t">
              <p className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                התשלום מאובטח ומצפין באמצעות SSL
              </p>
              <p className="mt-1">המידע שלך מוגן ואינו נשמר במערכת</p>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default PaymentPage;

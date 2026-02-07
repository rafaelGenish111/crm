const paymentService = require('../services/paymentService');
const Payment = require('../models/Payment');
const CourseEnrollment = require('../models/CourseEnrollment');
const WorkshopEnrollment = require('../models/WorkshopEnrollment');

const createPaymentLink = async (req, res) => {
  try {
    const { amount, currency, description, customerId } = req.body;

    if (!amount || !customerId) {
      return res.status(400).json({ message: 'Amount and customer ID are required' });
    }

    const paymentLink = await paymentService.createPaymentLink(
      amount,
      currency || 'ILS',
      description,
      { customerId }
    );

    res.json({
      message: 'Payment link created',
      paymentLink: paymentLink.paymentLink,
      paymentId: paymentLink.paymentId,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating payment link' });
  }
};

const handleWebhook = async (req, res) => {
  try {
    // TODO: Verify webhook signature from payment gateway
    const { paymentId, status, amount } = req.body;

    if (status === 'completed') {
      // Update payment status in database
      await Payment.findOneAndUpdate(
        { receiptNumber: paymentId },
        { status: 'completed' }
      );
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error processing webhook' });
  }
};

/**
 * קבלת תשלום לפי ID
 */
const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('recordedBy', 'name email');

    if (!payment) {
      return res.status(404).json({ message: 'תשלום לא נמצא' });
    }

    res.json({ payment });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ message: 'שגיאה בקבלת תשלום' });
  }
};

/**
 * עדכון תשלום ואישור השיוך
 */
const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status, paymentMethod, cardLastDigits, transactionId } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'תשלום לא נמצא' });
    }

    // עדכון התשלום
    payment.status = status || payment.status;
    if (paymentMethod) payment.paymentMethod = paymentMethod;
    if (cardLastDigits) payment.cardLastDigits = cardLastDigits;
    if (transactionId) payment.transactionId = transactionId;

    // אם התשלום הושלם, עדכן את השיוך
    if (status === 'completed' && payment.enrollmentId) {
      const EnrollmentModel = payment.enrollmentType === 'CourseEnrollment'
        ? CourseEnrollment
        : WorkshopEnrollment;

      const enrollment = await EnrollmentModel.findById(payment.enrollmentId);
      if (enrollment) {
        // בדיקה אם כל התשלומים הושלמו
        const allPayments = await Payment.find({
          enrollmentId: payment.enrollmentId,
          enrollmentType: payment.enrollmentType,
        });

        const allCompleted = allPayments.every(p => p.status === 'completed');

        if (allCompleted) {
          enrollment.status = 'approved';
          enrollment.paymentStatus = 'completed';
        } else {
          const completedCount = allPayments.filter(p => p.status === 'completed').length;
          enrollment.paymentStatus = completedCount > 0 ? 'partial' : 'pending';
        }

        await enrollment.save();
      }
    }

    await payment.save();

    const updated = await Payment.findById(paymentId)
      .populate('customer', 'name email phone')
      .populate('recordedBy', 'name email');

    res.json({
      message: 'תשלום עודכן בהצלחה',
      payment: updated,
    });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({ message: 'שגיאה בעדכון תשלום' });
  }
};

/**
 * קבלת תשלומים ממתינים ללקוח
 */
const getPendingPayments = async (req, res) => {
  try {
    const { customerId } = req.params;
    const payments = await Payment.find({
      customer: customerId,
      status: 'pending',
    })
      .populate('customer', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({ payments });
  } catch (error) {
    console.error('Get pending payments error:', error);
    res.status(500).json({ message: 'שגיאה בקבלת תשלומים ממתינים' });
  }
};

module.exports = {
  createPaymentLink,
  handleWebhook,
  getPaymentById,
  updatePaymentStatus,
  getPendingPayments,
};

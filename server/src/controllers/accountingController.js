const Transaction = require('../models/Transaction');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const Course = require('../models/Course');
const Workshop = require('../models/Workshop');

/**
 * קבלת מאזן כללי
 */
const getBalance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query);

    const revenue = transactions
      .filter(t => t.type === 'revenue')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = revenue - expenses;

    res.json({
      revenue,
      expenses,
      balance,
      profit: balance,
    });
  } catch (error) {
    res.status(500).json({ message: 'שגיאה בקבלת מאזן' });
  }
};

/**
 * פילוח רווחיות
 */
const getProfitabilityBreakdown = async (req, res) => {
  try {
    const { type } = req.query; // 'course', 'workshop', 'customer'

    if (type === 'course') {
      const courses = await Course.find({ isActive: true });
      const breakdown = await Promise.all(
        courses.map(async (course) => {
          const payments = await Payment.find({
            'relatedTo.type': 'course',
            'relatedTo.id': course._id,
            status: 'completed',
          });
          const revenue = payments.reduce((sum, p) => sum + p.amount, 0);
          return {
            name: course.name,
            revenue,
            enrollments: payments.length,
          };
        })
      );
      return res.json({ breakdown });
    }

    if (type === 'workshop') {
      const workshops = await Workshop.find({ isActive: true });
      const breakdown = await Promise.all(
        workshops.map(async (workshop) => {
          const payments = await Payment.find({
            'relatedTo.type': 'workshop',
            'relatedTo.id': workshop._id,
            status: 'completed',
          });
          const revenue = payments.reduce((sum, p) => sum + p.amount, 0);
          return {
            name: workshop.name,
            revenue,
            enrollments: payments.length,
          };
        })
      );
      return res.json({ breakdown });
    }

    res.json({ message: 'סוג פילוח לא נתמך' });
  } catch (error) {
    res.status(500).json({ message: 'שגיאה בקבלת פילוח רווחיות' });
  }
};

/**
 * קבלת דוחות
 */
const getReports = async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;
    const query = {};

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query).sort({ date: -1 });

    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ message: 'שגיאה בקבלת דוחות' });
  }
};

/**
 * קבלת חשבונות לפי לקוח
 */
const getInvoicesByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { status, startDate, endDate } = req.query;

    const query = { customer: customerId };

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.issueDate = {};
      if (startDate) query.issueDate.$gte = new Date(startDate);
      if (endDate) query.issueDate.$lte = new Date(endDate);
    }

    const invoices = await Invoice.find(query)
      .populate('customer', 'name email phone')
      .sort({ issueDate: -1 });

    // חישוב סכום כולל ותשלומים
    const invoicesWithBalance = await Promise.all(
      invoices.map(async (invoice) => {
        const payments = await Payment.find({
          invoiceNumber: invoice.invoiceNumber,
          status: 'completed',
        });

        const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
        const balance = invoice.totalAmount - paidAmount;

        return {
          ...invoice.toObject(),
          paidAmount,
          balance,
          isOverdue: invoice.dueDate && new Date() > invoice.dueDate && balance > 0,
        };
      })
    );

    res.json({ invoices: invoicesWithBalance });
  } catch (error) {
    console.error('Error getting invoices by customer:', error);
    res.status(500).json({ message: 'שגיאה בקבלת חשבונות' });
  }
};

/**
 * קבלת כל החשבונות לפי לקוחות
 */
const getInvoicesByCustomers = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.issueDate = {};
      if (startDate) query.issueDate.$gte = new Date(startDate);
      if (endDate) query.issueDate.$lte = new Date(endDate);
    }

    const invoices = await Invoice.find(query)
      .populate('customer', 'name email phone')
      .sort({ issueDate: -1 });

    // חישוב סכום כולל ותשלומים לכל חשבון
    const invoicesWithBalance = await Promise.all(
      invoices.map(async (invoice) => {
        const payments = await Payment.find({
          invoiceNumber: invoice.invoiceNumber,
          status: 'completed',
        });

        const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
        const balance = invoice.totalAmount - paidAmount;

        return {
          ...invoice.toObject(),
          paidAmount,
          balance,
          isOverdue: invoice.dueDate && new Date() > invoice.dueDate && balance > 0,
        };
      })
    );

    res.json({ invoices: invoicesWithBalance });
  } catch (error) {
    console.error('Error getting invoices by customers:', error);
    res.status(500).json({ message: 'שגיאה בקבלת חשבונות' });
  }
};

/**
 * קבלת לקוחות עם חובות
 */
const getCustomersWithDebts = async (req, res) => {
  try {
    const { minAmount, includePaid } = req.query;

    // קבלת כל הלקוחות הפעילים
    const customers = await Customer.find({ isActive: true });

    // חישוב חובות לכל לקוח
    const customersWithDebts = await Promise.all(
      customers.map(async (customer) => {
        // קבלת כל החשבונות של הלקוח
        const invoices = await Invoice.find({
          customer: customer._id,
          status: { $in: ['sent', 'draft'] }, // רק חשבונות שנשלחו או בטיוטה
        });

        let totalDebt = 0;
        let totalInvoices = 0;
        let overdueInvoices = 0;
        const invoiceDetails = [];

        for (const invoice of invoices) {
          const payments = await Payment.find({
            invoiceNumber: invoice.invoiceNumber,
            status: 'completed',
          });

          const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
          const balance = invoice.totalAmount - paidAmount;

          if (balance > 0) {
            totalDebt += balance;
            totalInvoices += 1;
            const isOverdue = invoice.dueDate && new Date() > invoice.dueDate;
            if (isOverdue) {
              overdueInvoices += 1;
            }

            invoiceDetails.push({
              invoiceNumber: invoice.invoiceNumber,
              totalAmount: invoice.totalAmount,
              paidAmount,
              balance,
              issueDate: invoice.issueDate,
              dueDate: invoice.dueDate,
              isOverdue,
              status: invoice.status,
            });
          }
        }

        return {
          customer: {
            _id: customer._id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
          },
          totalDebt,
          totalInvoices,
          overdueInvoices,
          invoices: invoiceDetails.sort((a, b) => {
            // מיון לפי תאריך פירעון (או תאריך הנפקה אם אין תאריך פירעון)
            const dateA = a.dueDate || a.issueDate;
            const dateB = b.dueDate || b.issueDate;
            return new Date(dateA) - new Date(dateB);
          }),
        };
      })
    );

    // סינון לקוחות עם חובות
    let filtered = customersWithDebts.filter((c) => c.totalDebt > 0);

    // סינון לפי סכום מינימלי
    if (minAmount) {
      const minAmountNum = parseFloat(minAmount);
      filtered = filtered.filter((c) => c.totalDebt >= minAmountNum);
    }

    // מיון לפי סכום חוב (גבוה ביותר ראשון)
    filtered.sort((a, b) => b.totalDebt - a.totalDebt);

    // חישוב סיכום כולל
    const summary = {
      totalCustomers: filtered.length,
      totalDebt: filtered.reduce((sum, c) => sum + c.totalDebt, 0),
      totalInvoices: filtered.reduce((sum, c) => sum + c.totalInvoices, 0),
      totalOverdueInvoices: filtered.reduce((sum, c) => sum + c.overdueInvoices, 0),
    };

    res.json({
      customers: filtered,
      summary,
    });
  } catch (error) {
    console.error('Error getting customers with debts:', error);
    res.status(500).json({ message: 'שגיאה בקבלת לקוחות עם חובות' });
  }
};

module.exports = {
  getBalance,
  getProfitabilityBreakdown,
  getReports,
  getInvoicesByCustomer,
  getInvoicesByCustomers,
  getCustomersWithDebts,
};

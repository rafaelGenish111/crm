const Lead = require('../models/Lead');
const LeadInteraction = require('../models/LeadInteraction');
const Customer = require('../models/Customer');

/**
 * קבלת כל הלידים
 */
const getLeads = async (req, res) => {
  try {
    const { status, source, assignedTo, search } = req.query;
    const query = {};

    if (status) query.status = status;
    if (source) query.source = source;
    if (assignedTo) query.assignedTo = assignedTo;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const leads = await Lead.find(query)
      .populate('assignedTo', 'name email')
      .populate('convertedToCustomer', 'name email')
      .sort({ createdAt: -1 });

    res.json({ leads });
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({ message: 'שגיאה בקבלת לידים' });
  }
};

/**
 * קבלת ליד לפי ID
 */
const getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('convertedToCustomer', 'name email');

    if (!lead) {
      return res.status(404).json({ message: 'ליד לא נמצא' });
    }

    // קבלת אינטראקציות
    const interactions = await LeadInteraction.find({ lead: lead._id })
      .populate('performedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ lead, interactions });
  } catch (error) {
    res.status(500).json({ message: 'שגיאה בקבלת ליד' });
  }
};

/**
 * יצירת ליד חדש
 */
const createLead = async (req, res) => {
  try {
    const { name, email, phone, source, sourceDetails, notes, assignedTo } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ message: 'שם וטלפון הם שדות חובה' });
    }

    const lead = await Lead.create({
      name,
      email,
      phone,
      source: source || 'other',
      sourceDetails,
      notes,
      assignedTo: assignedTo || req.user._id,
    });

    res.status(201).json({
      message: 'ליד נוצר בהצלחה',
      lead,
    });
  } catch (error) {
    console.error('Create lead error:', error);
    res.status(500).json({ message: 'שגיאה ביצירת ליד' });
  }
};

/**
 * עדכון ליד
 */
const updateLead = async (req, res) => {
  try {
    const { name, email, phone, source, sourceDetails, status, notes, assignedTo } = req.body;
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      {
        name,
        email,
        phone,
        source,
        sourceDetails,
        status,
        notes,
        assignedTo,
      },
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name email');

    if (!lead) {
      return res.status(404).json({ message: 'ליד לא נמצא' });
    }

    res.json({
      message: 'ליד עודכן בהצלחה',
      lead,
    });
  } catch (error) {
    res.status(500).json({ message: 'שגיאה בעדכון ליד' });
  }
};

/**
 * מחיקת ליד
 */
const deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);

    if (!lead) {
      return res.status(404).json({ message: 'ליד לא נמצא' });
    }

    // מחיקת אינטראקציות קשורות
    await LeadInteraction.deleteMany({ lead: lead._id });

    res.json({ message: 'ליד נמחק בהצלחה' });
  } catch (error) {
    res.status(500).json({ message: 'שגיאה במחיקת ליד' });
  }
};

/**
 * המרת ליד ללקוח
 */
const convertToCustomer = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ message: 'ליד לא נמצא' });
    }

    if (lead.convertedToCustomer) {
      return res.status(400).json({ message: 'ליד זה כבר הומר ללקוח' });
    }

    // יצירת לקוח חדש
    const customer = await Customer.create({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      source: lead.source,
      convertedFromLead: lead._id,
    });

    // עדכון ליד
    lead.convertedToCustomer = customer._id;
    lead.convertedAt = new Date();
    lead.status = 'converted';
    await lead.save();

    res.json({
      message: 'ליד הומר ללקוח בהצלחה',
      customer,
      lead,
    });
  } catch (error) {
    console.error('Convert lead error:', error);
    res.status(500).json({ message: 'שגיאה בהמרת ליד ללקוח' });
  }
};

module.exports = {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  convertToCustomer,
};

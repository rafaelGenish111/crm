const Workshop = require('../models/Workshop');
const WorkshopEnrollment = require('../models/WorkshopEnrollment');

const getWorkshops = async (req, res) => {
  try {
    const { instructor, date, search } = req.query;
    const query = {};

    if (instructor) query.instructor = instructor;
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const workshops = await Workshop.find(query)
      .populate('instructor', 'name email')
      .sort({ date: -1 });

    res.json({ workshops });
  } catch (error) {
    res.status(500).json({ message: 'שגיאה בקבלת סדנאות' });
  }
};

const getWorkshopById = async (req, res) => {
  try {
    const workshop = await Workshop.findById(req.params.id)
      .populate('instructor', 'name email');

    if (!workshop) {
      return res.status(404).json({ message: 'סדנה לא נמצאה' });
    }

    const enrollments = await WorkshopEnrollment.find({ workshop: workshop._id })
      .populate('customer', 'name email phone')
      .populate('lead', 'name phone email')
      .sort({ enrolledAt: -1 });

    res.json({ workshop, enrollments });
  } catch (error) {
    res.status(500).json({ message: 'שגיאה בקבלת סדנה' });
  }
};

const createWorkshop = async (req, res) => {
  try {
    const workshop = await Workshop.create(req.body);
    res.status(201).json({ message: 'סדנה נוצרה בהצלחה', workshop });
  } catch (error) {
    res.status(500).json({ message: 'שגיאה ביצירת סדנה' });
  }
};

const updateWorkshop = async (req, res) => {
  try {
    const workshop = await Workshop.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('instructor', 'name email');

    if (!workshop) {
      return res.status(404).json({ message: 'סדנה לא נמצאה' });
    }

    res.json({ message: 'סדנה עודכנה בהצלחה', workshop });
  } catch (error) {
    res.status(500).json({ message: 'שגיאה בעדכון סדנה' });
  }
};

const deleteWorkshop = async (req, res) => {
  try {
    const workshop = await Workshop.findByIdAndDelete(req.params.id);
    if (!workshop) {
      return res.status(404).json({ message: 'סדנה לא נמצאה' });
    }
    await WorkshopEnrollment.deleteMany({ workshop: workshop._id });
    res.json({ message: 'סדנה נמחקה בהצלחה' });
  } catch (error) {
    res.status(500).json({ message: 'שגיאה במחיקת סדנה' });
  }
};

const enrollInWorkshop = async (req, res) => {
  try {
    const { customerId, leadId, leadData, notes } = req.body;
    const workshopId = req.params.id;

    let finalCustomerId = customerId;
    let finalLeadId = leadId;

    // אם נוצר ליד חדש
    if (leadData && !leadId && !customerId) {
      const Lead = require('../models/Lead');
      const newLead = await Lead.create({
        name: leadData.name,
        email: leadData.email,
        phone: leadData.phone,
        source: 'other',
      });
      finalLeadId = newLead._id;
    }

    if (!finalCustomerId && !finalLeadId) {
      return res.status(400).json({ message: 'נדרש לקוח או ליד' });
    }

    const enrollment = await WorkshopEnrollment.create({
      workshop: workshopId,
      customer: finalCustomerId,
      lead: finalLeadId,
      notes,
    });

    res.status(201).json({ message: 'נרשם לסדנה בהצלחה', enrollment });
  } catch (error) {
    res.status(500).json({ message: 'שגיאה ברישום לסדנה' });
  }
};

module.exports = {
  getWorkshops,
  getWorkshopById,
  createWorkshop,
  updateWorkshop,
  deleteWorkshop,
  enrollInWorkshop,
};

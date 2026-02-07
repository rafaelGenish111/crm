const Event = require('../models/Event');
const EventEnrollment = require('../models/EventEnrollment');
const Customer = require('../models/Customer');
const Lead = require('../models/Lead');

/**
 * Get all events
 */
const getEvents = async (req, res) => {
  try {
    const { type, status, isActive, search } = req.query;

    const query = {};

    if (type) query.type = type;
    if (status) query.status = status;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const events = await Event.find(query)
      .populate('organizer', 'name email')
      .sort({ startDate: -1 });

    // Get enrollment counts for each event
    const eventsWithCounts = await Promise.all(
      events.map(async (event) => {
        const enrollmentCount = await EventEnrollment.countDocuments({
          event: event._id,
          status: { $in: ['pending', 'confirmed', 'attended'] },
        });

        const eventObj = event.toObject();
        eventObj.enrollmentCount = enrollmentCount;
        eventObj.availableSpots = event.capacity - enrollmentCount;

        return eventObj;
      })
    );

    res.json({ events: eventsWithCounts });
  } catch (error) {
    console.error('Error getting events:', error);
    res.status(500).json({ message: 'שגיאה בקבלת אירועים' });
  }
};

/**
 * Get event by ID
 */
const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id).populate('organizer', 'name email');

    if (!event) {
      return res.status(404).json({ message: 'אירוע לא נמצא' });
    }

    // Get enrollments
    const enrollments = await EventEnrollment.find({ event: id })
      .populate('customer', 'name email phone')
      .populate('lead', 'name email phone')
      .sort({ registeredAt: -1 });

    // Get enrollment count
    const enrollmentCount = await EventEnrollment.countDocuments({
      event: id,
      status: { $in: ['pending', 'confirmed', 'attended'] },
    });

    const eventObj = event.toObject();
    eventObj.enrollments = enrollments;
    eventObj.enrollmentCount = enrollmentCount;
    eventObj.availableSpots = event.capacity - enrollmentCount;

    res.json({ event: eventObj });
  } catch (error) {
    console.error('Error getting event:', error);
    res.status(500).json({ message: 'שגיאה בקבלת אירוע' });
  }
};

/**
 * Create event
 */
const createEvent = async (req, res) => {
  try {
    const event = await Event.create({
      ...req.body,
      organizer: req.user._id,
    });

    await event.populate('organizer', 'name email');

    res.status(201).json({
      message: 'אירוע נוצר בהצלחה',
      event,
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'שגיאה ביצירת אירוע' });
  }
};

/**
 * Update event
 */
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findByIdAndUpdate(
      id,
      { ...req.body },
      { new: true, runValidators: true }
    ).populate('organizer', 'name email');

    if (!event) {
      return res.status(404).json({ message: 'אירוע לא נמצא' });
    }

    res.json({
      message: 'אירוע עודכן בהצלחה',
      event,
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'שגיאה בעדכון אירוע' });
  }
};

/**
 * Delete event
 */
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if there are enrollments
    const enrollmentCount = await EventEnrollment.countDocuments({ event: id });

    if (enrollmentCount > 0) {
      return res.status(400).json({
        message: 'לא ניתן למחוק אירוע שיש לו רישומים. אנא בטל את האירוע במקום.',
      });
    }

    const event = await Event.findByIdAndDelete(id);

    if (!event) {
      return res.status(404).json({ message: 'אירוע לא נמצא' });
    }

    res.json({ message: 'אירוע נמחק בהצלחה' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'שגיאה במחיקת אירוע' });
  }
};

/**
 * Add participant to event
 */
const addParticipant = async (req, res) => {
  try {
    const { id } = req.params;
    const { customerId, leadId, amountPaid, notes } = req.body;

    if (!customerId && !leadId) {
      return res.status(400).json({ message: 'נדרש לקוח או ליד' });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'אירוע לא נמצא' });
    }

    // Check capacity
    const enrollmentCount = await EventEnrollment.countDocuments({
      event: id,
      status: { $in: ['pending', 'confirmed', 'attended'] },
    });

    if (enrollmentCount >= event.capacity) {
      return res.status(400).json({ message: 'האירוע מלא' });
    }

    // Check if already enrolled
    const existingEnrollment = await EventEnrollment.findOne({
      event: id,
      $or: [{ customer: customerId }, { lead: leadId }],
    });

    if (existingEnrollment) {
      return res.status(400).json({ message: 'המשתתף כבר רשום לאירוע' });
    }

    // Verify customer or lead exists
    if (customerId) {
      const customer = await Customer.findById(customerId);
      if (!customer) {
        return res.status(404).json({ message: 'לקוח לא נמצא' });
      }
    }

    if (leadId) {
      const lead = await Lead.findById(leadId);
      if (!lead) {
        return res.status(404).json({ message: 'ליד לא נמצא' });
      }
    }

    const enrollment = await EventEnrollment.create({
      event: id,
      customer: customerId || null,
      lead: leadId || null,
      amountPaid: amountPaid || 0,
      notes,
      paymentStatus: amountPaid >= event.price ? 'completed' : amountPaid > 0 ? 'partial' : 'pending',
    });

    await enrollment.populate('customer', 'name email phone');
    await enrollment.populate('lead', 'name email phone');

    res.status(201).json({
      message: 'משתתף נוסף בהצלחה',
      enrollment,
    });
  } catch (error) {
    console.error('Error adding participant:', error);
    res.status(500).json({ message: 'שגיאה בהוספת משתתף' });
  }
};

/**
 * Update enrollment status
 */
const updateEnrollment = async (req, res) => {
  try {
    const { id, enrollmentId } = req.params;
    const { status, paymentStatus, amountPaid, notes } = req.body;

    const enrollment = await EventEnrollment.findOne({
      _id: enrollmentId,
      event: id,
    });

    if (!enrollment) {
      return res.status(404).json({ message: 'רישום לא נמצא' });
    }

    if (status) enrollment.status = status;
    if (paymentStatus) enrollment.paymentStatus = paymentStatus;
    if (amountPaid !== undefined) enrollment.amountPaid = amountPaid;
    if (notes !== undefined) enrollment.notes = notes;

    await enrollment.save();

    await enrollment.populate('customer', 'name email phone');
    await enrollment.populate('lead', 'name email phone');

    res.json({
      message: 'רישום עודכן בהצלחה',
      enrollment,
    });
  } catch (error) {
    console.error('Error updating enrollment:', error);
    res.status(500).json({ message: 'שגיאה בעדכון רישום' });
  }
};

/**
 * Remove participant from event
 */
const removeParticipant = async (req, res) => {
  try {
    const { id, enrollmentId } = req.params;

    const enrollment = await EventEnrollment.findOneAndDelete({
      _id: enrollmentId,
      event: id,
    });

    if (!enrollment) {
      return res.status(404).json({ message: 'רישום לא נמצא' });
    }

    res.json({ message: 'משתתף הוסר בהצלחה' });
  } catch (error) {
    console.error('Error removing participant:', error);
    res.status(500).json({ message: 'שגיאה בהסרת משתתף' });
  }
};

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  addParticipant,
  updateEnrollment,
  removeParticipant,
};

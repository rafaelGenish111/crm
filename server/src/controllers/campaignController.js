const Campaign = require('../models/Campaign');
const CampaignPerformance = require('../models/CampaignPerformance');

const getCampaigns = async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = {};

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const campaigns = await Campaign.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ campaigns });
  } catch (error) {
    res.status(500).json({ message: 'שגיאה בקבלת קמפיינים' });
  }
};

const getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!campaign) {
      return res.status(404).json({ message: 'קמפיין לא נמצא' });
    }

    const performance = await CampaignPerformance.find({ campaign: campaign._id })
      .sort({ date: -1 });

    res.json({ campaign, performance });
  } catch (error) {
    res.status(500).json({ message: 'שגיאה בקבלת קמפיין' });
  }
};

const createCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.create({
      ...req.body,
      createdBy: req.user._id,
    });
    res.status(201).json({ message: 'קמפיין נוצר בהצלחה', campaign });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({
      message: 'שגיאה ביצירת קמפיין',
      error: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
};

const updateCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('createdBy', 'name email');

    if (!campaign) {
      return res.status(404).json({ message: 'קמפיין לא נמצא' });
    }

    res.json({ message: 'קמפיין עודכן בהצלחה', campaign });
  } catch (error) {
    res.status(500).json({ message: 'שגיאה בעדכון קמפיין' });
  }
};

const deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndDelete(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'קמפיין לא נמצא' });
    }
    await CampaignPerformance.deleteMany({ campaign: campaign._id });
    res.json({ message: 'קמפיין נמחק בהצלחה' });
  } catch (error) {
    res.status(500).json({ message: 'שגיאה במחיקת קמפיין' });
  }
};

module.exports = {
  getCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
};

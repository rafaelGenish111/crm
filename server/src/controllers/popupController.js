const Campaign = require('../models/Campaign');
const CampaignPerformance = require('../models/CampaignPerformance');
const Customer = require('../models/Customer');
const Lead = require('../models/Lead');
const CourseEnrollment = require('../models/CourseEnrollment');
const WorkshopEnrollment = require('../models/WorkshopEnrollment');

// Get popup by token (public endpoint)
const getPopupByToken = async (req, res) => {
  try {
    const { token } = req.params;
    const { customerId, leadId, domain } = req.query;

    const campaign = await Campaign.findOne({ embedToken: token });

    if (!campaign) {
      return res.status(404).json({ message: 'קמפיין לא נמצא' });
    }

    // Check if popup is enabled
    if (!campaign.popup || !campaign.popup.enabled) {
      return res.status(404).json({ message: 'פופאפ לא פעיל' });
    }

    // Check if campaign is active
    if (campaign.status !== 'active') {
      return res.status(404).json({ message: 'קמפיין לא פעיל' });
    }

    // Check date range
    const now = new Date();
    if (campaign.startDate && campaign.startDate > now) {
      return res.status(404).json({ message: 'קמפיין טרם התחיל' });
    }
    if (campaign.endDate && campaign.endDate < now) {
      return res.status(404).json({ message: 'קמפיין הסתיים' });
    }

    // Check targeting
    const targeting = campaign.targeting || {};

    // If showToAll is true, show to everyone
    if (!targeting.showToAll) {
      let shouldShow = false;

      // Check domain targeting
      if (targeting.allowedDomains && targeting.allowedDomains.length > 0) {
        if (domain && targeting.allowedDomains.includes(domain)) {
          shouldShow = true;
        } else if (!domain) {
          // If no domain provided, don't show (unless other conditions match)
        }
      }

      // Check customer targeting
      if (customerId && targeting.customerIds && targeting.customerIds.length > 0) {
        const customerIdObj = customerId.toString();
        if (targeting.customerIds.some(id => id.toString() === customerIdObj)) {
          shouldShow = true;
        }
      }

      // Check lead targeting
      if (leadId && targeting.leadIds && targeting.leadIds.length > 0) {
        const leadIdObj = leadId.toString();
        if (targeting.leadIds.some(id => id.toString() === leadIdObj)) {
          shouldShow = true;
        }
      }

      // Check course targeting
      if (targeting.courseIds && targeting.courseIds.length > 0) {
        if (customerId) {
          // Check if customer is enrolled in any of the targeted courses
          const enrollments = await CourseEnrollment.find({
            course: { $in: targeting.courseIds },
            customer: customerId,
            status: { $in: ['pending', 'approved', 'enrolled'] },
          });
          if (enrollments.length > 0) {
            shouldShow = true;
          }
        }
        if (leadId) {
          // Check if lead is enrolled in any of the targeted courses
          const enrollments = await CourseEnrollment.find({
            course: { $in: targeting.courseIds },
            lead: leadId,
            status: { $in: ['pending', 'approved', 'enrolled'] },
          });
          if (enrollments.length > 0) {
            shouldShow = true;
          }
        }
      }

      // Check workshop targeting
      if (targeting.workshopIds && targeting.workshopIds.length > 0) {
        if (customerId) {
          // Check if customer is enrolled in any of the targeted workshops
          const enrollments = await WorkshopEnrollment.find({
            workshop: { $in: targeting.workshopIds },
            customer: customerId,
            status: { $in: ['enrolled', 'attended'] },
          });
          if (enrollments.length > 0) {
            shouldShow = true;
          }
        }
        if (leadId) {
          // Check if lead is enrolled in any of the targeted workshops
          const enrollments = await WorkshopEnrollment.find({
            workshop: { $in: targeting.workshopIds },
            lead: leadId,
            status: { $in: ['enrolled', 'attended'] },
          });
          if (enrollments.length > 0) {
            shouldShow = true;
          }
        }
      }

      // If no targeting rules match, don't show
      if (!shouldShow) {
        return res.status(404).json({ message: 'לא מותאם לקהל היעד' });
      }
    }

    // Return popup data
    res.json({
      popup: {
        title: campaign.popup.title,
        message: campaign.popup.message,
        imageUrl: campaign.popup.imageUrl,
        ctaText: campaign.popup.ctaText,
        ctaUrl: campaign.popup.ctaUrl,
        position: campaign.popup.position,
        delay: campaign.popup.delay,
        backgroundColor: campaign.popup.backgroundColor,
        textColor: campaign.popup.textColor,
        buttonColor: campaign.popup.buttonColor,
        buttonTextColor: campaign.popup.buttonTextColor,
      },
      campaignId: campaign._id,
    });
  } catch (error) {
    console.error('Error getting popup:', error);
    res.status(500).json({ message: 'שגיאה בקבלת פופאפ' });
  }
};

// Record popup impression
const recordImpression = async (req, res) => {
  try {
    const { token } = req.params;
    const { customerId, leadId, domain } = req.body;

    const campaign = await Campaign.findOne({ embedToken: token });
    if (!campaign) {
      return res.status(404).json({ message: 'קמפיין לא נמצא' });
    }

    // Find or create today's performance record
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let performance = await CampaignPerformance.findOne({
      campaign: campaign._id,
      date: today,
    });

    if (!performance) {
      performance = await CampaignPerformance.create({
        campaign: campaign._id,
        date: today,
        impressions: 1,
      });
    } else {
      performance.impressions = (performance.impressions || 0) + 1;
      await performance.save();
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error recording impression:', error);
    res.status(500).json({ message: 'שגיאה ברישום הצגה' });
  }
};

// Record popup click
const recordClick = async (req, res) => {
  try {
    const { token } = req.params;
    const { customerId, leadId, domain } = req.body;

    const campaign = await Campaign.findOne({ embedToken: token });
    if (!campaign) {
      return res.status(404).json({ message: 'קמפיין לא נמצא' });
    }

    // Find or create today's performance record
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let performance = await CampaignPerformance.findOne({
      campaign: campaign._id,
      date: today,
    });

    if (!performance) {
      performance = await CampaignPerformance.create({
        campaign: campaign._id,
        date: today,
        clicks: 1,
      });
    } else {
      performance.clicks = (performance.clicks || 0) + 1;
      await performance.save();
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error recording click:', error);
    res.status(500).json({ message: 'שגיאה ברישום קליק' });
  }
};

// Get embed code for campaign (protected endpoint)
const getEmbedCode = async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findById(id);

    if (!campaign) {
      return res.status(404).json({ message: 'קמפיין לא נמצא' });
    }

    // Ensure popup is enabled and generate token if needed
    if (!campaign.popup || !campaign.popup.enabled) {
      return res.status(400).json({ message: 'פופאפ לא מופעל לקמפיין זה' });
    }

    if (!campaign.embedToken) {
      const crypto = require('crypto');
      campaign.embedToken = crypto.randomBytes(32).toString('hex');
      await campaign.save();
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const apiUrl = process.env.API_URL || req.protocol + '://' + req.get('host');
    const embedScript = `<script>
(function() {
  var script = document.createElement('script');
  script.src = '${apiUrl}/api/popup/embed.js?token=${campaign.embedToken}';
  script.async = true;
  document.head.appendChild(script);
})();
</script>`;

    res.json({
      embedCode: embedScript,
      embedToken: campaign.embedToken,
      directUrl: `${apiUrl}/api/popup/${campaign.embedToken}`,
    });
  } catch (error) {
    console.error('Error getting embed code:', error);
    res.status(500).json({ message: 'שגיאה בקבלת קוד הטמעה' });
  }
};

module.exports = {
  getPopupByToken,
  recordImpression,
  recordClick,
  getEmbedCode,
};

const whatsappBotService = require('../services/whatsappBotService');

// Webhook handler for incoming WhatsApp messages
const handleWebhook = async (req, res) => {
  try {
    const { from, message } = req.body;

    if (!from || !message) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Process message with bot
    const result = await whatsappBotService.handleIncomingMessage(from, message);

    res.json(result);
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    res.status(500).json({ message: 'Error processing webhook' });
  }
};

// Webhook verification (for WhatsApp Business API)
const verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
};

module.exports = {
  handleWebhook,
  verifyWebhook,
};

const whatsappService = require('./whatsappService');
const aiService = require('./aiService');

class WhatsAppBotService {
  async handleIncomingMessage(from, message) {
    try {
      // Get AI response
      const aiResponse = await aiService.generateResponse(message, {
        context: 'whatsapp',
        customerPhone: from,
      });

      // Send response via WhatsApp
      await whatsappService.sendMessage(from, aiResponse);

      return {
        success: true,
        response: aiResponse,
      };
    } catch (error) {
      console.error('WhatsApp bot error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = new WhatsAppBotService();

const aiService = require('../services/aiService');
const ChatMessage = require('../models/ChatMessage');
const KnowledgeBase = require('../models/KnowledgeBase');
const CourseEnrollment = require('../models/CourseEnrollment');

/**
 * Send message to AI bot (student)
 */
const sendMessage = async (req, res) => {
  try {
    const { message, courseId, intent } = req.body;
    const studentId = req.student._id; // From student auth middleware

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'הודעה היא שדה חובה' });
    }

    // Generate AI response with RAG
    const startTime = Date.now();
    const aiResponse = await aiService.generateResponse(message, {
      studentId: studentId.toString(),
      courseId,
      intent: intent || 'question',
    });
    const responseTime = Date.now() - startTime;

    // Validate AI response
    if (!aiResponse || !aiResponse.response || aiResponse.response.trim().length === 0) {
      return res.status(500).json({
        message: 'מצטער, לא הצלחתי ליצור תשובה. אנא נסה שוב מאוחר יותר.',
        error: aiResponse?.error || 'Empty response from AI service'
      });
    }

    // Save user message
    const userMessage = await ChatMessage.create({
      student: studentId,
      role: 'user',
      message: message.trim(),
      context: {
        courseId,
        intent: intent || 'question',
        knowledgeSources: aiResponse.knowledgeSources || [],
      },
    });

    // Save AI response
    const assistantMessage = await ChatMessage.create({
      student: studentId,
      role: 'assistant',
      message: aiResponse.response.trim(),
      context: {
        courseId,
        intent: intent || 'question',
        knowledgeSources: aiResponse.knowledgeSources || [],
      },
      metadata: {
        tokensUsed: aiResponse.tokensUsed || 0,
        model: aiService.model,
        responseTime,
      },
    });

    res.json({
      message: assistantMessage,
      knowledgeSources: aiResponse.knowledgeSources || [],
    });
  } catch (error) {
    console.error('Error in sendMessage:', error);
    res.status(500).json({ message: 'שגיאה בשליחת הודעה לבוט' });
  }
};

/**
 * Get chat history for student
 */
const getChatHistory = async (req, res) => {
  try {
    const studentId = req.student._id;
    const { courseId, limit = 50 } = req.query;

    const query = {
      student: studentId,
    };

    if (courseId) {
      query['context.courseId'] = courseId;
    }

    const messages = await ChatMessage.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('context.knowledgeSources.knowledgeId', 'title category')
      .populate('context.courseId', 'name');

    res.json({
      messages: messages.reverse(), // Reverse to show oldest first
    });
  } catch (error) {
    console.error('Error getting chat history:', error);
    res.status(500).json({ message: 'שגיאה בקבלת היסטוריית שיחה' });
  }
};

/**
 * Generate exam question
 */
const generateExamQuestion = async (req, res) => {
  try {
    const { courseId, difficulty = 'medium' } = req.body;
    const studentId = req.student._id;

    // Verify student is enrolled in course
    const enrollment = await CourseEnrollment.findOne({
      customer: studentId,
      course: courseId,
    });

    if (!enrollment) {
      return res.status(403).json({ message: 'אינך רשום לקורס זה' });
    }

    const examData = await aiService.generateExamQuestion(courseId, difficulty);

    // Save exam question
    const examMessage = await ChatMessage.create({
      student: studentId,
      role: 'assistant',
      message: examData.question,
      context: {
        courseId,
        intent: 'exam',
        knowledgeSources: examData.knowledgeSources.map((id) => ({
          knowledgeId: id,
        })),
      },
      examData: {
        isExam: true,
        question: examData.question,
        correctAnswer: examData.correctAnswer,
        explanation: examData.explanation,
      },
    });

    res.json({
      question: examMessage,
      difficulty,
    });
  } catch (error) {
    console.error('Error generating exam question:', error);
    res.status(500).json({ message: 'שגיאה ביצירת שאלת בחינה' });
  }
};

/**
 * Submit exam answer
 */
const submitExamAnswer = async (req, res) => {
  try {
    const { questionId, answer } = req.body;
    const studentId = req.student._id;

    if (!answer || answer.trim().length === 0) {
      return res.status(400).json({ message: 'תשובה היא שדה חובה' });
    }

    // Get the exam question
    const examQuestion = await ChatMessage.findById(questionId);

    if (!examQuestion || !examQuestion.examData?.isExam) {
      return res.status(404).json({ message: 'שאלת בחינה לא נמצאה' });
    }

    if (examQuestion.student.toString() !== studentId.toString()) {
      return res.status(403).json({ message: 'אין לך הרשאה לשאלה זו' });
    }

    // Evaluate answer
    const evaluation = await aiService.evaluateAnswer(
      examQuestion.examData.question,
      examQuestion.examData.correctAnswer,
      answer.trim()
    );

    // Update exam question with student answer
    examQuestion.examData.studentAnswer = answer.trim();
    examQuestion.examData.score = evaluation.score;
    examQuestion.examData.feedback = evaluation.feedback;
    await examQuestion.save();

    // Save student answer as message
    await ChatMessage.create({
      student: studentId,
      role: 'user',
      message: answer.trim(),
      context: {
        courseId: examQuestion.context.courseId,
        intent: 'exam',
      },
      examData: {
        isExam: true,
        question: examQuestion.examData.question,
        correctAnswer: examQuestion.examData.correctAnswer,
        studentAnswer: answer.trim(),
        score: evaluation.score,
        feedback: evaluation.feedback,
      },
    });

    res.json({
      score: evaluation.score,
      feedback: evaluation.feedback,
      correctAnswer: examQuestion.examData.correctAnswer,
      explanation: examQuestion.examData.explanation,
    });
  } catch (error) {
    console.error('Error submitting exam answer:', error);
    res.status(500).json({ message: 'שגיאה בשליחת תשובה' });
  }
};

/**
 * Generate study plan
 */
const generateStudyPlan = async (req, res) => {
  try {
    const { courseId } = req.body;
    const studentId = req.student._id;

    // Verify enrollment
    const enrollment = await CourseEnrollment.findOne({
      customer: studentId,
      course: courseId,
    });

    if (!enrollment) {
      return res.status(403).json({ message: 'אינך רשום לקורס זה' });
    }

    const studyPlan = await aiService.generateStudyPlan(studentId, courseId);

    // Save study plan as message
    await ChatMessage.create({
      student: studentId,
      role: 'assistant',
      message: studyPlan.studyPlan,
      context: {
        courseId,
        intent: 'study_plan',
        knowledgeSources: studyPlan.knowledgeSources.map((id) => ({
          knowledgeId: id,
        })),
      },
    });

    res.json({
      studyPlan: studyPlan.studyPlan,
      knowledgeSources: studyPlan.knowledgeSources,
    });
  } catch (error) {
    console.error('Error generating study plan:', error);
    res.status(500).json({ message: 'שגיאה ביצירת תוכנית לימודים' });
  }
};

module.exports = {
  sendMessage,
  getChatHistory,
  generateExamQuestion,
  submitExamAnswer,
  generateStudyPlan,
};

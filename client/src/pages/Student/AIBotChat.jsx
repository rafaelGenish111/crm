import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StudentLayout from '../../components/Layout/StudentLayout';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import aiBotService from '../../services/aiBotService';
import studentService from '../../services/studentService';
import { useStudentAuth } from '../../context/StudentAuthContext';

function AIBotChat() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { student } = useStudentAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [course, setCourse] = useState(null);
  const [examMode, setExamMode] = useState(false);
  const [currentExamQuestion, setCurrentExamQuestion] = useState(null);
  const [examAnswer, setExamAnswer] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // טעינת היסטוריית צ'אט רק אם התלמיד מחובר
    if (student) {
      loadChatHistory();
      if (courseId) {
        loadCourse();
      }
    }
  }, [courseId, student]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadCourse = async () => {
    try {
      const data = await studentService.getCourseDetails(courseId);
      setCourse(data.course);
    } catch (err) {
      console.error('Error loading course:', err);
    }
  };

  const loadChatHistory = async () => {
    try {
      setLoading(true);
      const data = await aiBotService.getChatHistory(courseId, 50);
      setMessages(data.messages || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || sending) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setSending(true);
    setError(null);

    // Add user message to UI immediately
    const tempUserMessage = {
      _id: `temp-${Date.now()}`,
      role: 'user',
      message: userMessage,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const response = await aiBotService.sendMessage(userMessage, courseId, 'question');

      // Remove temp message and add real messages
      setMessages((prev) => {
        const filtered = prev.filter((m) => m._id !== tempUserMessage._id);
        return [...filtered, response.message];
      });
    } catch (err) {
      setError(err.message);
      // Remove temp message on error
      setMessages((prev) => prev.filter((m) => m._id !== tempUserMessage._id));
    } finally {
      setSending(false);
    }
  };

  const handleGenerateExam = async () => {
    if (!courseId) {
      setError('נא לבחור קורס תחילה');
      return;
    }

    try {
      setSending(true);
      setError(null);
      const response = await aiBotService.generateExamQuestion(courseId, 'medium');
      setCurrentExamQuestion(response.question);
      setExamMode(true);
      setExamAnswer('');

      // Add exam question to messages
      setMessages((prev) => [...prev, response.question]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleSubmitExamAnswer = async (e) => {
    e.preventDefault();
    if (!examAnswer.trim() || !currentExamQuestion) return;

    try {
      setSending(true);
      setError(null);
      const response = await aiBotService.submitExamAnswer(
        currentExamQuestion._id,
        examAnswer.trim()
      );

      // Add student answer and feedback to messages
      const studentAnswerMsg = {
        _id: `answer-${Date.now()}`,
        role: 'user',
        message: examAnswer.trim(),
        createdAt: new Date(),
      };

      const feedbackMsg = {
        _id: `feedback-${Date.now()}`,
        role: 'assistant',
        message: `ציון: ${response.score}/100\n\n${response.feedback}\n\nתשובה נכונה: ${response.correctAnswer}\n\nהסבר: ${response.explanation || ''}`,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, studentAnswerMsg, feedbackMsg]);
      setExamMode(false);
      setCurrentExamQuestion(null);
      setExamAnswer('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleGenerateStudyPlan = async () => {
    if (!courseId) {
      setError('נא לבחור קורס תחילה');
      return;
    }

    try {
      setSending(true);
      setError(null);
      const response = await aiBotService.generateStudyPlan(courseId);

      const studyPlanMsg = {
        _id: `studyplan-${Date.now()}`,
        role: 'assistant',
        message: `תוכנית לימודים מותאמת אישית:\n\n${response.studyPlan}`,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, studyPlanMsg]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" text="טוען שיחה..." />
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto px-4 py-6 h-[calc(100vh-120px)] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">עוזר אישי AI</h1>
            {course && (
              <p className="text-sm text-gray-600 mt-1">קורס: {course.name}</p>
            )}
          </div>
          <button
            onClick={() => navigate('/student')}
            className="text-gray-600 hover:text-gray-800"
          >
            ← חזרה
          </button>
        </div>

        {error && (
          <Card className="bg-red-50 border-red-200 mb-4">
            <p className="text-red-600 text-sm">{error}</p>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {courseId && (
            <>
              <button
                onClick={handleGenerateExam}
                disabled={sending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                🎯 בחינה
              </button>
              <button
                onClick={handleGenerateStudyPlan}
                disabled={sending}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                📚 תוכנית לימודים
              </button>
            </>
          )}
        </div>

        {/* Messages */}
        <Card className="flex-1 flex flex-col overflow-hidden mb-4">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p className="text-lg mb-2">👋 שלום! אני העוזר האישי שלך</p>
                <p className="text-sm">אני כאן לעזור לך להתקדם בתוכנית הלימודים</p>
                <p className="text-sm mt-2">שאל אותי כל שאלה, או בחר פעולה מהכפתורים למעלה</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message._id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                      }`}
                  >
                    <p className="whitespace-pre-wrap text-sm">{message.message}</p>
                    {message.context?.knowledgeSources && message.context.knowledgeSources.length > 0 && (
                      <p className="text-xs opacity-70 mt-2">
                        מקורות: {message.context.knowledgeSources.map((kb) => kb.title || kb.knowledgeId?.title).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3">
                  <LoadingSpinner size="sm" text="מחשב..." />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </Card>

        {/* Exam Mode Input */}
        {examMode && currentExamQuestion && (
          <Card className="mb-4 bg-yellow-50 border-yellow-200">
            <form onSubmit={handleSubmitExamAnswer} className="space-y-2">
              <p className="text-sm font-semibold text-gray-900 mb-2">תשובתך:</p>
              <textarea
                value={examAnswer}
                onChange={(e) => setExamAnswer(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="3"
                placeholder="הזן את תשובתך כאן..."
                required
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={sending || !examAnswer.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  שלח תשובה
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExamMode(false);
                    setCurrentExamQuestion(null);
                    setExamAnswer('');
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  ביטול
                </button>
              </div>
            </form>
          </Card>
        )}

        {/* Message Input */}
        {!examMode && (
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="שאל שאלה או בקש עזרה..."
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !inputMessage.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              שלח
            </button>
          </form>
        )}
      </div>
    </StudentLayout>
  );
}

export default AIBotChat;

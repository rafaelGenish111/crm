// AI Service with RAG (Retrieval-Augmented Generation)
const axios = require('axios');
const KnowledgeBase = require('../models/KnowledgeBase');
const Course = require('../models/Course');
const CourseEnrollment = require('../models/CourseEnrollment');
const Grade = require('../models/Grade');
const Exam = require('../models/Exam');
const Customer = require('../models/Customer');

class AIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.model = process.env.AI_MODEL || 'gpt-4';
    this.embeddingModel = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
    this.apiBase = 'https://api.openai.com/v1';
  }

  /**
   * Generate embedding for text using OpenAI
   */
  async generateEmbedding(text) {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await axios.post(
        `${this.apiBase}/embeddings`,
        {
          model: this.embeddingModel,
          input: text,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error.response?.data || error.message);
      throw new Error('Failed to generate embedding');
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Retrieve relevant knowledge from knowledge base (RAG)
   */
  async retrieveRelevantKnowledge(query, studentId, options = {}) {
    const { courseId, limit = 5, category } = options;

    try {
      // Generate embedding for query
      const queryEmbedding = await this.generateEmbedding(query);

      // Build query for knowledge base
      const knowledgeQuery = {
        isActive: true,
        $or: [
          { course: null }, // General knowledge
          { course: courseId }, // Course-specific knowledge
        ],
      };

      if (category) {
        knowledgeQuery.category = category;
      }

      // Get all relevant knowledge entries
      const knowledgeEntries = await KnowledgeBase.find(knowledgeQuery)
        .select('+embedding')
        .limit(100); // Limit initial fetch for performance

      // Calculate similarity scores
      const scoredKnowledge = knowledgeEntries
        .map((kb) => {
          if (!kb.embedding || kb.embedding.length === 0) {
            return null;
          }

          const similarity = this.cosineSimilarity(queryEmbedding, kb.embedding);
          return {
            knowledge: kb,
            score: similarity * (kb.metadata?.relevanceScore || 1.0),
          };
        })
        .filter((item) => item !== null)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return scoredKnowledge.map((item) => ({
        id: item.knowledge._id,
        title: item.knowledge.title,
        content: item.knowledge.content,
        category: item.knowledge.category,
        score: item.score,
      }));
    } catch (error) {
      console.error('Error retrieving knowledge:', error);
      // Fallback: return knowledge without embeddings
      const knowledgeQuery = {
        isActive: true,
        $or: [
          { course: null },
          { course: courseId },
        ],
      };

      if (category) {
        knowledgeQuery.category = category;
      }

      const fallbackKnowledge = await KnowledgeBase.find(knowledgeQuery)
        .limit(limit)
        .sort({ usageCount: -1, createdAt: -1 });

      return fallbackKnowledge.map((kb) => ({
        id: kb._id,
        title: kb.title,
        content: kb.content,
        category: kb.category,
        score: 0.5, // Default score
      }));
    }
  }

  /**
   * Translate enrollment status to Hebrew
   */
  translateStatus(status) {
    const statusMap = {
      'pending': 'ממתין לאישור',
      'approved': 'אושר',
      'enrolled': 'רשום',
      'completed': 'הושלם',
      'cancelled': 'בוטל',
    };
    return statusMap[status] || status;
  }

  /**
   * Translate exam type to Hebrew
   */
  translateExamType(type) {
    const typeMap = {
      'exam': 'מבחן',
      'quiz': 'בוחן',
      'assignment': 'מטלה',
      'project': 'פרויקט',
    };
    return typeMap[type] || type;
  }

  /**
   * Get comprehensive student data for AI context
   */
  async getStudentData(studentId, courseId = null) {
    try {
      const student = await Customer.findById(studentId).select('name email phone');

      // Get all enrollments
      const enrollmentQuery = { customer: studentId };
      if (courseId) {
        enrollmentQuery.course = courseId;
      }

      const enrollments = await CourseEnrollment.find(enrollmentQuery)
        .populate('course', 'name subject description syllabus numberOfSessions startDate endDate')
        .sort({ enrolledAt: -1 });

      // Get all grades for enrolled courses
      const enrollmentIds = enrollments.map(e => e._id);
      const grades = await Grade.find({ enrollment: { $in: enrollmentIds } })
        .populate({
          path: 'exam',
          select: 'name type date maxScore weight description',
          populate: {
            path: 'course',
            select: 'name',
          },
        })
        .sort({ createdAt: -1 });

      // Organize data by course
      const coursesData = enrollments.map(enrollment => {
        const courseGrades = grades.filter(g =>
          g.enrollment.toString() === enrollment._id.toString()
        );

        const courseGradesData = courseGrades.map(g => ({
          examName: g.exam?.name || 'לא ידוע',
          examType: g.exam?.type || 'לא ידוע',
          examDate: g.exam?.date || null,
          score: g.score,
          maxScore: g.exam?.maxScore || 100,
          percentage: g.percentage || (g.score / (g.exam?.maxScore || 100) * 100),
          notes: g.notes || '',
        }));

        // Calculate average
        const average = courseGradesData.length > 0
          ? courseGradesData.reduce((sum, g) => sum + g.percentage, 0) / courseGradesData.length
          : null;

        // Find weak areas (grades below 70)
        const weakAreas = courseGradesData
          .filter(g => g.percentage < 70)
          .map(g => g.examName);

        return {
          courseName: enrollment.course?.name || 'לא ידוע',
          courseSubject: enrollment.course?.subject || '',
          courseDescription: enrollment.course?.description || '',
          status: enrollment.status,
          enrolledAt: enrollment.enrolledAt,
          numberOfSessions: enrollment.course?.numberOfSessions || 0,
          startDate: enrollment.course?.startDate || null,
          endDate: enrollment.course?.endDate || null,
          grades: courseGradesData,
          averageGrade: average,
          weakAreas: weakAreas,
          totalExams: courseGradesData.length,
        };
      });

      // Overall statistics
      const allGrades = coursesData.flatMap(c => c.grades);
      const overallAverage = allGrades.length > 0
        ? allGrades.reduce((sum, g) => sum + g.percentage, 0) / allGrades.length
        : null;

      return {
        student: {
          name: student?.name || 'לא ידוע',
          email: student?.email || '',
        },
        courses: coursesData,
        overallAverage: overallAverage,
        totalCourses: coursesData.length,
        totalExams: allGrades.length,
      };
    } catch (error) {
      console.error('Error getting student data:', error);
      return null;
    }
  }

  /**
   * Generate AI response with RAG context
   */
  async generateResponse(message, context = {}) {
    const { studentId, courseId, intent = 'question' } = context;

    if (!this.apiKey) {
      return {
        response: 'מצטער, שירות הבינה המלאכותית לא מוגדר כרגע. אנא פנה למנהל המערכת.',
        knowledgeSources: [],
      };
    }

    try {
      // Retrieve relevant knowledge
      const relevantKnowledge = await this.retrieveRelevantKnowledge(
        message,
        studentId,
        { courseId, limit: 5 }
      );

      // Build context from knowledge
      const knowledgeContext = relevantKnowledge
        .map((kb) => `כותרת: ${kb.title}\nתוכן: ${kb.content}`)
        .join('\n\n---\n\n');

      // Get comprehensive student data
      let studentDataContext = '';
      if (studentId) {
        const studentData = await this.getStudentData(studentId, courseId);
        if (studentData && studentData.courses.length > 0) {
          studentDataContext = `\n\n## מידע אישי על התלמיד:\n`;
          studentDataContext += `שם: ${studentData.student.name}\n`;
          studentDataContext += `מספר קורסים: ${studentData.totalCourses}\n`;

          if (studentData.overallAverage !== null) {
            studentDataContext += `ממוצע כללי: ${studentData.overallAverage.toFixed(1)}%\n`;
          }

          if (studentData.totalExams > 0) {
            studentDataContext += `סה"כ מבחנים: ${studentData.totalExams}\n`;
          }

          studentDataContext += `\n### קורסים:\n`;
          studentData.courses.forEach((course, idx) => {
            studentDataContext += `\n${idx + 1}. ${course.courseName} (${course.courseSubject})\n`;
            studentDataContext += `   סטטוס: ${this.translateStatus(course.status)}\n`;

            if (course.startDate) {
              const startDate = new Date(course.startDate).toLocaleDateString('he-IL');
              studentDataContext += `   תאריך התחלה: ${startDate}\n`;
            }

            if (course.numberOfSessions > 0) {
              studentDataContext += `   מספר מפגשים: ${course.numberOfSessions}\n`;
            }

            if (course.averageGrade !== null) {
              studentDataContext += `   ממוצע בקורס: ${course.averageGrade.toFixed(1)}%\n`;
            }

            if (course.grades.length > 0) {
              studentDataContext += `   ציונים:\n`;
              course.grades.forEach(grade => {
                const examDate = grade.examDate ? new Date(grade.examDate).toLocaleDateString('he-IL') : 'לא צוין';
                const examTypeLabel = this.translateExamType(grade.examType);
                studentDataContext += `     - ${grade.examName} (${examTypeLabel}, ${examDate}): ${grade.score}/${grade.maxScore} (${grade.percentage.toFixed(1)}%)\n`;
                if (grade.notes) {
                  studentDataContext += `       הערה: ${grade.notes}\n`;
                }
              });
            } else {
              studentDataContext += `   עדיין אין ציונים\n`;
            }

            if (course.weakAreas.length > 0) {
              studentDataContext += `   ⚠️ אזורים לשיפור (ציון נמוך מ-70%): ${course.weakAreas.join(', ')}\n`;
            }
          });
        } else if (studentData) {
          // Student exists but has no courses
          studentDataContext = `\n\n## מידע אישי על התלמיד:\n`;
          studentDataContext += `שם: ${studentData.student.name}\n`;
          studentDataContext += `התלמיד עדיין לא רשום לקורסים.\n`;
        }
      }

      // Build system prompt
      const systemPrompt = `אתה עוזר אישי חכם לתלמידים. תפקידך:
1. לעזור לתלמידים להתקדם בתוכנית הלימודים
2. לענות על שאלות על בסיס הידע שסופק
3. לתת ייעוץ לימודי מותאם אישית על בסיס הציונים וההתקדמות שלהם
4. לבחון תלמידים ולספק משוב
5. לנתח ציונים ולהציע דרכים לשיפור

הוראות:
- השתמש רק במידע מהידע הבסיסי שסופק ובמידע האישי של התלמיד
- אם התלמיד שואל על ציונים, הצג לו את הציונים המדויקים שלו
- אם יש אזורים חלשים (ציונים נמוכים מ-70%), הצע דרכים ספציפיות לשיפור
- תן המלצות מותאמות אישית על בסיס הביצועים שלו
- אם אין מידע רלוונטי, אמור זאת בכנות
- תן תשובות ברורות ומפורטות בעברית
- עודד את התלמידים והציע דרכים לשיפור
- אם זה שאלה על קורס ספציפי, התמקד בקורס הזה

חשוב: השתמש רק במידע האישי של התלמיד המחובר. לעולם אל תציג מידע של תלמיד אחר.`;

      // Build user message with context
      const userMessage = `${studentDataContext ? `${studentDataContext}\n\n` : ''}${knowledgeContext ? `ידע רלוונטי:\n${knowledgeContext}\n\n` : ''}שאלת התלמיד: ${message}`;

      // Call OpenAI API
      // For reasoning models like gpt-5, we need more tokens for reasoning + completion
      const maxCompletionTokens = this.model.includes('gpt-5') || this.model.includes('o1') || this.model.includes('o3')
        ? 4000  // More tokens for reasoning models
        : 1000; // Standard for other models

      const response = await axios.post(
        `${this.apiBase}/chat/completions`,
        {
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          max_completion_tokens: maxCompletionTokens,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Validate response structure
      if (!response.data || !response.data.choices || !response.data.choices[0]) {
        console.error('Invalid response structure:', JSON.stringify(response.data, null, 2));
        throw new Error('Invalid response structure from OpenAI API');
      }

      const choice = response.data.choices[0];
      const finishReason = choice.finish_reason;
      const aiResponseText = choice.message?.content || '';

      // Handle different finish reasons
      if (finishReason === 'length') {
        console.warn('Response was truncated due to token limit. Consider increasing max_completion_tokens.');
        // If content is empty but we hit length limit, it means all tokens went to reasoning
        if (!aiResponseText || aiResponseText.trim().length === 0) {
          throw new Error('Response was truncated - all tokens were used for reasoning. Please increase max_completion_tokens or use a different model.');
        }
      }

      if (!aiResponseText || aiResponseText.trim().length === 0) {
        console.error('Empty response from OpenAI API. Response data:', JSON.stringify(response.data, null, 2));
        const errorMsg = finishReason === 'length'
          ? 'התשובה נחתכה בגלל מגבלת טוקנים. אנא נסה שאלה קצרה יותר או פנה למנהל המערכת.'
          : 'Empty response from OpenAI API';
        throw new Error(errorMsg);
      }

      // Update usage count for used knowledge
      for (const kb of relevantKnowledge) {
        await KnowledgeBase.findByIdAndUpdate(kb.id, {
          $inc: { usageCount: 1 },
          lastUsed: new Date(),
        });
      }

      return {
        response: aiResponseText.trim(),
        knowledgeSources: relevantKnowledge.map((kb) => ({
          id: kb.id,
          title: kb.title,
          score: kb.score,
        })),
        tokensUsed: response.data.usage?.total_tokens || 0,
      };
    } catch (error) {
      console.error('Error generating AI response:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.error?.message || error.message;
      return {
        response: 'מצטער, אירעה שגיאה ביצירת תשובה. אנא נסה שוב מאוחר יותר.',
        knowledgeSources: [],
        error: errorMessage,
      };
    }
  }

  /**
   * Generate exam question based on course material
   */
  async generateExamQuestion(courseId, difficulty = 'medium') {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      // Get course information
      const course = await Course.findById(courseId);
      if (!course) {
        throw new Error('Course not found');
      }

      // Get relevant knowledge for exam
      const examKnowledge = await this.retrieveRelevantKnowledge(
        course.syllabus || course.description || course.name,
        null,
        { courseId, category: 'exam_prep', limit: 10 }
      );

      const knowledgeContext = examKnowledge
        .map((kb) => `${kb.title}: ${kb.content}`)
        .join('\n\n');

      const systemPrompt = `אתה מורה מקצועי שיוצר שאלות בחינה. צור שאלה אחת ${difficulty === 'easy' ? 'קלה' : difficulty === 'hard' ? 'קשה' : 'בינונית'} על בסיס החומר הבא.

פורמט התשובה:
שאלה: [השאלה]
תשובה נכונה: [התשובה הנכונה]
הסבר: [הסבר קצר למה זו התשובה הנכונה]`;

      const response = await axios.post(
        `${this.apiBase}/chat/completions`,
        {
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: `חומר הלימוד:\n${knowledgeContext}\n\nנושא הקורס: ${course.name}\nתיאור: ${course.description || ''}`,
            },
          ],
          max_completion_tokens: 500,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = response.data.choices[0].message.content;

      // Parse response
      const questionMatch = result.match(/שאלה:\s*(.+?)(?=תשובה|הסבר|$)/s);
      const answerMatch = result.match(/תשובה נכונה:\s*(.+?)(?=הסבר|$)/s);
      const explanationMatch = result.match(/הסבר:\s*(.+?)$/s);

      return {
        question: questionMatch ? questionMatch[1].trim() : result,
        correctAnswer: answerMatch ? answerMatch[1].trim() : '',
        explanation: explanationMatch ? explanationMatch[1].trim() : '',
        knowledgeSources: examKnowledge.map((kb) => kb.id),
      };
    } catch (error) {
      console.error('Error generating exam question:', error);
      throw error;
    }
  }

  /**
   * Evaluate student answer and provide feedback
   */
  async evaluateAnswer(question, correctAnswer, studentAnswer) {
    if (!this.apiKey) {
      return {
        score: 0,
        feedback: 'שירות הבינה המלאכותית לא מוגדר',
      };
    }

    try {
      const response = await axios.post(
        `${this.apiBase}/chat/completions`,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'אתה מורה שמעריך תשובות תלמידים. תן ציון מ-0 עד 100 ומשוב מפורט בעברית.',
            },
            {
              role: 'user',
              content: `שאלה: ${question}\nתשובה נכונה: ${correctAnswer}\nתשובת התלמיד: ${studentAnswer}\n\nהערך את התשובה ותן משוב מפורט.`,
            },
          ],
          max_completion_tokens: 300,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const feedback = response.data.choices[0].message.content;

      // Try to extract score
      const scoreMatch = feedback.match(/(\d+)\s*(?:מתוך|מ-|ציון)/);
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 75;

      return {
        score: Math.min(100, Math.max(0, score)),
        feedback: feedback,
      };
    } catch (error) {
      console.error('Error evaluating answer:', error);
      return {
        score: 0,
        feedback: 'אירעה שגיאה בהערכת התשובה',
      };
    }
  }

  /**
   * Generate study plan for student
   */
  async generateStudyPlan(studentId, courseId) {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const course = await Course.findById(courseId);
      const enrollment = await CourseEnrollment.findOne({
        customer: studentId,
        course: courseId,
      });

      if (!course || !enrollment) {
        throw new Error('Course or enrollment not found');
      }

      const knowledge = await this.retrieveRelevantKnowledge(
        course.syllabus || course.description,
        studentId,
        { courseId, category: 'study_guide', limit: 10 }
      );

      const knowledgeContext = knowledge
        .map((kb) => `${kb.title}: ${kb.content}`)
        .join('\n\n');

      const response = await axios.post(
        `${this.apiBase}/chat/completions`,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'אתה יועץ לימודי מקצועי. צור תוכנית לימודים מפורטת ויומית בעברית.',
            },
            {
              role: 'user',
              content: `קורס: ${course.name}\nמספר מפגשים: ${course.numberOfSessions || 'לא מוגדר'}\nתוכנית לימודים: ${course.syllabus || ''}\n\nחומר עזר:\n${knowledgeContext}\n\nצור תוכנית לימודים יומית מפורטת.`,
            },
          ],
          max_completion_tokens: 1500,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        studyPlan: response.data.choices[0].message.content,
        knowledgeSources: knowledge.map((kb) => kb.id),
      };
    } catch (error) {
      console.error('Error generating study plan:', error);
      throw error;
    }
  }

  /**
   * Analyze lead (legacy method)
   */
  async analyzeLead(leadData) {
    return {
      score: 75,
      recommendations: ['יצירת קשר מיידי', 'שליחת מידע נוסף'],
    };
  }
}

module.exports = new AIService();


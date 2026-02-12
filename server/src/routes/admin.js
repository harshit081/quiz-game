const express = require('express');
const bcrypt = require('bcryptjs');
const Quiz = require('../models/Quiz');
const Attempt = require('../models/Attempt');
const User = require('../models/User');
const Question = require('../models/Question');
const { requireAdmin, requireStaff } = require('../middleware/auth');

const router = express.Router();

router.use(requireStaff);

const isOwnerOrAdmin = (req, quiz) => {
  if (req.session.user.role === 'admin') {
    return true;
  }
  return quiz.createdBy?.toString() === req.session.user.id;
};

router.get('/quizzes', async (req, res) => {
  const query = req.session.user.role === 'admin'
    ? {}
    : { createdBy: req.session.user.id };
  const quizzes = await Quiz.find(query).sort({ createdAt: -1 });
  res.json(quizzes);
});

router.post('/quizzes', async (req, res) => {
  const { title, category, timeLimitMinutes, questions, isEnabled, singleAttempt, accessCode } = req.body;
  if (!title || !category || !timeLimitMinutes || !Array.isArray(questions)) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  const totalMarks = questions.length;
  const accessCodeHash = accessCode ? await bcrypt.hash(String(accessCode), 10) : null;

  const quiz = await Quiz.create({
    title,
    category,
    timeLimitMinutes,
    totalMarks,
    questions,
    isEnabled: isEnabled !== false,
    singleAttempt: singleAttempt !== false,
    accessCodeHash,
    createdBy: req.session.user.id,
  });

  return res.status(201).json(quiz);
});

router.put('/quizzes/:id', async (req, res) => {
  const { title, category, timeLimitMinutes, questions, isEnabled, singleAttempt, accessCode } = req.body;
  const totalMarks = Array.isArray(questions) ? questions.length : undefined;

  const existing = await Quiz.findById(req.params.id);
  if (!existing) {
    return res.status(404).json({ message: 'Quiz not found' });
  }
  if (!isOwnerOrAdmin(req, existing)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const accessCodeHash = accessCode
    ? await bcrypt.hash(String(accessCode), 10)
    : accessCode === ''
      ? null
      : undefined;

  const quiz = await Quiz.findByIdAndUpdate(
    req.params.id,
    {
      title,
      category,
      timeLimitMinutes,
      questions,
      totalMarks,
      isEnabled,
      singleAttempt,
      ...(accessCodeHash !== undefined ? { accessCodeHash } : {}),
    },
    { new: true }
  );

  return res.json(quiz);
});

router.patch('/quizzes/:id/toggle', async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) {
    return res.status(404).json({ message: 'Quiz not found' });
  }
  if (!isOwnerOrAdmin(req, quiz)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  quiz.isEnabled = !quiz.isEnabled;
  await quiz.save();
  return res.json({ isEnabled: quiz.isEnabled });
});

router.delete('/quizzes/:id', async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) {
    return res.status(404).json({ message: 'Quiz not found' });
  }
  if (!isOwnerOrAdmin(req, quiz)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  await quiz.deleteOne();
  await Attempt.deleteMany({ quiz: quiz._id });
  return res.json({ message: 'Deleted' });
});

router.get('/attempts', async (req, res) => {
  const quizFilter = req.session.user.role === 'admin'
    ? {}
    : { createdBy: req.session.user.id };
  const teacherQuizzes = req.session.user.role === 'admin'
    ? null
    : await Quiz.find(quizFilter).select('_id');
  const quizIds = teacherQuizzes ? teacherQuizzes.map((quiz) => quiz._id) : undefined;

  const attempts = await Attempt.find(quizIds ? { quiz: { $in: quizIds } } : {})
    .populate('user', 'name email')
    .populate('quiz', 'title category')
    .sort({ createdAt: -1 });
  res.json(attempts);
});

router.get('/attempts.csv', async (req, res) => {
  const quizFilter = req.session.user.role === 'admin'
    ? {}
    : { createdBy: req.session.user.id };
  const teacherQuizzes = req.session.user.role === 'admin'
    ? null
    : await Quiz.find(quizFilter).select('_id');
  const quizIds = teacherQuizzes ? teacherQuizzes.map((quiz) => quiz._id) : undefined;

  const attempts = await Attempt.find(quizIds ? { quiz: { $in: quizIds } } : {})
    .populate('user', 'name email')
    .populate('quiz', 'title category totalMarks')
    .sort({ createdAt: -1 });

  const rows = [
    ['Student Name', 'Student Email', 'Quiz', 'Category', 'Score', 'Total Marks', 'Time (s)', 'Attempt Date'],
  ];

  attempts.forEach((attempt) => {
    rows.push([
      attempt.user?.name || 'Unknown',
      attempt.user?.email || 'Unknown',
      attempt.quiz?.title || 'Unknown',
      attempt.quiz?.category || 'Unknown',
      String(attempt.score),
      String(attempt.quiz?.totalMarks ?? ''),
      String(attempt.timeTakenSeconds),
      attempt.attemptDate.toISOString(),
    ]);
  });

  const csv = rows
    .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="attempts.csv"');
  res.send(csv);
});

router.get('/questions', async (req, res) => {
  const query = req.session.user.role === 'admin'
    ? {}
    : { createdBy: req.session.user.id };
  const questions = await Question.find(query).sort({ createdAt: -1 });
  res.json(questions);
});

router.post('/questions', async (req, res) => {
  const { text, options, correctIndex, category } = req.body;
  if (!text || !Array.isArray(options) || options.length < 2 || correctIndex === undefined || !category) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  const question = await Question.create({
    text,
    options,
    correctIndex,
    category,
    createdBy: req.session.user.id,
  });

  return res.status(201).json(question);
});

router.delete('/questions/:id', async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) {
    return res.status(404).json({ message: 'Question not found' });
  }
  if (req.session.user.role !== 'admin' && question.createdBy?.toString() !== req.session.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  await question.deleteOne();
  return res.json({ message: 'Deleted' });
});

router.get('/stats', async (req, res) => {
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const [usersCount, quizCount, attemptsCount] = await Promise.all([
    User.countDocuments(),
    Quiz.countDocuments(),
    Attempt.countDocuments(),
  ]);

  const scores = await Attempt.aggregate([
    { $group: { _id: null, avgScore: { $avg: '$score' } } },
  ]);

  res.json({
    usersCount,
    quizCount,
    attemptsCount,
    averageScore: scores[0] ? Number(scores[0].avgScore.toFixed(2)) : 0,
  });
});

module.exports = router;

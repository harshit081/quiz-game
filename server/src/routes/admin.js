const express = require('express');
const Quiz = require('../models/Quiz');
const Attempt = require('../models/Attempt');
const User = require('../models/User');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(requireAdmin);

router.get('/quizzes', async (req, res) => {
  const quizzes = await Quiz.find().sort({ createdAt: -1 });
  res.json(quizzes);
});

router.post('/quizzes', async (req, res) => {
  const { title, category, timeLimitMinutes, questions, isEnabled, singleAttempt } = req.body;
  if (!title || !category || !timeLimitMinutes || !Array.isArray(questions)) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  const totalMarks = questions.length;

  const quiz = await Quiz.create({
    title,
    category,
    timeLimitMinutes,
    totalMarks,
    questions,
    isEnabled: isEnabled !== false,
    singleAttempt: singleAttempt !== false,
    createdBy: req.session.user.id,
  });

  return res.status(201).json(quiz);
});

router.put('/quizzes/:id', async (req, res) => {
  const { title, category, timeLimitMinutes, questions, isEnabled, singleAttempt } = req.body;
  const totalMarks = Array.isArray(questions) ? questions.length : undefined;

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
    },
    { new: true }
  );

  if (!quiz) {
    return res.status(404).json({ message: 'Quiz not found' });
  }

  return res.json(quiz);
});

router.patch('/quizzes/:id/toggle', async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) {
    return res.status(404).json({ message: 'Quiz not found' });
  }
  quiz.isEnabled = !quiz.isEnabled;
  await quiz.save();
  return res.json({ isEnabled: quiz.isEnabled });
});

router.delete('/quizzes/:id', async (req, res) => {
  const quiz = await Quiz.findByIdAndDelete(req.params.id);
  if (!quiz) {
    return res.status(404).json({ message: 'Quiz not found' });
  }
  await Attempt.deleteMany({ quiz: quiz._id });
  return res.json({ message: 'Deleted' });
});

router.get('/attempts', async (req, res) => {
  const attempts = await Attempt.find()
    .populate('user', 'name email')
    .populate('quiz', 'title category')
    .sort({ createdAt: -1 });
  res.json(attempts);
});

router.get('/stats', async (req, res) => {
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

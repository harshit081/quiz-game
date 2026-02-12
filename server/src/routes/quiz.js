const express = require('express');
const Quiz = require('../models/Quiz');
const Attempt = require('../models/Attempt');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const shuffle = (items) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

router.get('/', requireAuth, async (req, res) => {
  const quizzes = await Quiz.find({ isEnabled: true }).select('title category timeLimitMinutes totalMarks');
  res.json(quizzes);
});

router.get('/:id', requireAuth, async (req, res) => {
  const quiz = await Quiz.findOne({ _id: req.params.id, isEnabled: true });
  if (!quiz) {
    return res.status(404).json({ message: 'Quiz not found' });
  }

  const questions = shuffle(quiz.questions).map((q) => ({
    _id: q._id,
    text: q.text,
    options: q.options,
  }));

  return res.json({
    _id: quiz._id,
    title: quiz.title,
    category: quiz.category,
    timeLimitMinutes: quiz.timeLimitMinutes,
    totalMarks: quiz.totalMarks,
    singleAttempt: quiz.singleAttempt,
    questions,
  });
});

router.post('/:id/attempt', requireAuth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz || !quiz.isEnabled) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (quiz.singleAttempt) {
      const existing = await Attempt.findOne({ user: req.session.user.id, quiz: quiz._id });
      if (existing) {
        return res.status(409).json({ message: 'Attempt already exists' });
      }
    }

    const { answers, timeTakenSeconds } = req.body;
    if (!Array.isArray(answers)) {
      return res.status(400).json({ message: 'Invalid answers' });
    }

    const questionMap = new Map();
    quiz.questions.forEach((q) => questionMap.set(q._id.toString(), q));

    let score = 0;
    const review = answers.map((answer) => {
      const q = questionMap.get(answer.questionId);
      const correctIndex = q ? q.correctIndex : null;
      const selectedIndex = Number(answer.selectedIndex);
      const isCorrect = q ? selectedIndex === q.correctIndex : false;

      if (isCorrect) {
        score += quiz.marksPerQuestion || 1;
      }

      return {
        questionId: answer.questionId,
        selectedIndex,
        correctIndex,
        isCorrect,
      };
    });

    const attempt = await Attempt.create({
      user: req.session.user.id,
      quiz: quiz._id,
      answers,
      score,
      timeTakenSeconds: Number(timeTakenSeconds || 0),
      attemptDate: new Date(),
    });

    return res.status(201).json({
      attemptId: attempt._id,
      score,
      totalMarks: quiz.totalMarks,
      review,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Submission failed' });
  }
});

module.exports = router;

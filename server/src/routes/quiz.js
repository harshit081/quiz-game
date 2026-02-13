const express = require('express');
const bcrypt = require('bcryptjs');
const Quiz = require('../models/Quiz');
const Attempt = require('../models/Attempt');
const Group = require('../models/Group');
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

const isOwner = (req, quiz) => quiz.createdBy?.toString() === req.session.user.id;

const userGroupIds = async (userId) => {
  const groups = await Group.find({ members: userId }).select('_id');
  return groups.map((group) => group._id);
};

const ensureQuizAccess = async (req, quiz, code) => {
  const normalizedAccessType = quiz.accessType || (quiz.accessCodeHash ? 'code' : 'global');
  if (req.session.user.role !== 'student' && isOwner(req, quiz)) {
    return { ok: true };
  }

  if (normalizedAccessType === 'global') {
    return { ok: true };
  }

  if (normalizedAccessType === 'group') {
    const groupIds = await userGroupIds(req.session.user.id);
    if (groupIds.some((id) => id.toString() === String(quiz.group))) {
      return { ok: true };
    }
    return { ok: false, message: 'Group access required' };
  }

  if (normalizedAccessType === 'code') {
    if (!code) {
      return { ok: false, message: 'Access code required' };
    }
    const match = await bcrypt.compare(code, quiz.accessCodeHash || '');
    if (!match) {
      return { ok: false, message: 'Invalid access code' };
    }
    return { ok: true };
  }

  return { ok: false, message: 'Access denied' };
};

router.get('/', requireAuth, async (req, res) => {
  const { scope = 'available' } = req.query;
  const groupIds = await userGroupIds(req.session.user.id);

  const globalFilter = {
    isEnabled: true,
    $or: [
      { accessType: 'global' },
      { accessType: { $exists: false }, accessCodeHash: null },
    ],
  };

  if (scope === 'global') {
    const quizzes = await Quiz.find(globalFilter)
      .select('title category timeLimitMinutes totalMarks');
    return res.json(quizzes);
  }

  if (scope === 'group') {
    const quizzes = await Quiz.find({
      isEnabled: true,
      accessType: 'group',
      group: { $in: groupIds },
    }).select('title category timeLimitMinutes totalMarks');
    return res.json(quizzes);
  }

  const quizzes = await Quiz.find({
    isEnabled: true,
    $or: [
      ...globalFilter.$or,
      { accessType: 'group', group: { $in: groupIds } },
    ],
  }).select('title category timeLimitMinutes totalMarks');
  return res.json(quizzes);
});

router.post('/access', requireAuth, async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ message: 'Access code required' });
  }

  const candidates = await Quiz.find({
    isEnabled: true,
    accessCodeHash: { $ne: null },
    $or: [{ accessType: 'code' }, { accessType: { $exists: false } }],
  });
  for (const quiz of candidates) {
    const match = await bcrypt.compare(code, quiz.accessCodeHash);
    if (match) {
      let attempted = false;
      if (quiz.singleAttempt) {
        attempted = Boolean(
          await Attempt.exists({ user: req.session.user.id, quiz: quiz._id })
        );
      }

      return res.json({
        _id: quiz._id,
        title: quiz.title,
        category: quiz.category,
        timeLimitMinutes: quiz.timeLimitMinutes,
        totalMarks: quiz.totalMarks,
        singleAttempt: quiz.singleAttempt,
        attempted,
      });
    }
  }

  return res.status(404).json({ message: 'Invalid access code' });
});

router.get('/attempts/me', requireAuth, async (req, res) => {
  const attempts = await Attempt.find({ user: req.session.user.id })
    .populate('quiz', 'title category totalMarks')
    .sort({ createdAt: -1 });
  res.json(attempts);
});

router.get('/:id/leaderboard', requireAuth, async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz || !quiz.isEnabled) {
    return res.status(404).json({ message: 'Quiz not found' });
  }

  const code = req.query.code;
  const access = await ensureQuizAccess(req, quiz, code);
  if (!access.ok) {
    return res.status(403).json({ message: access.message });
  }

  const attempts = await Attempt.find({ quiz: req.params.id })
    .sort({ score: -1, timeTakenSeconds: 1, attemptDate: 1 })
    .limit(10)
    .populate('user', 'name');

  res.json(
    attempts.map((attempt) => ({
      _id: attempt._id,
      score: attempt.score,
      timeTakenSeconds: attempt.timeTakenSeconds,
      attemptDate: attempt.attemptDate,
      user: attempt.user ? { name: attempt.user.name } : { name: 'Anonymous' },
    }))
  );
});

router.get('/:id', requireAuth, async (req, res) => {
  const quiz = await Quiz.findOne({ _id: req.params.id, isEnabled: true });
  if (!quiz) {
    return res.status(404).json({ message: 'Quiz not found' });
  }

  const code = req.query.code;
  const access = await ensureQuizAccess(req, quiz, code);
  if (!access.ok) {
    return res.status(403).json({ message: access.message });
  }

  let attempted = false;
  if (quiz.singleAttempt) {
    attempted = Boolean(
      await Attempt.exists({ user: req.session.user.id, quiz: quiz._id })
    );
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
    attempted,
    questions,
  });
});

router.post('/:id/attempt', requireAuth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz || !quiz.isEnabled) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const code = req.query.code;
    const access = await ensureQuizAccess(req, quiz, code);
    if (!access.ok) {
      return res.status(403).json({ message: access.message });
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

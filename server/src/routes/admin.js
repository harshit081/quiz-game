const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const XLSX = require('xlsx');
const Quiz = require('../models/Quiz');
const Attempt = require('../models/Attempt');
const User = require('../models/User');
const Question = require('../models/Question');
const Group = require('../models/Group');
const { requireAdmin, requireStaff } = require('../middleware/auth');

const crypto = require('crypto');

const router = express.Router();

// Generate a unique 8-char alphanumeric code for quizzes
async function generateUniqueCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let attempt = 0; attempt < 10; attempt++) {
    let code = '';
    const bytes = crypto.randomBytes(8);
    for (let i = 0; i < 8; i++) code += chars[bytes[i] % chars.length];
    const exists = await Quiz.findOne({ accessCode: code });
    if (!exists) return code;
  }
  // Fallback: use timestamp-based code
  return Date.now().toString(36).toUpperCase().slice(-8).padStart(8, 'X');
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

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

  const quizIds = quizzes.map((q) => q._id);
  const attemptCounts = await Attempt.aggregate([
    { $match: { quiz: { $in: quizIds } } },
    { $group: { _id: '$quiz', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(attemptCounts.map((a) => [a._id.toString(), a.count]));

  const result = quizzes.map((q) => ({
    ...q.toObject(),
    attemptCount: countMap.get(q._id.toString()) || 0,
  }));

  res.json(result);
});

router.get('/quizzes/:id', async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
  if (!isOwnerOrAdmin(req, quiz)) return res.status(403).json({ message: 'Forbidden' });
  return res.json(quiz);
});

router.post('/quizzes', async (req, res) => {
  const {
    title,
    category,
    timeLimitMinutes,
    questions,
    isEnabled,
    singleAttempt,
    accessType,
    groupId,
  } = req.body;
  if (!title || !category || !timeLimitMinutes || !Array.isArray(questions)) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  const normalizedAccessType = ['global', 'group', 'code'].includes(accessType)
    ? accessType
    : 'global';

  let accessCode = null;
  let accessCodeHash = null;
  let group = null;

  if (normalizedAccessType === 'code') {
    accessCode = await generateUniqueCode();
    accessCodeHash = await bcrypt.hash(accessCode, 10);
  }

  if (normalizedAccessType === 'group') {
    if (!groupId) {
      return res.status(400).json({ message: 'Group required for group quizzes' });
    }
    const groupDoc = await Group.findById(groupId);
    if (!groupDoc) {
      return res.status(404).json({ message: 'Group not found' });
    }
    if (req.session.user.role !== 'admin' && groupDoc.createdBy?.toString() !== req.session.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    group = groupDoc._id;
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
    accessType: normalizedAccessType,
    accessCode: accessCode,
    accessCodeHash,
    group,
    createdBy: req.session.user.id,
  });

  return res.status(201).json(quiz);
});

router.put('/quizzes/:id', async (req, res) => {
  const {
    title,
    category,
    timeLimitMinutes,
    questions,
    isEnabled,
    singleAttempt,
    accessType,
    groupId,
  } = req.body;
  const totalMarks = Array.isArray(questions) ? questions.length : undefined;

  const existing = await Quiz.findById(req.params.id);
  if (!existing) {
    return res.status(404).json({ message: 'Quiz not found' });
  }
  if (!isOwnerOrAdmin(req, existing)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const normalizedAccessType = ['global', 'group', 'code'].includes(accessType)
    ? accessType
    : existing.accessType || 'global';

  let accessCode = existing.accessCode;
  let accessCodeHash;
  let group = existing.group;

  if (normalizedAccessType === 'code') {
    if (!existing.accessCode || existing.accessType !== 'code') {
      // Generate a new unique code when switching to code access
      accessCode = await generateUniqueCode();
      accessCodeHash = await bcrypt.hash(accessCode, 10);
    } else {
      // Keep existing code and hash
      accessCode = existing.accessCode;
      accessCodeHash = existing.accessCodeHash;
    }
    group = null;
  } else {
    accessCode = null;
    accessCodeHash = null;
  }

  if (normalizedAccessType === 'group') {
    if (!groupId) {
      return res.status(400).json({ message: 'Group required for group quizzes' });
    }
    const groupDoc = await Group.findById(groupId);
    if (!groupDoc) {
      return res.status(404).json({ message: 'Group not found' });
    }
    if (req.session.user.role !== 'admin' && groupDoc.createdBy?.toString() !== req.session.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    group = groupDoc._id;
  }

  if (normalizedAccessType === 'global') {
    group = null;
  }

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
      accessType: normalizedAccessType,
      accessCode: accessCode,
      accessCodeHash,
      group,
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
  const { quizId } = req.query;
  if (!quizId) {
    return res.status(400).json({ message: 'quizId is required' });
  }

  const quiz = await Quiz.findById(quizId).select('title category totalMarks createdBy');
  if (!quiz) {
    return res.status(404).json({ message: 'Quiz not found' });
  }
  if (!isOwnerOrAdmin(req, quiz)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const attempts = await Attempt.find({ quiz: quiz._id })
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

  const safeQuizTitle = String(quiz.title || 'quiz')
    .replace(/[^a-zA-Z0-9-_ ]/g, '')
    .trim()
    .replace(/\s+/g, '_') || 'quiz';

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${safeQuizTitle}_attempts.csv"`);
  res.send(csv);
});

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

router.get('/questions', async (req, res) => {
  const { scope = 'personal', category } = req.query;
  const categoryFilter = category
    ? { category: { $regex: escapeRegex(String(category)), $options: 'i' } }
    : {};

  let query;
  if (scope === 'global') {
    query = { scope: 'global', ...categoryFilter };
  } else if (scope === 'personal') {
    query = { scope: 'personal', createdBy: req.session.user.id, ...categoryFilter };
  } else if (scope === 'all') {
    query = {
      $or: [
        { scope: 'global', ...categoryFilter },
        { scope: 'personal', createdBy: req.session.user.id, ...categoryFilter },
      ],
    };
  } else {
    return res.status(400).json({ message: 'Invalid scope' });
  }

  const questions = await Question.find(query).sort({ createdAt: -1 });
  res.json(questions);
});

router.post('/questions', async (req, res) => {
  const { text, options, correctIndex, category, scope } = req.body;
  const normalizedScope = scope === 'global' ? 'global' : 'personal';
  if (!text || !Array.isArray(options) || options.length < 2 || correctIndex === undefined || !category) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  const question = await Question.create({
    text,
    options,
    correctIndex,
    category,
    scope: normalizedScope,
    createdBy: req.session.user.id,
  });

  return res.status(201).json(question);
});

const normalizeHeader = (value) => String(value || '').trim().toLowerCase();

const readOptionValue = (row, keys) => {
  for (const key of keys) {
    if (row[key] !== undefined && String(row[key]).trim() !== '') {
      return String(row[key]).trim();
    }
  }
  return '';
};

router.post('/questions/import', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }

  const normalizedScope = req.body.scope === 'global' ? 'global' : 'personal';

  const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
  const [firstSheetName] = workbook.SheetNames;
  if (!firstSheetName) {
    return res.status(400).json({ message: 'Excel file has no sheets.' });
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  const optionKeySets = [
    ['optiona', 'option a', 'option_a', 'a', 'opt a', 'option1', 'option 1', 'option_1'],
    ['optionb', 'option b', 'option_b', 'b', 'opt b', 'option2', 'option 2', 'option_2'],
    ['optionc', 'option c', 'option_c', 'c', 'opt c', 'option3', 'option 3', 'option_3'],
    ['optiond', 'option d', 'option_d', 'd', 'opt d', 'option4', 'option 4', 'option_4'],
  ];

  const questionsToInsert = [];
  const errors = [];

  rows.forEach((row, index) => {
    const normalizedRow = Object.fromEntries(
      Object.entries(row).map(([key, value]) => [normalizeHeader(key), value])
    );

    const text = String(
      normalizedRow['text']
        ?? normalizedRow['question']
        ?? normalizedRow['question text']
        ?? ''
    ).trim();
    const category = String(
      normalizedRow['category']
        ?? normalizedRow['topic']
        ?? ''
    ).trim();

    const optionPairs = optionKeySets
      .map((keys, optionIndex) => ({
        value: readOptionValue(normalizedRow, keys),
        originalIndex: optionIndex,
      }))
      .filter((option) => option.value);

    if (!text || !category || optionPairs.length < 2) {
      if (text || category || optionPairs.length > 0) {
        errors.push({ row: index + 2, message: 'Missing text, category, or at least two options.' });
      }
      return;
    }

    const correctIndexRaw = normalizedRow['correctindex'] ?? normalizedRow['correct index'];
    const correctOptionRaw = normalizedRow['correctoption'] ?? normalizedRow['correct option'] ?? normalizedRow['answer'];

    let originalIndex = null;
    if (correctIndexRaw !== undefined && String(correctIndexRaw).trim() !== '') {
      const numeric = Number(correctIndexRaw);
      if (Number.isFinite(numeric)) {
        if (numeric >= 1 && numeric <= 4) {
          originalIndex = numeric - 1;
        } else {
          originalIndex = numeric;
        }
      }
    }

    if (originalIndex === null && correctOptionRaw) {
      const optionLetter = String(correctOptionRaw).trim().toUpperCase();
      const letterIndex = optionLetter.charCodeAt(0) - 65;
      if (letterIndex >= 0 && letterIndex <= 3) {
        originalIndex = letterIndex;
      }
    }

    const mappedIndex = optionPairs.findIndex((option) => option.originalIndex === originalIndex);
    if (mappedIndex < 0) {
      errors.push({ row: index + 2, message: 'Invalid correct option/index.' });
      return;
    }

    questionsToInsert.push({
      text,
      category,
      options: optionPairs.map((option) => option.value),
      correctIndex: mappedIndex,
      scope: normalizedScope,
      createdBy: req.session.user.id,
    });
  });

  if (!questionsToInsert.length && !errors.length) {
    return res.status(400).json({ message: 'No data rows found.' });
  }

  if (questionsToInsert.length) {
    await Question.insertMany(questionsToInsert);
  }

  return res.status(201).json({
    inserted: questionsToInsert.length,
    skipped: errors.length,
    errors,
  });
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
    {
      $lookup: {
        from: 'quizzes',
        localField: 'quiz',
        foreignField: '_id',
        as: 'quizDoc',
      },
    },
    { $unwind: '$quizDoc' },
    {
      $project: {
        percentage: {
          $cond: [
            { $gt: ['$quizDoc.totalMarks', 0] },
            { $multiply: [{ $divide: ['$score', '$quizDoc.totalMarks'] }, 100] },
            null,
          ],
        },
      },
    },
    { $match: { percentage: { $ne: null } } },
    { $group: { _id: null, avgScore: { $avg: '$percentage' } } },
  ]);

  res.json({
    usersCount,
    quizCount,
    attemptsCount,
    averageScore: scores[0] ? Number(scores[0].avgScore.toFixed(2)) : 0,
  });
});

module.exports = router;

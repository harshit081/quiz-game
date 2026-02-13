const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    options: { type: [String], required: true },
    correctIndex: { type: Number, required: true },
  },
  { _id: true }
);

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: { type: String, required: true },
    timeLimitMinutes: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    marksPerQuestion: { type: Number, default: 1 },
    isEnabled: { type: Boolean, default: true },
    singleAttempt: { type: Boolean, default: true },
    accessType: { type: String, enum: ['global', 'group', 'code'], default: 'global' },
    accessCode: { type: String, default: null },
    accessCodeHash: { type: String, default: null },
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
    questions: { type: [questionSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Quiz', quizSchema);

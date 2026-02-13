const express = require('express');
const Group = require('../models/Group');
const { requireAuth, requireStaff } = require('../middleware/auth');

const router = express.Router();

const generateCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 7; i += 1) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
};

const createUniqueCode = async () => {
  for (let i = 0; i < 5; i += 1) {
    const code = generateCode();
    // eslint-disable-next-line no-await-in-loop
    const exists = await Group.exists({ code });
    if (!exists) return code;
  }
  throw new Error('Unable to generate unique code');
};

router.get('/', requireAuth, async (req, res) => {
  const { scope } = req.query;
  const userId = req.session.user.id;

  if (scope === 'owned') {
    if (!['admin', 'teacher'].includes(req.session.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const groups = await Group.find({ createdBy: userId })
      .populate('members', 'name email role')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    return res.json(groups);
  }

  if (req.session.user.role === 'admin') {
    const groups = await Group.find()
      .populate('members', 'name email role')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    return res.json(groups);
  }

  if (req.session.user.role === 'teacher') {
    const groups = await Group.find({ createdBy: userId })
      .populate('members', 'name email role')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    return res.json(groups);
  }

  const groups = await Group.find({ members: userId })
    .populate('members', 'name email role')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });
  return res.json(groups);
});

router.get('/:id', requireAuth, async (req, res) => {
  const group = await Group.findById(req.params.id)
    .populate('members', 'name email role')
    .populate('createdBy', 'name email');

  if (!group) {
    return res.status(404).json({ message: 'Group not found' });
  }

  const userId = req.session.user.id;
  const isAdmin = req.session.user.role === 'admin';
  const isOwner = String(group.createdBy?._id || group.createdBy) === String(userId);
  const isMember = group.members.some((member) => String(member?._id || member) === String(userId));

  if (!isAdmin && !isOwner && !isMember) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  return res.json(group);
});

router.post('/:id/leave', requireAuth, async (req, res) => {
  const group = await Group.findById(req.params.id);
  if (!group) {
    return res.status(404).json({ message: 'Group not found' });
  }

  const userId = req.session.user.id;
  const isOwner = String(group.createdBy) === String(userId);
  if (isOwner) {
    return res.status(400).json({ message: 'Group owner cannot leave the group.' });
  }

  const hadMembership = group.members.some((member) => String(member) === String(userId));
  if (!hadMembership) {
    return res.status(400).json({ message: 'You are not a member of this group.' });
  }

  group.members = group.members.filter((member) => String(member) !== String(userId));
  await group.save();
  return res.json({ message: 'Left group successfully.' });
});

router.delete('/:id/members/:memberId', requireAuth, async (req, res) => {
  const group = await Group.findById(req.params.id);
  if (!group) {
    return res.status(404).json({ message: 'Group not found' });
  }

  const userId = req.session.user.id;
  const isAdmin = req.session.user.role === 'admin';
  const isOwner = String(group.createdBy) === String(userId);

  if (!isAdmin && !isOwner) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const memberId = String(req.params.memberId);
  if (String(group.createdBy) === memberId) {
    return res.status(400).json({ message: 'Owner cannot be removed from group.' });
  }

  const hadMembership = group.members.some((member) => String(member) === memberId);
  if (!hadMembership) {
    return res.status(404).json({ message: 'Member not found in group.' });
  }

  group.members = group.members.filter((member) => String(member) !== memberId);
  await group.save();
  return res.json({ message: 'Member removed successfully.' });
});

router.post('/', requireStaff, async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Group name required' });
  }

  const code = await createUniqueCode();
  const group = await Group.create({
    name,
    code,
    createdBy: req.session.user.id,
    members: [req.session.user.id],
  });

  return res.status(201).json(group);
});

router.post('/join', requireAuth, async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ message: 'Join code required' });
  }

  const normalized = String(code).trim().toUpperCase();
  const group = await Group.findOne({ code: normalized });
  if (!group) {
    return res.status(404).json({ message: 'Group not found' });
  }

  if (!group.members.map((member) => member.toString()).includes(req.session.user.id)) {
    group.members.push(req.session.user.id);
    await group.save();
  }

  return res.json(group);
});

module.exports = router;

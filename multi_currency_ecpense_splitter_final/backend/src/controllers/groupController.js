// Add member to group by name/email (admin only)
const addMemberManually = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, email } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!ensureAdmin(group, req.user.userId)) return res.status(403).json({ message: 'Admin access required' });

    // Find or create user
    const User = require('../models/User');
    let user = null;
    if (email) {
      user = await User.findOne({ email });
    }
    if (!user) {
      // Generate a random password for users added by admin
      const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      user = await User.create({ name, email: email || undefined, password: randomPassword });
    }
    // Add to group if not already a member
    if (!group.members.some((id) => String(id) === String(user._id))) {
      group.members.push(user._id);
      group.memberRoles.push({ userId: user._id, role: 'member' });
      await group.save();
    }
    return res.status(200).json({ message: 'Member added', user });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
const Group = require('../models/Group');
const Balance = require('../models/Balance');
const Expense = require('../models/Expense');
const Settlement = require('../models/Settlement');
const SettlementRecord = require('../models/SettlementRecord');
const Notification = require('../models/Notification');
const BalanceHistory = require('../models/BalanceHistory');

const generateJoinCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

const getUniqueJoinCode = async () => {
  let joinCode = generateJoinCode();
  let exists = await Group.exists({ joinCode });

  while (exists) {
    joinCode = generateJoinCode();
    exists = await Group.exists({ joinCode });
  }

  return joinCode;
};

const getUserRole = (group, userId) => {
  if (String(group.createdBy) === String(userId)) return 'admin';
  const roleItem = (group.memberRoles || []).find((item) => String(item.userId) === String(userId));
  return roleItem?.role || 'member';
};

const ensureAdmin = (group, userId) => getUserRole(group, userId) === 'admin';

const createGroup = async (req, res) => {
  try {
    const { name, baseCurrency } = req.body;
    if (!name) return res.status(400).json({ message: 'Group name is required' });

    const group = await Group.create({
      name,
      members: [req.user.userId],
      memberRoles: [{ userId: req.user.userId, role: 'admin' }],
      createdBy: req.user.userId,
      joinCode: await getUniqueJoinCode(),
      baseCurrency: baseCurrency || process.env.BASE_CURRENCY || 'USD',
    });

    return res.status(201).json(group);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const joinGroup = async (req, res) => {
  try {
    const { joinCode } = req.body;
    const group = await Group.findOne({ joinCode: String(joinCode || '').toUpperCase() });
    if (!group) return res.status(404).json({ message: 'Invalid join code' });

    if (!group.members.some((member) => String(member) === req.user.userId)) {
      group.members.push(req.user.userId);
      group.memberRoles.push({ userId: req.user.userId, role: 'member' });
      await group.save();
    }

    return res.status(200).json({
      ...group.toObject(),
      inviteLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/group?joinCode=${group.joinCode}`,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const listGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user.userId }).sort({ createdAt: -1 }).lean();
    const mapped = groups.map((group) => ({
      ...group,
      myRole: getUserRole(group, req.user.userId),
      inviteLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/group?joinCode=${group.joinCode}`,
    }));
    return res.status(200).json(mapped);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getGroupDetails = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId).populate('members', 'name email avatarUrl');
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const isMember = group.members.some((member) => String(member._id) === req.user.userId);
    if (!isMember) return res.status(403).json({ message: 'Access denied' });

    const balances = await Balance.find({ groupId: group._id }).populate('userId', 'name email');
    const memberRoles = {};
    (group.memberRoles || []).forEach((item) => {
      memberRoles[String(item.userId)] = item.role;
    });

    return res.status(200).json({
      group: {
        ...group.toObject(),
        members: group.members.map((member) => ({
          ...member.toObject(),
          role: memberRoles[String(member._id)] || 'member',
        })),
      },
      balances,
      myRole: getUserRole(group, req.user.userId),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateGroupSettings = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, baseCurrency } = req.body;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!ensureAdmin(group, req.user.userId)) return res.status(403).json({ message: 'Admin access required' });

    if (name) group.name = String(name).trim();
    if (baseCurrency) group.baseCurrency = String(baseCurrency).toUpperCase();
    await group.save();
    return res.status(200).json(group);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const removeMember = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!ensureAdmin(group, req.user.userId)) return res.status(403).json({ message: 'Admin access required' });
    if (String(group.createdBy) === String(memberId)) return res.status(400).json({ message: 'Cannot remove group creator' });

    group.members = group.members.filter((id) => String(id) !== String(memberId));
    group.memberRoles = (group.memberRoles || []).filter((item) => String(item.userId) !== String(memberId));
    await group.save();
    return res.status(200).json({ message: 'Member removed' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateMemberRole = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const { role } = req.body;
    if (!['admin', 'member'].includes(role)) return res.status(400).json({ message: 'Invalid role' });

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!ensureAdmin(group, req.user.userId)) return res.status(403).json({ message: 'Admin access required' });

    const roleEntry = (group.memberRoles || []).find((item) => String(item.userId) === String(memberId));
    if (!roleEntry) return res.status(404).json({ message: 'Member not found in group' });
    roleEntry.role = role;
    await group.save();
    return res.status(200).json({ message: 'Role updated' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (!ensureAdmin(group, req.user.userId)) return res.status(403).json({ message: 'Admin access required' });

    await Promise.all([
      Group.deleteOne({ _id: groupId }),
      Expense.deleteMany({ groupId }),
      Balance.deleteMany({ groupId }),
      Settlement.deleteMany({ groupId }),
      SettlementRecord.deleteMany({ groupId }),
      Notification.deleteMany({ groupId }),
      BalanceHistory.deleteMany({ groupId }),
    ]);

    return res.status(200).json({ message: 'Group deleted' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createGroup,
  joinGroup,
  listGroups,
  getGroupDetails,
  updateGroupSettings,
  removeMember,
  updateMemberRole,
  deleteGroup,
  addMemberManually,
};

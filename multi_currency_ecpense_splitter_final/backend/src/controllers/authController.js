const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Expense = require('../models/Expense');
const Balance = require('../models/Balance');

const signToken = (user) => jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });

    return res.status(201).json({ token: signToken(user), user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    return res.status(200).json({ token: signToken(user), user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('name email avatarUrl');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, email, avatarUrl } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) return res.status(400).json({ message: 'Email already in use' });
      user.email = String(email).trim().toLowerCase();
    }
    if (name) user.name = String(name).trim();
    if (avatarUrl !== undefined) user.avatarUrl = String(avatarUrl);

    await user.save();
    return res.status(200).json({ id: user._id, name: user.name, email: user.email, avatarUrl: user.avatarUrl });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getPersonalSummary = async (req, res) => {
  try {
    const userId = req.user.userId;
    const [balances, personalExpenses] = await Promise.all([
      Balance.find({ userId }).lean(),
      Expense.find({ paidBy: userId }).sort({ date: -1 }).limit(10).lean(),
    ]);

    const totalOwed = balances.reduce((sum, item) => sum + Number(item.owed || 0), 0);
    const totalOwes = balances.reduce((sum, item) => sum + Number(item.owes || 0), 0);
    const totalPaid = personalExpenses.reduce((sum, item) => sum + Number(item.convertedAmount || 0), 0);

    return res.status(200).json({
      totalOwed: Number(totalOwed.toFixed(2)),
      totalOwes: Number(totalOwes.toFixed(2)),
      totalPaid: Number(totalPaid.toFixed(2)),
      recentPersonalExpenses: personalExpenses,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { register, login, getProfile, updateProfile, getPersonalSummary };

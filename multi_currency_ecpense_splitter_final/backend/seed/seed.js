require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const Group = require('../src/models/Group');
const Expense = require('../src/models/Expense');
const { convertCurrency } = require('../src/services/currencyService');
const { recalculateGroupBalances } = require('../src/services/balanceService');

const runSeed = async () => {
  await connectDB();

  const seedPath = path.join(__dirname, 'sampleData.json');
  const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

  await Promise.all([User.deleteMany({}), Group.deleteMany({}), Expense.deleteMany({})]);

  const createdUsers = {};
  for (const item of seedData.users) {
    const hashedPassword = await bcrypt.hash(item.password, 10);
    const user = await User.create({ name: item.name, email: item.email, password: hashedPassword });
    createdUsers[item.name] = user;
  }

  const group = await Group.create({
    name: seedData.group.name,
    baseCurrency: seedData.group.baseCurrency || process.env.BASE_CURRENCY || 'USD',
    members: Object.values(createdUsers).map((u) => u._id),
    createdBy: createdUsers.Alice._id,
    joinCode: 'EURO26',
  });

  for (const item of seedData.expenses) {
    const convertedAmount = await convertCurrency(item.amount, item.currency, group.baseCurrency);
    await Expense.create({
      groupId: group._id,
      amount: item.amount,
      currency: item.currency,
      convertedAmount,
      baseCurrency: group.baseCurrency,
      paidBy: createdUsers[item.paidBy]._id,
      participants: item.participants.map((p) => createdUsers[p]._id),
      description: item.description,
      date: new Date(item.date),
    });
  }

  await recalculateGroupBalances(group._id);
  console.log('Seed complete. Group join code:', group.joinCode);
  process.exit(0);
};

runSeed().catch((error) => {
  console.error(error);
  process.exit(1);
});

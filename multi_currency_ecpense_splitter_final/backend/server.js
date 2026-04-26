require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');

const authRoutes = require('./src/routes/authRoutes');
const groupRoutes = require('./src/routes/groupRoutes');
const expenseRoutes = require('./src/routes/expenseRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const settlementRoutes = require('./src/routes/settlementRoutes');

const app = express();
connectDB();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ message: 'Server is healthy' });
});
app.get("/api", (req, res) => {
  console.log(req.body);
  res.send("API is working ");
});
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settlements', settlementRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('Backend running on port ' + PORT);
});

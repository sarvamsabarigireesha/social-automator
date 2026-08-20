require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const webhooksRouter = require('./routes/webhooks');
const authRouter = require('./routes/auth');
const apiRouter = require('./routes/api');
const { startScheduler } = require('./services/scheduler');
const { startPolling } = require('./services/commentPoller');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/webhooks', webhooksRouter);
app.use('/auth', authRouter);
app.use('/api', apiRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\nSocial Automator running at http://localhost:${PORT}`);
  startScheduler();
  startPolling();
});

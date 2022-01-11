/**
 * Environment Configurations.
 */
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: './.env' });
}
const app = require('./app');
const mongoose = require('mongoose');
const startJobs = require('./utils/start_jobs');
const schedule = require('node-schedule');
const PORT = Number(process.env.PORT) || 5000;

let server;

async function exitHandler() {
  await scheduleJob.gracefulShutdown();
  if (server) {
    server.close(() => {
      console.log('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
}

function unexpectedErrorHandler(error) {
  console.log('Unexpected Error 💥');
  console.error(error);
  exitHandler();
}

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

/**
 * Database Connectivity
 */
mongoose.connect(process.env.DATABASE_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;

db.on('error', (err) => console.error(err));
db.once('open', () => {
  console.log('Connected to Database!');
  startJobs();
});

server = app.listen(PORT, () => {
  console.log(`Server is listening on PORT ${PORT} - http://localhost:${PORT}`);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received');
  await schedule.gracefulShutdown();
  if (server) {
    server.close();
  }
});

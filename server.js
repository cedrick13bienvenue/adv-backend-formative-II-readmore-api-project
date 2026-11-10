require('dotenv').config({ quiet: true });
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 3000;
const { MONGODB_URI } = process.env;

const start = async () => {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI is not set. Copy .env.example to .env and fill it in.');
    process.exit(1);
  }

  try {
    await connectDB(MONGODB_URI);
  } catch (err) {
    console.error(`Could not connect to MongoDB: ${err.message}`);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`ReadMore API listening on http://localhost:${PORT}`);
  });
};

start();

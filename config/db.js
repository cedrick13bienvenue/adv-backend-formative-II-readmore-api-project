const mongoose = require('mongoose');

const connectDB = async (uri) => {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  const { host, port, name } = mongoose.connection;
  console.log(`MongoDB connected: ${host}:${port}/${name}`);
};

module.exports = connectDB;

require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Author = require('./models/Author');
const Book = require('./models/Book');

const clear = async () => {
  await connectDB(process.env.MONGODB_URI);

  const books = await Book.deleteMany();
  const authors = await Author.deleteMany();

  console.log(`Deleted ${authors.deletedCount} authors and ${books.deletedCount} books.`);
};

clear()
  .catch((err) => {
    console.error(`Clearing failed: ${err.message}`);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());

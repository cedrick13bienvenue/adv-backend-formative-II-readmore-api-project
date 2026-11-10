const Book = require('../models/Book');
const pick = require('../utils/pick');

const BOOK_FIELDS = ['title', 'genre', 'price', 'publishedYear', 'author'];
const AUTHOR_DETAILS = 'name country bio';

const createBook = async (req, res) => {
  const book = await Book.create(pick(req.body, BOOK_FIELDS));
  await book.populate('author', AUTHOR_DETAILS);
  res.status(201).json(book);
};

module.exports = { createBook };

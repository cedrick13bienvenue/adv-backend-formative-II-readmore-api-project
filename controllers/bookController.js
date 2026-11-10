const Book = require('../models/Book');
const pick = require('../utils/pick');

const BOOK_FIELDS = ['title', 'genre', 'price', 'publishedYear', 'author'];
const AUTHOR_DETAILS = 'name country bio';

const bookNotFound = (res, id) =>
  res.status(404).json({ message: `No book found with id ${id}` });

const createBook = async (req, res) => {
  const book = await Book.create(pick(req.body, BOOK_FIELDS));
  await book.populate('author', AUTHOR_DETAILS);
  res.status(201).json(book);
};

const getBooks = async (req, res) => {
  const books = await Book.find().populate('author', AUTHOR_DETAILS);
  res.json(books);
};

const getBookById = async (req, res) => {
  const book = await Book.findById(req.params.id).populate('author', AUTHOR_DETAILS);
  if (!book) return bookNotFound(res, req.params.id);

  res.json(book);
};

module.exports = { createBook, getBooks, getBookById };

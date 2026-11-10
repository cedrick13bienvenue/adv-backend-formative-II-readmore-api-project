const Book = require('../models/Book');
const pick = require('../utils/pick');
const validateBook = require('../utils/validateBook');

const BOOK_FIELDS = ['title', 'genre', 'price', 'publishedYear', 'author'];
const AUTHOR_DETAILS = 'name country bio';

const reject = (res, status, message) => res.status(status).json({ message });

const bookNotFound = (res, id) => reject(res, 404, `No book found with id ${id}`);

const createBook = async (req, res) => {
  const data = pick(req.body, BOOK_FIELDS);

  const problem = validateBook(data);
  if (problem) return reject(res, problem.status, problem.message);

  const book = await Book.create(data);
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

const updateBook = async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) return bookNotFound(res, req.params.id);

  const changes = pick(req.body, BOOK_FIELDS);

  const problem = validateBook(changes, { partial: true });
  if (problem) return reject(res, problem.status, problem.message);

  book.set(changes);
  await book.save();
  await book.populate('author', AUTHOR_DETAILS);
  res.json(book);
};

const deleteBook = async (req, res) => {
  const book = await Book.findByIdAndDelete(req.params.id);
  if (!book) return bookNotFound(res, req.params.id);

  res.json({ message: `Book "${book.title}" deleted`, book });
};

module.exports = { createBook, getBooks, getBookById, updateBook, deleteBook };

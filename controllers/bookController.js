const mongoose = require('mongoose');
const Author = require('../models/Author');
const Book = require('../models/Book');
const pick = require('../utils/pick');
const validateBook = require('../utils/validateBook');
const buildBookQuery = require('../utils/bookQuery');
const { CASE_INSENSITIVE } = require('../utils/collation');

const BOOK_FIELDS = ['title', 'genre', 'price', 'publishedYear', 'author'];
const AUTHOR_DETAILS = 'name country bio';

const reject = (res, status, message) => res.status(status).json({ message });

const bookNotFound = (res, id) => reject(res, 404, `No book found with id ${id}`);

const unknownAuthor = (res, id) =>
  reject(res, 400, `Author ${id} does not exist. A book must belong to an existing author.`);

const authorExists = async (id) =>
  mongoose.isObjectIdOrHexString(id) && Boolean(await Author.exists({ _id: id }));

const duplicateTitle = (res, title) =>
  reject(res, 409, `This author already has a book titled "${title.trim()}"`);

const titleTakenByAuthor = (authorId, title, ignoreBookId) => {
  const filter = { author: authorId, title: title.trim() };
  if (ignoreBookId) filter._id = { $ne: ignoreBookId };
  return Book.exists(filter).collation(CASE_INSENSITIVE);
};

const createBook = async (req, res) => {
  const data = pick(req.body, BOOK_FIELDS);

  const problem = validateBook(data);
  if (problem) return reject(res, problem.status, problem.message);

  if (!(await authorExists(data.author))) return unknownAuthor(res, data.author);

  if (await titleTakenByAuthor(data.author, data.title)) return duplicateTitle(res, data.title);

  const book = await Book.create(data);
  await book.populate('author', AUTHOR_DETAILS);
  res.status(201).json(book);
};

const getBooks = async (req, res) => {
  const { filter, error } = buildBookQuery(req.query);
  if (error) return reject(res, 400, error);

  const books = await Book.find(filter)
    .collation(CASE_INSENSITIVE)
    .populate('author', AUTHOR_DETAILS);
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

  if (changes.author !== undefined && !(await authorExists(changes.author))) {
    return unknownAuthor(res, changes.author);
  }

  const authorId = changes.author ?? book.author;
  const title = changes.title ?? book.title;
  if (await titleTakenByAuthor(authorId, title, book._id)) return duplicateTitle(res, title);

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

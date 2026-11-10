const Author = require('../models/Author');
const Book = require('../models/Book');
const pick = require('../utils/pick');

const AUTHOR_FIELDS = ['name', 'country', 'bio'];

const authorNotFound = (res, id) =>
  res.status(404).json({ message: `No author found with id ${id}` });

const createAuthor = async (req, res) => {
  const author = await Author.create(pick(req.body, AUTHOR_FIELDS));
  res.status(201).json(author);
};

const getAuthors = async (req, res) => {
  const authors = await Author.find().sort({ name: 1 });
  res.json(authors);
};

const getAuthorById = async (req, res) => {
  const author = await Author.findById(req.params.id);
  if (!author) return authorNotFound(res, req.params.id);

  res.json(author);
};

const updateAuthor = async (req, res) => {
  const author = await Author.findByIdAndUpdate(req.params.id, pick(req.body, AUTHOR_FIELDS), {
    returnDocument: 'after',
    runValidators: true,
  });
  if (!author) return authorNotFound(res, req.params.id);

  res.json(author);
};

const deleteAuthor = async (req, res) => {
  const author = await Author.findById(req.params.id);
  if (!author) return authorNotFound(res, req.params.id);

  const bookCount = await Book.countDocuments({ author: author._id });
  if (bookCount > 0) {
    return res.status(409).json({
      message: `Cannot delete "${author.name}": they still have ${bookCount} book(s). Delete or reassign those books first.`,
      bookCount,
    });
  }

  await author.deleteOne();
  res.json({ message: `Author "${author.name}" deleted`, author });
};

const getAuthorBooks = async (req, res) => {
  const author = await Author.findById(req.params.id);
  if (!author) return authorNotFound(res, req.params.id);

  const books = await Book.find({ author: author._id }).sort({ publishedYear: 1 });
  res.json({ author, count: books.length, books });
};

module.exports = {
  createAuthor,
  getAuthors,
  getAuthorById,
  updateAuthor,
  deleteAuthor,
  getAuthorBooks,
};

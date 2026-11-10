const Author = require('../models/Author');
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

module.exports = { createAuthor, getAuthors, getAuthorById, updateAuthor };

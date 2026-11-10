const Author = require('../models/Author');
const pick = require('../utils/pick');

const AUTHOR_FIELDS = ['name', 'country', 'bio'];

const createAuthor = async (req, res) => {
  const author = await Author.create(pick(req.body, AUTHOR_FIELDS));
  res.status(201).json(author);
};

const getAuthors = async (req, res) => {
  const authors = await Author.find().sort({ name: 1 });
  res.json(authors);
};

module.exports = { createAuthor, getAuthors };

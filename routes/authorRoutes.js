const express = require('express');
const { createAuthor, getAuthors, getAuthorById } = require('../controllers/authorController');
const validateObjectId = require('../middleware/validateObjectId');

const router = express.Router();

router.param('id', validateObjectId);

router.post('/', createAuthor);
router.get('/', getAuthors);
router.get('/:id', getAuthorById);

module.exports = router;

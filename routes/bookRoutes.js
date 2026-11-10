const express = require('express');
const {
  createBook,
  getBooks,
  getBookById,
  updateBook,
} = require('../controllers/bookController');
const validateObjectId = require('../middleware/validateObjectId');

const router = express.Router();

router.param('id', validateObjectId);

router.post('/', createBook);
router.get('/', getBooks);
router.get('/:id', getBookById);
router.put('/:id', updateBook);

module.exports = router;

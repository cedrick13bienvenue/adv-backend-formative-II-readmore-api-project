const mongoose = require('mongoose');
const { CASE_INSENSITIVE } = require('../utils/collation');

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
    },
    genre: {
      type: String,
      required: [true, 'Genre is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
    },
    publishedYear: {
      type: Number,
      required: [true, 'Published year is required'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Author',
      required: [true, 'Author id is required'],
    },
  },
  { timestamps: true }
);

bookSchema.index({ author: 1, title: 1 }, { unique: true, collation: CASE_INSENSITIVE });

module.exports = mongoose.model('Book', bookSchema);

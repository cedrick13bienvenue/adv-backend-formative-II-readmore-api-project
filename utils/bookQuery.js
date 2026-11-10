const mongoose = require('mongoose');

const lastValue = (value) => (Array.isArray(value) ? value.at(-1) : value);

const toNumber = (value) => (value === undefined || value === '' ? undefined : Number(value));

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildBookQuery = (rawQuery) => {
  const query = Object.fromEntries(
    Object.entries(rawQuery).map(([key, value]) => [key, lastValue(value)])
  );
  const filter = {};

  if (query.genre) filter.genre = query.genre;

  if (query.author) {
    if (!mongoose.isObjectIdOrHexString(query.author)) {
      return { error: `author must be a valid author id (received "${query.author}")` };
    }
    filter.author = query.author;
  }

  if (query.search) filter.title = { $regex: escapeRegex(query.search), $options: 'i' };

  const minPrice = toNumber(query.minPrice);
  const maxPrice = toNumber(query.maxPrice);
  if (Number.isNaN(minPrice) || Number.isNaN(maxPrice)) {
    return { error: 'minPrice and maxPrice must be numbers' };
  }
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    return { error: 'minPrice cannot be greater than maxPrice' };
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = minPrice;
    if (maxPrice !== undefined) filter.price.$lte = maxPrice;
  }

  return { filter };
};

module.exports = buildBookQuery;

const mongoose = require('mongoose');

const SORTABLE_FIELDS = ['price', 'title', 'publishedYear'];
const SORT_ORDERS = ['asc', 'desc'];
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

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

  if (query.sort && !SORTABLE_FIELDS.includes(query.sort)) {
    return { error: `sort must be one of: ${SORTABLE_FIELDS.join(', ')}` };
  }
  const order = (query.order ?? 'asc').toLowerCase();
  if (!SORT_ORDERS.includes(order)) {
    return { error: 'order must be asc or desc' };
  }
  const sortBy = query.sort ? { [query.sort]: order === 'asc' ? 1 : -1, _id: 1 } : { _id: 1 };

  const page = toNumber(query.page) ?? 1;
  const limit = toNumber(query.limit) ?? (query.page === undefined ? undefined : DEFAULT_LIMIT);
  if (!Number.isInteger(page) || page < 1) {
    return { error: 'page must be a whole number of 1 or more' };
  }
  if (limit !== undefined && (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT)) {
    return { error: `limit must be a whole number from 1 to ${MAX_LIMIT}` };
  }

  return { filter, sortBy, page, limit };
};

module.exports = buildBookQuery;

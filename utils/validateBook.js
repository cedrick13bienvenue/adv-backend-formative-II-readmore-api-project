const REQUIRED_FIELDS = ['title', 'genre', 'price', 'publishedYear', 'author'];
const TEXT_FIELDS = ['title', 'genre'];
const NUMBER_FIELDS = ['price', 'publishedYear'];
const EARLIEST_YEAR = 1450;

const isBlank = (value) =>
  value === undefined || value === null || (typeof value === 'string' && !value.trim());

const validateBook = (data, { partial = false } = {}) => {
  if (!partial) {
    const missing = REQUIRED_FIELDS.filter((field) => isBlank(data[field]));
    if (missing.length) {
      return { status: 400, message: `Missing required field(s): ${missing.join(', ')}` };
    }
  }

  const badText = TEXT_FIELDS.find(
    (field) => field in data && (typeof data[field] !== 'string' || !data[field].trim())
  );
  if (badText) return { status: 400, message: `${badText} must be a non-empty string` };

  const badNumber = NUMBER_FIELDS.find(
    (field) => field in data && (typeof data[field] !== 'number' || !Number.isFinite(data[field]))
  );
  if (badNumber) return { status: 400, message: `${badNumber} must be a number` };

  if ('price' in data && data.price <= 0) {
    return { status: 422, message: `price must be greater than 0 (received ${data.price})` };
  }

  if ('publishedYear' in data) {
    const currentYear = new Date().getFullYear();
    const year = data.publishedYear;
    if (!Number.isInteger(year) || year < EARLIEST_YEAR || year > currentYear) {
      return {
        status: 422,
        message: `publishedYear must be a whole year from ${EARLIEST_YEAR} to ${currentYear} (received ${year})`,
      };
    }
  }

  return null;
};

module.exports = validateBook;

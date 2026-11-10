const mongoose = require('mongoose');

const validateObjectId = (req, res, next, id) => {
  if (!mongoose.isObjectIdOrHexString(id)) {
    return res.status(400).json({ message: `"${id}" is not a valid id` });
  }
  next();
};

module.exports = validateObjectId;

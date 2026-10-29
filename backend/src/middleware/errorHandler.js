const { validationResult } = require('express-validator');

// Call at the top of a route handler after express-validator checks are declared.
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed.', details: errors.array() });
  }
  next();
}

// Wrap async route handlers so thrown errors reach the error middleware instead of hanging the request.
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// Express error-handling middleware (must have 4 args).
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error(err);
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({ error: 'That record already exists.' });
  }
  res.status(err.status || 500).json({ error: err.message || 'Internal server error.' });
}

module.exports = { validate, asyncHandler, errorHandler };

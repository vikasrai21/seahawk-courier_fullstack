// src/middleware/validate.middleware.js — Zod validation factory
const { ZodError } = require('zod');

const validate = (schema, source = 'body') => (req, res, next) => {
  try {
    const parsed = schema.parse(req[source]);
    req[source] = parsed; // Replace with cleaned/coerced data
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: err.errors.map((e) => ({
          field:   e.path.join('.'),
          message: e.message,
        })),
      });
    }
    next(err);
  }
};

module.exports = { validate };

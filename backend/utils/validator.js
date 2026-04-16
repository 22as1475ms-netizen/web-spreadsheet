function createError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function requireFields(payload, fields) {
  const missing = fields.find((field) => {
    const value = payload?.[field];
    return value === undefined || value === null || String(value).trim() === '';
  });

  if (missing) {
    throw createError(400, `${missing} is required.`);
  }
}

function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}

module.exports = {
  createError,
  requireFields,
  normalizeEmail
};

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { createUser, findUserByEmail } = require('../db/database');
const { requireFields, normalizeEmail, createError } = require('../utils/validator');

function buildAuthResponse(user) {
  const payload = { id: user.id, email: user.email, name: user.name };
  const token = jwt.sign(payload, process.env.JWT_SECRET || 'dev-secret', {
    expiresIn: '7d'
  });

  return {
    token,
    user: payload
  };
}

async function register(payload) {
  requireFields(payload, ['name', 'email', 'password']);

  const email = normalizeEmail(payload.email);
  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    throw createError(409, 'Email is already registered.');
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);
  const user = {
    id: crypto.randomUUID(),
    name: payload.name.trim(),
    email,
    passwordHash,
    createdAt: new Date().toISOString()
  };

  const createdUser = await createUser(user);
  return buildAuthResponse(createdUser);
}

async function login(payload) {
  requireFields(payload, ['email', 'password']);

  const email = normalizeEmail(payload.email);
  const user = await findUserByEmail(email);

  if (!user) {
    throw createError(401, 'Invalid email or password.');
  }

  const isValid = await bcrypt.compare(payload.password, user.passwordHash);

  if (!isValid) {
    throw createError(401, 'Invalid email or password.');
  }

  return buildAuthResponse(user);
}

module.exports = {
  register,
  login
};

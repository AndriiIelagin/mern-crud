import express, { Response } from 'express';
import rateLimit from 'express-rate-limit';
import stringCapitalizeName from 'string-capitalize-name';
import { User, type UserDoc } from '../models/user';
import mongoose from 'mongoose';

const router = express.Router();

// Rate limiter for POST requests
const postLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 100,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      msg: 'Too many requests. Please try again in 5 minutes.',
    });
  },
});

// Sanitization functions
const sanitizers = {
  name: (name: string) => stringCapitalizeName(name),
  email: (email: string) => email.toLowerCase(),
  age: (age: string) => {
    if (age === '') return '';
    if (Number.isNaN(Number(age))) return '';
    return parseInt(age);
  },
  gender: (gender: 'm' | 'f' | ''): string =>
    gender === 'm' || gender === 'f' ? gender : '',
};

// Validation helper
const validateAge = (age: string | number) => {
  if (age === '') return null;
  if (typeof age === 'number') {
    if (age < 5) return "You're too young for this.";
    if (age > 130) return "You're too old for this.";
  }

  return null;
};

// Error handler for validation errors
const handleValidationError = (err: unknown, res: Response) => {
  if (err instanceof mongoose.Error.ValidationError) {
    if (err.errors) {
      const field = Object.keys(err.errors)[0];
      return res.status(400).json({
        success: false,
        msg: field
          ? (err.errors[field]?.message ?? 'Invalid input.')
          : 'Invalid input.',
      });
    }
  }

  res.status(500).json({ success: false, msg: 'Something went wrong.' });
};

// Format user response
const formatUser = (user: UserDoc) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  age: user.age,
  gender: user.gender,
});

// TODO(session-12): replace with a Zod schema. body is untrusted input.
// Sanitize request body
const sanitizeUser = (body: any) => ({
  name: sanitizers.name(body.name || ''),
  email: sanitizers.email(body.email || ''),
  age: sanitizers.age(body.age),
  gender: sanitizers.gender(body.gender || ''),
});

// GET single user
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, msg: 'User not found.' });
    }
    res.json(user);
  } catch (err) {
    res.status(404).json({ success: false, msg: 'User not found.' });
  }
});

// GET all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (err) {
    res.status(500).json({ success: false, msg: 'Something went wrong.' });
  }
});

// CREATE user
router.post('/', postLimiter, async (req, res) => {
  try {
    const sanitized = sanitizeUser(req.body);

    // Validate age
    const ageError = validateAge(sanitized.age);
    if (ageError) {
      return res.status(403).json({ success: false, msg: ageError });
    }

    const newUser = new User(sanitized);
    const result = await newUser.save();

    res.status(201).json({
      success: true,
      msg: 'Successfully added!',
      result: formatUser(result),
    });
  } catch (err) {
    handleValidationError(err, res);
  }
});

// UPDATE user
router.put('/:id', async (req, res) => {
  try {
    const sanitized = sanitizeUser(req.body);

    // Validate age
    const ageError = validateAge(sanitized.age);
    if (ageError) {
      return res.status(403).json({ success: false, msg: ageError });
    }

    const user = await User.findByIdAndUpdate(req.params.id, sanitized, {
      runValidators: true,
      context: 'query',
      new: true,
    });

    if (!user) {
      return res.status(404).json({ success: false, msg: 'User not found.' });
    }

    res.json({
      success: true,
      msg: 'Successfully updated!',
      result: formatUser(user),
    });
  } catch (err) {
    handleValidationError(err, res);
  }
});

// DELETE user
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, msg: 'User not found.' });
    }

    res.json({
      success: true,
      msg: 'Successfully deleted!',
      result: formatUser(user),
    });
  } catch (err) {
    res.status(500).json({ success: false, msg: 'Something went wrong.' });
  }
});

export const usersRouter = router;

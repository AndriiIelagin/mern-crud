import express, { Response } from 'express';
import rateLimit from 'express-rate-limit';
import {
  toUserResponse,
  User,
  UserResponse,
  type UserDoc,
} from '../models/user';
import mongoose from 'mongoose';
import { UserBody } from './users.schema';
import { ApiResponse } from './api-response';

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

// GET single user
router.get('/:id', async (req, res: Response<ApiResponse<UserResponse>>) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, msg: 'User not found.' });
    }
    res.json({ success: true, result: toUserResponse(user) });
  } catch (err) {
    res.status(404).json({ success: false, msg: 'User not found.' });
  }
});

// GET all users
router.get('/', async (req, res: Response<ApiResponse<UserResponse[]>>) => {
  try {
    const users = await User.find({});
    if (!users || users.length === 0) {
      return res.status(404).json({ success: false, msg: 'No users found.' });
    }

    res.json({ success: true, result: users.map(toUserResponse) });
  } catch (err) {
    res.status(500).json({ success: false, msg: 'Something went wrong.' });
  }
});

// CREATE user
router.post('/', postLimiter, async (req, res) => {
  const parsed = UserBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      msg: parsed.error.issues[0]?.message ?? 'Invalid input.',
    });
  }

  try {
    const newUser = new User(parsed.data);
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
    const parsed = UserBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        msg: parsed.error.issues[0]?.message ?? 'Invalid input.',
      });
    }

    const user = await User.findByIdAndUpdate(req.params.id, parsed.data, {
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

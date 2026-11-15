import mongoose, { HydratedDocument, InferSchemaType } from 'mongoose';
import unique from 'mongoose-unique-validator';
import validator from 'validator';

// Define the database model
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required.'],
    minlength: [1, 'Name must be at least {MINLENGTH} character.'],
    maxlength: [40, 'Name must not exceed {MAXLENGTH} characters.'],
  },
  email: {
    type: String,
    required: [true, 'Email is required.'],
    unique: true,
    minlength: [1, 'Email must be at least {MINLENGTH} character.'],
    maxlength: [40, 'Email must not exceed {MAXLENGTH} characters.'],
    validate: {
      validator: (v: string) => validator.isEmail(v),
      message: 'Email must be valid.',
    },
  },
  age: {
    type: Number,
    max: [130, 'Age must not exceed {MAX}.'],
    min: [5, 'Age must be at least {MIN}.'],
  },
  gender: {
    type: String,
    enum: ['m', 'f', ''] as const,
  },
});

// Use the unique validator plugin
UserSchema.plugin(unique, { message: 'That {PATH} is already taken.' });

export const User = mongoose.model('user', UserSchema);

export type UserFields = InferSchemaType<typeof UserSchema>;

export type UserDoc = HydratedDocument<UserFields>;

export type UserResponse = {
  _id: string;
  name: string;
  email: string;
  age: number | null;
  gender: 'm' | 'f' | null;
};

export function toUserResponse(doc: UserDoc): UserResponse {
  return {
    _id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    age: doc.age ?? null,
    gender: doc.gender || null,
  };
}

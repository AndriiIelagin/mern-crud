import { z } from 'zod';
import stringCapitalizeName from 'string-capitalize-name';

export const UserBody = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required.')
    .max(40, 'Name must not exceed 40 characters.')
    .transform((name) => stringCapitalizeName(name)),

  // TODO 1: email
  // Clean first (trim + lowercase), then validate the cleaned string:
  //   z.string().trim().toLowerCase().pipe( <email check with max 40 + messages> )
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(
      z
        .email('Invalid email address.')
        .max(40, 'Email must not exceed 40 characters.'),
    ),

  // TODO 2: age
  // Accept: missing, '', or a number / numeric string (integer 5–130).
  // Shape:  z.union([ <'' literal FIRST>, <coerced number with int/min/max + messages> ])
  //           .optional()
  //           .transform((age) => /* '' or undefined → null, otherwise the number */)
  age: z
    .union([
      z.literal(''),
      z.coerce
        .number()
        .int('Age must be a whole number.')
        .min(5, "You're too young for this.")
        .max(130, "You're too old for this."),
    ])
    .optional()
    .transform((age) => (age === '' || age === undefined ? null : age)),

  gender: z
    .enum(['m', 'f', ''], { error: 'Gender must be m or f.' })
    .default(''),
});

// The TS type of the *parsed* body, derived from the schema (never hand-written)
export type UserInput = z.infer<typeof UserBody>;

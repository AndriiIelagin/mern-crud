import { z } from 'zod';

const EnvSchema = z.object({
  DB: z
    .string()
    .min(1, 'DB is required.')
    .default('mongodb://127.0.0.1:27017/mern-crud'),
  PORT: z.coerce
    .number()
    .int()
    .min(1, 'PORT must be between 1 and 65535')
    .max(65535, 'PORT must be between 1 and 65535')
    .default(3000),
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  CORS: z
    .enum(['true', 'false'])
    .default('false')
    .transform((val) => val === 'true'),
  CLIENT_URL: z.url({ protocol: /^https?$/ }).default('http://localhost:4200'),
});

export type Env = z.infer<typeof EnvSchema>;

function loadEnv(): Env {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    console.error(
      'Invalid environment variables:\n' + z.prettifyError(result.error),
    );
    process.exit(1); // fail fast at boot
  }
  return result.data;
}

export const env = loadEnv();

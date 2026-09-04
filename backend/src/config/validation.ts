import * as Joi from 'joi';

export const validationSchema = Joi.object({
  PORT: Joi.number().default(3000),

  DATABASE_URL: Joi.string().required(),

  JWT_SECRET: Joi.string().required(),

  JWT_EXPIRES_IN: Joi.string().required(),

  FRONTEND_URL: Joi.string().required(),

  LIVEKIT_URL: Joi.string().allow('').optional(),
  LIVEKIT_API_KEY: Joi.string().allow('').optional(),
  LIVEKIT_API_SECRET: Joi.string().allow('').optional(),
});

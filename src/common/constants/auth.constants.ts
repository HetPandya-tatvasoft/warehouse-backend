export const AUTH_CONSTANTS = {
  HASH_SALT_ROUNDS: 10,
  PASSWORD_RESET_TOKEN_EXPIRY_MINUTES: 30,
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]).+$/,
} as const;

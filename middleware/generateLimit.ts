import { rateLimit } from "express-rate-limit";

export const generateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: "too_many_requests",
    message:
      "You've reached 5 new walkthroughs this hour. Please try again later.",
  },
});

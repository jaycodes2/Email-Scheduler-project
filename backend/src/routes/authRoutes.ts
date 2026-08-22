import { Router } from "express";
import passport from "../config/passport.js";

const router = Router();

// Start Google OAuth login
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

// Google redirects here after login
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.VERCEL_URL}/login`,
  }),
  (_req, res) => {
    res.redirect(`${process.env.VERCEL_URL}/dashboard`);
  }
);

// Get currently logged-in user
router.get("/me", (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      error: "Not authenticated",
    });
  }

  res.json(req.user);
});

// Logout
router.post("/logout", (req, res, next) => {
  req.logout((error) => {
    if (error) {
      return next(error);
    }

    req.session.destroy(() => {
      res.clearCookie("connect.sid");

      res.json({
        message: "Logged out successfully",
      });
    });
  });
});

export default router;
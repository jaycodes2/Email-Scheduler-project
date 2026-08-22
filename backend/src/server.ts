import "dotenv/config";

import express from "express";
import session from "express-session";
import cors from "cors";

import { pool } from "./config/db.js";
import { redis } from "./config/redis.js";
import passport from "./config/passport.js";
import "./workers/emailWorker.js";

import emailRoutes from "./routes/emailRoutes.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();

// Required when running behind Render's proxy
app.set("trust proxy", 1);

app.use(express.json());

app.use(
  cors({
    origin: process.env.VERCEL_URL,
    credentials: true,
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,

    cookie: {
      secure: true,
      sameSite: "none",
      httpOnly: true,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

pool
  .query("SELECT NOW()")
  .then((result) => {
    console.log("Database connected:", result.rows[0]);
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
  });

redis
  .ping()
  .then((result) => {
    console.log("Redis connected:", result);
  })
  .catch((error) => {
    console.error("Redis connection failed:", error);
  });

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/emails", emailRoutes);

const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
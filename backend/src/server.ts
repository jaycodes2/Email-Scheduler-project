import "dotenv/config";

import express from "express";
import session from "express-session";
import cors from "cors";

import { pool } from "./config/db.js";
import { redis } from "./config/redis.js";
import passport from "./config/passport.js";

import emailRoutes from "./routes/emailRoutes.js";
import authRoutes from "./routes/authRoutes.js";
const app = express();

app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
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

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/emails", emailRoutes);

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
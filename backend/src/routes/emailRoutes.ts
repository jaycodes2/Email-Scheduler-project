import { Router } from "express";

import {
  createEmail,
  getEmails,
  toggleEmailStar,
} from "../controllers/emailController.js";

import { upload } from "../config/upload.js";

const router = Router();

router.post(
  "/",
  upload.single("attachment"),
  createEmail
);

router.get("/", getEmails);

router.patch("/:id/star", toggleEmailStar);

export default router;
import express from "express";
import {
  login,
  logout,
  refresh,
  register,
} from "../controllers/authControllers.js";

const router = express.Router();
// A middleware to handle user registration
router.post("/register", register);

// A middleware to handle user login
router.post("/login", login);

// A middleware to handle token refresh
router.get("/refresh", refresh);

router.get("/logout", logout);

export default router;

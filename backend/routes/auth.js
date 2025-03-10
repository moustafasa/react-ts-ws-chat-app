import express from "express";
import jsonServer from "json-server";
import {
  login,
  logout,
  refresh,
  register,
} from "../controllers/authControllers.js";

const dbRouter = jsonServer.router("src/app/server/db.json");

const db = dbRouter.db;

const router = express.Router();
// A middleware to handle user registration
router.post("/register", register(db));

// A middleware to handle user login
router.post("/login", login(db));

// A middleware to handle token refresh
router.get("/refresh", refresh(db));

router.get("/logout", logout(db));

export default router;

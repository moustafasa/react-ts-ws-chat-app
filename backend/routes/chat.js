import express from "express";
import jsonServer from "json-server";
import {
  getChats,
  createChat,
  getMessages,
} from "../controllers/chatControllers.js";

const dbRouter = jsonServer.router("src/app/server/db.json");

const db = dbRouter.db;

const router = express.Router();
router.get("/chats", getChats(db));

router.post("/chats", createChat(db));

router.get("/messages/:chatId", getMessages(db));

export default router;

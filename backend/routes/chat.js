import express from "express";
import {
  getChats,
  createChat,
  getMessages,
} from "../controllers/chatControllers.js";

const router = express.Router();
router.get("/chats", getChats);

router.post("/chats", createChat);

router.get("/messages/:chatId", getMessages);

export default router;

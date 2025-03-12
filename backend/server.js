import { authenticate } from "./controllers/authControllers.js";
import jsonServer from "json-server";
import cookieParser from "cookie-parser";
import { WebSocketServer } from "ws";
import { createServer } from "http";
import express from "express";
import {
  activateUser,
  getUserRooms,
  onMessage,
  onRead,
  socketClose,
  upgradeUrl,
} from "./controllers/wsMessages.js";
import { Mongoose } from "mongoose";
import authRouter from "./routes/auth.js";
import chatRouter from "./routes/chat.js";
import { checkAuth } from "./middlewares/checkAuth.js";
import { checkOrigin } from "./middlewares/checkOrigin.js";
import { hashPassword } from "./middlewares/hashPassword.js";
import { configDotenv } from "dotenv";
import dbConnect from "./config/dbConnect.js";

configDotenv();
const server = express();
const app = createServer(server);
const router = jsonServer.router("/db.json");
const middlewares = jsonServer.defaults();
const port = import.meta.PORT || 3000;
const db = router.db;
dbConnect();

server.use(middlewares);
// A middleware to hash the password before saving a new user
server.use(jsonServer.bodyParser);
server.use(cookieParser());
server.use(
  jsonServer.rewriter({
    "data/users": "/users",
    "data/chatRooms": "/chatRooms",
    "data/messages": "/messages",
  })
);

// Use the middleware function before the router
server.use(checkOrigin);
server.use(hashPassword);

server.use(authRouter);

// Apply the checkAuth middleware to all routes
server.use(checkAuth);

//////////////////////////////////////////
/////////////// chats ////////////////////
//////////////////////////////////////////

server.use(chatRouter);

const wss = new WebSocketServer({ noServer: true, path: "/chat" });

wss.on("connection", async (ws) => {
  await getUserRooms(ws);
  activateUser(wss, ws);
  ws.on("message", (data) => {
    const message = JSON.parse(data.toString());
    switch (message.type) {
      case "MESSAGE": {
        onMessage(message, wss, ws);
        break;
      }
      case "READ": {
        onRead(wss, message);
        break;
      }
    }
  });

  ws.on("close", socketClose(wss, ws));
});

app.on("upgrade", upgradeUrl(wss, authenticate));

server.use(router);
app.listen(
  port,
  setTimeout(() => {
    console.log("server is running in " + port);
  }, 1000)
);

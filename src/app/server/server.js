import {
  checkOrigin,
  hashPassword,
  register,
  login,
  refresh,
  logout,
  checkAuth,
  authenticate,
} from "./auth/auth.js";
import jsonServer from "json-server";
import cookieParser from "cookie-parser";
import { WebSocketServer } from "ws";
import { createServer } from "http";
import express from "express";
import {
  activateUser,
  createChat,
  getChats,
  getMessages,
  socketClose,
  upgradeUrl,
} from "./chat/chat.js";
import { onMessage, onRead } from "./chat/wsMessages.js";

const server = express();
const app = createServer(server);
const router = jsonServer.router("src/app/server/db.json");
const middlewares = jsonServer.defaults();
const port = import.meta.PORT || 3000;
const db = router.db;

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

// server.ws("/api", (ws) => {
//   ws.on("message", (data) => {
//     console.log(data);
//     ws.send("message");
//   });
// });

// Use the middleware function before the router
server.use(checkOrigin);
server.use(hashPassword);

// A middleware to handle user registration
server.post("/register", register(db));

// A middleware to handle user login
server.post("/login", login(db));

// A middleware to handle token refresh
server.get("/refresh", refresh(db));

server.get("/logout", logout(db));

// Apply the checkAuth middleware to all routes
server.use(checkAuth);

// server.get("/users/:id", (req, res) => {
//   const { id } = req.params;
//   const user = db.get("data").get("users").find({ id }).value();
//   if (user) {
//     res.status(201).send(JSON.stringify(user));
//   } else {
//     res.status(404).send("user not found");
//   }
// });

//////////////////////////////////////////
/////////////// chats ////////////////////
//////////////////////////////////////////

server.get("/chats", getChats(db));

server.post("/chats", createChat(db));

server.get("/messages/:chatId", getMessages(db));

const wss = new WebSocketServer({ noServer: true, path: "/chat" });

wss.on("connection", (ws) => {
  activateUser(db, wss, ws);

  ws.on("message", (data) => {
    const message = JSON.parse(data.toString());
    switch (message.type) {
      case "MESSAGE": {
        onMessage(db, message, wss, ws);
        break;
      }
      case "READ": {
        onRead(db, wss, message);
        break;
      }
    }
  });

  ws.on("close", socketClose(db, wss, ws));
});

app.on("upgrade", upgradeUrl(wss, authenticate));

server.use(router);
app.listen(
  port,
  setTimeout(() => {
    console.log("server is running in " + port);
  }, 1000)
);

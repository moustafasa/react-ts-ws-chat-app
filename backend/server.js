import { authenticate } from "./controllers/authControllers.js";
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
import authRouter from "./routes/auth.js";
import chatRouter from "./routes/chat.js";
import { checkAuth } from "./middlewares/checkAuth.js";
import { allowedHosts } from "./middlewares/checkOrigin.js";
import { hashPassword } from "./middlewares/hashPassword.js";
import { configDotenv } from "dotenv";
import dbConnect from "./config/dbConnect.js";
import cors from "cors";

configDotenv();
const server = express();
const app = createServer(server);
const port = import.meta.PORT || 3000;

dbConnect();

server.use(cookieParser());

// Parse JSON request bodies
server.use(express.json());

// Use the middleware function before the router
server.use(
  cors({
    origin: (origin, callback) => {
      // Check if the origin is in the allowed hosts
      if (allowedHosts.indexOf(origin) !== -1 || !origin) {
        console.log(origin);
        callback(null, origin);
      } else {
        console.log("error");
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
server.use(hashPassword);

server.use(authRouter);

// Apply the checkAuth middleware to all routes
server.use(checkAuth);

//////////////////////////////////////////
/////////////// chats ////////////////////
//////////////////////////////////////////

const wss = new WebSocketServer({ noServer: true, path: "/chat" });
server.use((req, res, next) => {
  req.wss = wss;
  next();
});
server.use(chatRouter);

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

app.listen(
  port,
  setTimeout(() => {
    console.log("server is running in " + port);
  }, 1000)
);

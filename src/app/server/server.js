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
import { v4 as uuidv4 } from "uuid";

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

server.get("/chats", (req, res) => {
  // get the roomsId of current user
  const userRooms = db
    .get("data")
    .get("users")
    .find({ id: req.userId })
    .get("rooms")
    .value();

  // get the rooms of currentUser
  const chats = db
    .get("data")
    .get("chatRooms")
    .filter((room) => userRooms.includes(room.id))
    .values();

  // refactor chat to send needed values
  const sendedChats = chats.map((chat) => {
    const userId = chat.users.filter((user) => user !== req.userId)[0];
    const user = db.get("data").get("users").find({ id: userId }).value();
    const messages = db
      .get("data")
      .get("messages")
      .filter((message) => message.room === chat.id)
      .value();

    // console.log(messages);
    messages.sort(
      (a, b) =>
        new Date(a.timeStamp).getTime() - new Date(b.timeStamp).getTime()
    );

    // console.log(messages);

    const modifiedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      img: user.img,
      active: user.activeState,
    };

    const lastSeenStamp = chat.lastSeen.find(
      (seen) => seen.id === req.userId
    ).timeStamp;

    console.log(lastSeenStamp);

    return {
      id: chat.id,
      user: modifiedUser,
      latestMessage: messages[messages.length - 1],
      unReadMessages: messages.filter(
        (msg) =>
          msg.userId !== req.userId &&
          new Date(msg.timeStamp).getTime() > new Date(lastSeenStamp).getTime()
      ).length,
      lastSeen: chat.lastSeen,
    };
  });

  res.send(sendedChats);
});

server.post("/chats", (req, res) => {
  const { email } = req.body;
  const otherUserDp = db.get("data").get("users").find({ email });
  const otherUser = otherUserDp.value();

  if (otherUser) {
    const allRooms = db.get("data").get("chatRooms");

    const currentUserDb = db.get("data").get("users").find({ id: req.userId });
    const currentUser = currentUserDb.value();

    const commoRooms = allRooms
      .filter((room) => currentUser.rooms.includes(room.id))
      .filter((room) => room.users.find((user) => user.email === email))
      .value();

    if (commoRooms.length === 0) {
      // generate room id
      const roomId = uuidv4();

      // add room to users rooms
      currentUserDb.get("rooms").push(roomId).write();
      otherUserDp.get("rooms").push(roomId).write();

      const room = {
        id: roomId,
        users: [currentUser.id, otherUser.id],
        messages: [],
        lastSeen: [
          { id: currentUser.id, timeStamp: new Date().toISOString() },
          { id: otherUser.id, timeStamp: new Date().toISOString() },
        ],
      };
      allRooms.push(room).write();
    }
  }
  res.sendStatus(200);
});

server.get("/messages/:chatId", (req, res) => {
  const { chatId } = req.params;

  const messagesOfChat = db
    .get("data")
    .get("messages")
    .filter((message) => message.room === chatId)
    .value();

  messagesOfChat.sort(
    (a, b) => new Date(a.timeStamp).getTime() - new Date(b.timeStamp).getTime()
  );

  res.send(messagesOfChat);
});

const wss = new WebSocketServer({ noServer: true, path: "/chat" });

wss.on("connection", (ws, req) => {
  // make user active
  db.get("data")
    .get("users")
    .find({ id: ws.userId })
    .assign({ activeState: true })
    .write();

  wss.clients.forEach((client) => {
    if (client !== ws && client.rooms.find((room) => ws.rooms.includes(room))) {
      client.send(JSON.stringify({ type: "JOIN", userId: ws.userId }));
    }
  });

  ws.on("message", (data) => {
    const message = JSON.parse(data.toString());
    switch (message.type) {
      case "MESSAGE": {
        const id = uuidv4();
        const { room, userId, msg, meta } = message;
        const chatDb = db.get("data").get("chatRooms").find({ id: room });
        // add message to db
        db.get("data")
          .get("messages")
          .push({
            id,
            room,
            userId,
            msg,
            timeStamp: meta.timeStamp,
          })
          .write();

        chatDb.get("messages").push(id).write();
        chatDb
          .assign({
            unReadMessages: chatDb.get("unReadMessages").value() + 1,
          })
          .write();

        wss.clients.forEach((client) => {
          if (client.rooms.find((room) => room === message.room)) {
            client.send(
              JSON.stringify({
                ...message,
                userId: ws.userId,
                meta: { ...message.meta, id },
              })
            );
          }
        });
        break;
      }
      case "READ": {
        const { room, userId, meta } = message;
        db.get("data")
          .get("chatRooms")
          .find({ id: room })
          .get("lastSeen")
          .find((user) => user.id === userId)
          .assign({ timeStamp: meta.timeStamp })
          .write();

        wss.clients.forEach((client) => {
          if (client.rooms.find((room) => room === message.room)) {
            client.send(
              JSON.stringify({
                type: message.type,
                room,
                userId,
                meta,
              })
            );
          }
        });
      }
    }
  });

  ws.on("close", (e) => {
    // make the user inactive on close
    db.get("data")
      .get("users")
      .find({ id: ws.userId })
      .assign({ activeState: false })
      .write();
    wss.clients.forEach((client) => {
      if (
        client !== ws &&
        client.rooms.find((room) => ws.rooms.includes(room))
      ) {
        client.send(JSON.stringify({ type: "LEAVE", userId: ws.userId }));
      }
    });
  });
});

app.on("upgrade", (request, socket, head) => {
  const token = request.url.split("token=")[1];

  const onSuccess = (decoded) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      // Set user ID or any other relevant data
      ws.userId = decoded.id;
      ws.rooms = decoded.rooms;

      // Emit the connection event
      wss.emit("connection", ws, request);
    });
  };

  const onFail = () => {
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
    return;
  };

  authenticate(token, onSuccess, onFail);
});

server.use(router);
app.listen(
  port,
  setTimeout(() => {
    console.log("server is running in " + port);
  }, 1000)
);

import { v4 as uuidv4 } from "uuid";

export const getChats = (db) => (req, res) => {
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
};

export const createChat = (db) => (req, res) => {
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
};

export const getMessages = (db) => (req, res) => {
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
};

export const upgradeUrl = (wss, authenticate) => (request, socket, head) => {
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
};

export const socketClose = (db, wss, ws) => () => {
  // make the user inactive on close
  db.get("data")
    .get("users")
    .find({ id: ws.userId })
    .assign({ activeState: false })
    .write();

  wss.clients.forEach((client) => {
    if (client !== ws && client.rooms.find((room) => ws.rooms.includes(room))) {
      client.send(JSON.stringify({ type: "LEAVE", userId: ws.userId }));
    }
  });
};

export const activateUser = (db, wss, ws) => {
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
};

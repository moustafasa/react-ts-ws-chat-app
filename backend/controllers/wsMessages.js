import Rooms from "../models/Rooms.js";
import Users from "../models/Users.js";

export const onRead = async (wss, message) => {
  const { room, userId, meta } = message;
  const chatRoom = await Rooms.findOne({ _id: room }, "lastSeen");
  chatRoom.lastSeen.find((last) => last.userId === userId).timeStamp =
    meta.timeStamp;

  await chatRoom.save();

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
};

export const onMessage = async (message, wss, ws) => {
  const { room, userId, msg, meta } = message;
  const chatRoom = await Rooms.findById(room);
  const createdMessage = chatRoom.messages.create({
    userId,
    msg,
    timeStamp: meta.timeStamp,
  });
  // add message to db
  chatRoom.messages.push(createdMessage);

  await chatRoom.save();

  wss.clients.forEach((client) => {
    if (client.rooms.find((clientRoom) => clientRoom === room)) {
      client.send(
        JSON.stringify({
          ...message,
          userId: ws.userId,
          meta: { ...meta, id: createdMessage._id },
        })
      );
    }
  });
};

export const socketClose = (wss, ws) => async () => {
  // make the user inactive on close
  await Users.findByIdAndUpdate(ws.userId, { activeState: false });

  wss.clients.forEach((client) => {
    if (client !== ws && client.rooms.find((room) => ws.rooms.includes(room))) {
      client.send(JSON.stringify({ type: "LEAVE", userId: ws.userId }));
    }
  });
};

export const activateUser = async (wss, ws) => {
  // make user active
  await Users.findByIdAndUpdate(ws.userId, { activeState: true });

  wss.clients.forEach((client) => {
    if (client !== ws && client.rooms.find((room) => ws.rooms.includes(room))) {
      client.send(JSON.stringify({ type: "JOIN", userId: ws.userId }));
    }
  });
};

export const getUserRooms = async (ws) => {
  const rooms = await Rooms.find({ users: ws.userId }, "_id");
  ws.rooms = rooms.map((room) => room._id.toString());
};

export const upgradeUrl = (wss, authenticate) => (request, socket, head) => {
  const token = request.url.split("token=")[1];

  const onSuccess = (decoded) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      // Set user ID or any other relevant data
      ws.userId = decoded.id;

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

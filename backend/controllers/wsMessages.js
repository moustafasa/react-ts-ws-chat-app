import { v4 as uuidv4 } from "uuid";

export const onRead = (db, wss, message) => {
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
};

export const onMessage = (db, message, wss, ws) => {
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
};

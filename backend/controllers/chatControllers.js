import Users from "../models/Users.js";
import Rooms from "../models/Rooms.js";
import { isValidObjectId } from "mongoose";

export const refactorChats = (chat, userId) => {
  const user = chat.users[0];
  const messages = chat.messages;

  messages.sort(
    (a, b) => new Date(a.timeStamp).getTime() - new Date(b.timeStamp).getTime()
  );

  const modifiedUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    img: user.img,
    active: user.activeState,
  };

  const lastSeenStamp = chat.lastSeen.find(
    (seen) => seen.userId === userId
  ).timeStamp;

  return {
    id: chat.id,
    user: modifiedUser,
    latestMessage: messages[messages.length - 1],
    unReadMessages: messages.filter(
      (msg) =>
        !msg.userId.includes(userId) &&
        new Date(msg.timeStamp).getTime() > new Date(lastSeenStamp).getTime()
    ).length,
    lastSeen: chat.lastSeen,
  };
};

export const getChats = async (req, res) => {
  // get the rooms of currentUser
  try {
    const chats = await Rooms.find({ users: req.userId }).populate({
      path: "users",
      match: { _id: { $ne: req.userId } },
    });

    // refactor chat to send needed values
    const sendedChats = chats.map((chat) => refactorChats(chat, req.userId));

    res.send(sendedChats);
  } catch (err) {
    res.status(500).send("Server Error");
  }
};

export const createChat = async (req, res) => {
  try {
    const { email } = req.body;
    const otherUser = await Users.findOne({ email });

    if (otherUser) {
      const currentUser = await Users.findById(req.userId);

      const commoRooms = await Rooms.find({
        users: { $all: [req.userId, otherUser._id.toString()] },
      });

      if (commoRooms.length === 0) {
        const room = {
          users: [currentUser.id, otherUser.id],
          messages: [],
          lastSeen: [
            { userId: currentUser.id, timeStamp: new Date().toISOString() },
            { userId: otherUser.id, timeStamp: new Date().toISOString() },
          ],
        };

        const createdRoom = await (
          await Rooms.create(room)
        ).populate({
          path: "users",
          match: { _id: { $ne: currentUser.id } },
        });

        req.wss.clients.forEach((client) => {
          if ([currentUser.id, otherUser.id].includes(client.userId)) {
            client.rooms.push(createdRoom.id);
            client.send(
              JSON.stringify({
                type: "CREATE",
                chat: refactorChats(createdRoom, currentUser.id),
              })
            );
          }
        });
        res.sendStatus(200);
      } else {
        res.status(400).send("Chat already exists");
      }
    } else {
      res.status(404).send("User not found");
    }
  } catch (err) {
    res.status(500).send("Server Error");
  }
};

export const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    if (!isValidObjectId(chatId)) {
      return res.status(404).send("Chat not found");
    }
    const chat = await Rooms.findById(chatId, "messages");
    if (!chat) {
      return res.status(404).send("Chat not found");
    }

    const messagesOfChat = chat.messages.map((message) => ({
      id: message._id.toString(),
      msg: message.msg,
      timeStamp: message.timeStamp,
      userId: message.userId,
      room: chat._id.toString(),
    }));

    messagesOfChat.sort(
      (a, b) =>
        new Date(a.timeStamp).getTime() - new Date(b.timeStamp).getTime()
    );
    res.send(messagesOfChat);
  } catch (err) {
    res.status(500).send("Server Error");
  }
};

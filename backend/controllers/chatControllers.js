import Users from "../models/Users.js";
import Rooms from "../models/Rooms.js";

export const getChats = async (req, res) => {
  // get the rooms of currentUser
  const chats = await Rooms.find({ users: req.userId }).populate({
    path: "users",
    match: { _id: { $ne: req.userId } },
  });

  // refactor chat to send needed values
  const sendedChats = chats.map((chat) => {
    const user = chat.users[0];
    const messages = chat.messages;

    messages.sort(
      (a, b) =>
        new Date(a.timeStamp).getTime() - new Date(b.timeStamp).getTime()
    );

    const modifiedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      img: user.img,
      active: user.activeState,
    };

    const lastSeenStamp = chat.lastSeen.find(
      (seen) => seen.userId === req.userId
    ).timeStamp;

    return {
      id: chat.id,
      user: modifiedUser,
      latestMessage: messages[messages.length - 1],
      unReadMessages: messages.filter(
        (msg) =>
          !msg.userId.includes(req.userId) &&
          new Date(msg.timeStamp).getTime() > new Date(lastSeenStamp).getTime()
      ).length,
      lastSeen: chat.lastSeen,
    };
  });

  res.send(sendedChats);
};

export const createChat = async (req, res) => {
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
      await Rooms.create(room);
    }
  }
  res.sendStatus(200);
};

export const getMessages = async (req, res) => {
  const { chatId } = req.params;
  const chat = await Rooms.findById(chatId, "messages");

  const messagesOfChat = chat.messages.map((message) => ({
    id: message._id.toString(),
    msg: message.msg,
    timeStamp: message.timeStamp,
    userId: message.userId,
    room: chat._id.toString(),
  }));

  messagesOfChat.sort(
    (a, b) => new Date(a.timeStamp).getTime() - new Date(b.timeStamp).getTime()
  );
  res.send(messagesOfChat);
};

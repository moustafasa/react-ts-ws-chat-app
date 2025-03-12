import { model, Schema } from "mongoose";

const roomSchema = new Schema({
  users: { type: [String], ref: "User" },
  messages: [
    new Schema({
      userId: { type: [String], ref: "User" },
      msg: String,
      timeStamp: Date,
    }),
  ],
  lastSeen: [
    {
      type: {
        userId: { type: String, ref: "User" },
        timeStamp: Date,
      },
    },
  ],
});

export default model("Room", roomSchema);

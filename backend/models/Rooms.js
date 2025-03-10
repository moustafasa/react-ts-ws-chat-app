import { Model, models, Schema } from "mongoose";

const roomSchema = new Schema({
  users: { type: [String], ref: "User" },
  messages: [
    {
      type: {
        userId: { type: [String], ref: "User" },
        msg: String,
      },
      timestamps: true,
    },
  ],
  lastSeen: [
    {
      type: {
        userId: { type: String, ref: "User" },
      },
      timestamps: true,
    },
  ],
});

export default models.Rooms || new Model("Room", roomSchema);

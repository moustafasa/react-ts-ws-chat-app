import { Model, models, Schema } from "mongoose";

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  roles: [String],
  password: { type: String, required: true },
  img: { type: String, required: false },
  activeState: { type: Boolean, required: false },
  rooms: [String],
  refresh: { type: String, required: false },
});

export default models.Users || new Model("User", userSchema);

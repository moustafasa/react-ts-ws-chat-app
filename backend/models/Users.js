import { model, Schema } from "mongoose";

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  roles: [String],
  password: { type: String, required: true },
  img: { type: String, required: false },
  activeState: { type: Boolean, required: false, default: false },
  refresh: { type: String, required: false, default: undefined },
});

export default model("User", userSchema);

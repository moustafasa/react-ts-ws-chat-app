import { z } from "zod";

export enum WsType {
  "JOIN" = "JOIN",
  "LEAVE" = "LEAVE",
  "MESSAGE" = "MESSAGE",
}

export const userSchema = z.object({
  id: z.coerce.string(),
  name: z.string(),
  email: z.string().email(),
  room: z.coerce.string(),
  img: z.string(),
  active: z.boolean(),
});

export const messageSchema = z.object({
  id: z.coerce.string(),
  room: z.coerce.string(),
  userId: z.coerce.string(),
  msg: z.string(),
  timeStamp: z.coerce.string(),
});

export const messagesFromChatSchema = z
  .array(z.object({ messages: z.array(messageSchema) }))
  .transform((chats) => chats.map((chat) => chat.messages).flat());

const chatSchema = z.object({
  id: z.coerce.string(),
  user: userSchema.transform((user) => user.id),
});

const wsMessageSchema = z.object({
  type: z.nativeEnum(WsType),
  room: z.coerce.string().optional(),
  userId: z.coerce.string(),
  msg: z.string().optional(),
  meta: z
    .object({
      id: z.coerce.string(),
      timeStamp: z.coerce.string(),
    })
    .optional(),
});

export const wsMessageFromJsonSchema = z
  .string()
  .transform((data) => JSON.parse(data))
  .pipe(wsMessageSchema);

export const MessageFromWsMessageScheme = wsMessageSchema.transform(
  (message) => {
    const { room, userId, msg, meta } = message;

    return {
      id: meta?.id,
      room,
      userId,
      msg,
      timeStamp: meta?.timeStamp,
    };
  }
);

export const arrayOfChatSchema = z.array(chatSchema);

export type ParsedChatType = z.infer<typeof chatSchema>;
export type unParsedChatType = Omit<ParsedChatType, "user"> & {
  messages: MessageType[];
  user: ChatUserType;
};

export type WsMessage = z.infer<typeof wsMessageSchema>;

export type MessageType = z.infer<typeof messageSchema>;

export type ChatUserType = z.infer<typeof userSchema>;

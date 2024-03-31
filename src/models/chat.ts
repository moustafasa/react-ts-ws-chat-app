import { z } from "zod";

export enum WsType {
  "JOIN" = "JOIN",
  "LEAVE" = "LEAVE",
  "MESSAGE" = "MESSAGE",
  "READ" = "READ",
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

const chatSchema = z.object({
  id: z.coerce.string(),
  user: userSchema.transform((user) => user.id),
});

export const latestMessagesSchema = z.object({
  id: z.coerce.string(),
  latestMessage: messageSchema.or(z.undefined()),
  unReadMessages: z.coerce.number(),
  lastSeen: z.array(
    z.object({ id: z.coerce.string(), timeStamp: z.coerce.string() })
  ),
});

export const MessagesMetaSchema = z.object({
  id: z.coerce.string(),
  read: z.coerce.boolean(),
  room: z.coerce.string(),
  timeStamp: z.coerce.string(),
  userId: z.coerce.string(),
});

const wsMessageSchema = z.object({
  type: z.nativeEnum(WsType),
  room: z.coerce.string().optional(),
  userId: z.coerce.string(),
  msg: z.string().optional(),
  meta: z
    .object({
      id: z.coerce.string().optional(),
      timeStamp: z.coerce.string().optional(),
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

export const arrayOfMessageSchema = z.array(messageSchema);

export const arrayOfChatSchema = z.array(chatSchema);
export const arrayOfLatestMessageSchema = z.array(latestMessagesSchema);
export const arrayOfMessageMetaSchema = z.array(MessagesMetaSchema);

export type ParsedChatType = z.infer<typeof chatSchema>;
export type unParsedChatType = Omit<ParsedChatType, "user"> & {
  user: ChatUserType;
  latestMessage: MessageType | undefined;
};

export type WsMessage = z.infer<typeof wsMessageSchema>;

export type MessageType = z.infer<typeof messageSchema>;

export type ChatUserType = z.infer<typeof userSchema>;
export type LatestMessagesType = z.infer<typeof latestMessagesSchema>;
export type MessagesMetaType = z.infer<typeof MessagesMetaSchema>;

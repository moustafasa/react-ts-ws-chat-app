import {
  EntityState,
  createEntityAdapter,
  createSelector,
} from "@reduxjs/toolkit";
import { apiSlice } from "../../app/api/apiSlice";
import {
  type ChatUserType,
  WsType,
  arrayOfChatSchema,
  wsMessageFromJsonSchema,
  type ParsedChatType,
  userSchema,
  WsMessage,
  unParsedChatType,
  MessageFromWsMessageScheme,
  MessageType,
  messagesFromChatSchema,
} from "../../models/chat";
import type { RootState } from "../../app/store";
import { getCurrentUser, getToken } from "../auth/authSlice";

const chatsAdapter = createEntityAdapter<ParsedChatType>();

const messagesAdapter = createEntityAdapter<MessageType>();
const usersAdapter = createEntityAdapter<ChatUserType>();

const messagesState = messagesAdapter.getInitialState();
const usersState = usersAdapter.getInitialState();
const chatsState = chatsAdapter.getInitialState();

let socket: WebSocket | null;

const getSocket = (token: string) => {
  if (!socket) {
    socket = new WebSocket(`ws://localhost:3000/chat?token=${token}`);
    socket.onclose = () => {
      socket = null;
    };
  }

  return socket;
};

type GetChatsType = {
  chats: EntityState<ParsedChatType, string>;
  users: EntityState<ChatUserType, string>;
  messages: EntityState<MessageType, string>;
};

export const chatApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getChats: builder.query<GetChatsType, void>({
      query: () => "/chats",
      transformResponse: (chats: unParsedChatType[]) => {
        const parsedMessages = messagesFromChatSchema.parse(chats);
        console.log(parsedMessages);
        const parsedUsers = chats.map((chat) =>
          userSchema.parse({ ...chat.user, room: chat.id })
        );
        const parsedChat = arrayOfChatSchema.parse(chats);

        return {
          chats: chatsAdapter.setAll(chatsState, parsedChat),
          users: usersAdapter.addMany(usersState, parsedUsers),
          messages: messagesAdapter.setAll(messagesState, parsedMessages),
        };
      },
      providesTags: (result) => {
        return result
          ? [
              ...result.chats.ids.map((id) => ({ type: "Chats" as const, id })),
              { type: "Chats", id: "List" },
            ]
          : [{ type: "Chats", id: "List" }];
      },

      async onCacheEntryAdded(
        args,
        { cacheDataLoaded, cacheEntryRemoved, getState, updateCachedData }
      ) {
        const token = getToken(getState() as RootState);
        const ws = getSocket(token);
        try {
          await cacheDataLoaded;
          const onMessageListener = (e: MessageEvent) => {
            const message = wsMessageFromJsonSchema.parse(e.data);

            switch (message.type) {
              case WsType.JOIN: {
                updateCachedData((draft) => {
                  usersAdapter.updateOne(draft.users, {
                    id: message.userId,
                    changes: { active: true },
                  });
                });
                break;
              }
              case WsType.LEAVE: {
                updateCachedData((draft) => {
                  usersAdapter.updateOne(draft.users, {
                    id: message.userId,
                    changes: { active: false },
                  });
                });
                break;
              }
              case WsType.MESSAGE: {
                updateCachedData((draft) => {
                  if (message.room) {
                    const parsedMessage = MessageFromWsMessageScheme.parse(
                      message
                    ) as MessageType;

                    messagesAdapter.addOne(draft.messages, parsedMessage);
                  }
                });
              }
            }
          };
          ws.addEventListener("message", onMessageListener);
        } catch (err) {
          //it is handled by rtk query
        }
        await cacheEntryRemoved;
        ws.close();
      },
      keepUnusedDataFor: 0,
    }),

    sendMessage: builder.mutation<unknown, Partial<WsMessage>>({
      queryFn(message, { getState }) {
        const token = getToken(getState() as RootState);
        const userId = getCurrentUser(getState() as RootState);
        const ws = getSocket(token);
        if (ws.readyState === ws.OPEN) {
          ws.send(
            JSON.stringify({
              ...message,
              userId,
              meta: { timeStamp: new Date() },
            })
          );
        } else {
          ws.addEventListener("open", () => {
            ws.send(
              JSON.stringify({
                ...message,
                userId,
                meta: { timeStamp: new Date() },
              })
            );
          });
        }
        return { data: [] };
      },
    }),

    createChat: builder.mutation<number, string>({
      query: (email) => ({
        url: "/chats",
        method: "post",
        data: { email },
      }),
      invalidatesTags: [{ type: "Chats", id: "List" }],
    }),
  }),
});

export const {
  useGetChatsQuery,
  useCreateChatMutation,
  useSendMessageMutation,
} = chatApiSlice;

export const {
  selectAll: getAllChats,
  selectById: getChatById,
  selectEntities: getChatsEntity,
} = chatsAdapter.getSelectors<GetChatsType | undefined>(
  (state) => state?.chats ?? chatsState
);

export const { selectAll: AllUsers, selectById: getUserById } =
  usersAdapter.getSelectors<GetChatsType | undefined>(
    (state) => state?.users ?? usersState
  );

export const selectUserByRoom = createSelector(
  [AllUsers, (state, roomId: string) => roomId],
  (users, roomId) => {
    const user = users.find((user) => user.room === roomId);
    return user;
  }
);

export const { selectById: getMessageById, selectAll: getAllMessages } =
  messagesAdapter.getSelectors<GetChatsType | undefined>(
    (state) => state?.messages || messagesState
  );

export const getMessagesIdsOfRoom = createSelector(
  [getAllMessages, (state, room) => room],
  (messages, room) =>
    messages
      .filter((message) => message.room === room)
      .map((message) => message.id)
);

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
  arrayOfMessageSchema,
} from "../../models/chat";
import type { RootState } from "../../app/store";
import { getCurrentUser, getToken } from "../auth/authSlice";
// import {
//   // getLastSeenArr,
//   recieveNewMessage,
//   resetUnReadMessage,
//   setLatestMessage,
//   updateLatestMessage,
// } from "./chatSlice";

const chatsAdapter = createEntityAdapter<ParsedChatType>({
  sortComparer: (a, b) => {
    return (
      new Date(b.latestMessage?.timeStamp || "").getTime() -
      new Date(a.latestMessage?.timeStamp || "").getTime()
    );
  },
});

const messagesAdapter = createEntityAdapter<MessageType>({
  sortComparer: (a, b) => {
    return new Date(a.timeStamp).getTime() - new Date(b.timeStamp).getTime();
  },
});
const usersAdapter = createEntityAdapter<ChatUserType>();

const messagesState = messagesAdapter.getInitialState();
const usersState = usersAdapter.getInitialState();
const chatsState = chatsAdapter.getInitialState();

let socket: WebSocket | null;

const getSocket = (token: string) => {
  if (!socket || socket.readyState === socket.CLOSED) {
    socket = new WebSocket(`ws://localhost:3000/chat?token=${token}`);
  }
  return socket;
};

export type GetChatsType = {
  chats: EntityState<ParsedChatType, string>;
  users: EntityState<ChatUserType, string>;
};

export const chatApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMessages: builder.query<EntityState<MessageType, string>, string>({
      query: (chatId) => `/messages/${chatId}`,
      transformResponse: (messages: MessageType[]) => {
        const parsedMessages = arrayOfMessageSchema.parse(messages);
        return messagesAdapter.setAll(messagesState, parsedMessages);
      },
      async onCacheEntryAdded(
        chatId,
        {
          cacheDataLoaded,
          cacheEntryRemoved,
          getState,
          updateCachedData,
          dispatch,
        }
      ) {
        const token = getToken(getState() as RootState);
        getSocket(token);
        const ws = socket as WebSocket;

        try {
          await cacheDataLoaded;
          const onMessageListener = (e: MessageEvent) => {
            const message = wsMessageFromJsonSchema.parse(e.data);
            console.log(message, " done");
            switch (message.type) {
              case WsType.MESSAGE: {
                updateCachedData((draft) => {
                  if (message.room && message.room === chatId) {
                    const parsedMessage = MessageFromWsMessageScheme.parse(
                      message
                    ) as MessageType;

                    messagesAdapter.addOne(draft, parsedMessage);
                  }
                });

                break;
              }
              case WsType.READ: {
                const getChatsResult = chatApiSlice.endpoints.getChats.select(
                  undefined
                )(getState() as RootState);
                const oldLastSeen = getLastSeenArr(
                  getChatsResult.data,
                  message.room || ""
                );

                const newLastSeen = oldLastSeen.map((obj) =>
                  obj.userId === message.userId
                    ? {
                        userId: obj.userId,
                        timeStamp: message.meta?.timeStamp || "",
                      }
                    : obj
                );

                dispatch(
                  chatApiSlice.util.updateQueryData(
                    "getChats",
                    undefined,
                    (draft) => {
                      chatsAdapter.updateOne(draft.chats, {
                        id: message.room as string,
                        changes: { lastSeen: newLastSeen },
                      });
                    }
                  )
                );
              }
            }
          };
          ws.addEventListener("message", onMessageListener);
        } catch (err) {
          console.log(err);
          //it is handled by rtk query
        }
        await cacheEntryRemoved;
        // ws.close();
      },
      keepUnusedDataFor: 0,
    }),
    getChats: builder.query<GetChatsType, void>({
      query: () => "/chats",
      transformResponse: (chats: unParsedChatType[]) => {
        const parsedUsers = chats.map((chat) =>
          userSchema.parse({ ...chat.user, room: chat.id })
        );
        const parsedChat = arrayOfChatSchema.parse(chats);
        return {
          chats: chatsAdapter.setAll(chatsState, parsedChat),
          users: usersAdapter.addMany(usersState, parsedUsers),
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
        {
          cacheDataLoaded,
          cacheEntryRemoved,
          getState,
          updateCachedData,
          dispatch,
        }
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
                const latestMessage = MessageFromWsMessageScheme.parse(
                  message
                ) as MessageType;

                updateCachedData((draft) => {
                  chatsAdapter.updateOne(draft.chats, {
                    id: message.room as string,
                    changes: { latestMessage },
                  });
                });

                updateCachedData((draft) => {
                  chatsAdapter.updateOne(draft.chats, {
                    id: message.room as string,
                    changes: {
                      unReadMessages:
                        draft.chats.entities[message.room as string]
                          ?.unReadMessages + 1,
                    },
                  });
                });

                break;
              }
              case WsType.CREATE: {
                // const latestMessage = MessageFromWsMessageScheme.parse(
                //   message
                // ) as MessageType;

                // dispatch(recieveNewMessage(latestMessage));
                dispatch(
                  chatApiSlice.util.invalidateTags([
                    { type: "Chats", id: "List" },
                  ])
                );

                break;
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
              meta: { timeStamp: new Date().toISOString() },
            })
          );
        } else {
          ws.addEventListener("open", () => {
            ws.send(
              JSON.stringify({
                ...message,
                userId,
                meta: { timeStamp: new Date().toISOString() },
              })
            );
          });
        }
        return { data: [] };
      },
    }),
    readMessage: builder.mutation<unknown, string>({
      queryFn(id, { getState, dispatch }) {
        const token = getToken(getState() as RootState);
        const userId = getCurrentUser(getState() as RootState);
        const ws = getSocket(token);
        console.log("done read");
        if (ws.readyState === ws.OPEN) {
          // dispatch(resetUnReadMessage(id));
          dispatch(
            chatApiSlice.util.updateQueryData(
              "getChats",
              undefined,
              (draft) => {
                chatsAdapter.updateOne(draft.chats, {
                  id,
                  changes: { unReadMessages: 0 },
                });
              }
            )
          );
          console.log("done");

          ws.send(
            JSON.stringify({
              type: WsType.READ,
              room: id,
              userId,
              meta: { timeStamp: new Date().toISOString() },
            })
          );
        } else {
          ws.addEventListener("open", () => {
            console.log("done");
            ws.send(
              JSON.stringify({
                type: WsType.READ,
                room: id,
                userId,
                meta: { timeStamp: new Date().toISOString() },
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
  useGetMessagesQuery,
  useReadMessageMutation,
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
export const getLastSeenArr = createSelector(
  getChatById,

  (room) => room?.lastSeen
);
export const getLastSeenTimeStamp = createSelector(
  [getLastSeenArr, (state, room, userId) => userId],
  (lastSeen, userId) =>
    lastSeen?.find((user) => user.userId !== userId)?.timeStamp
);

export const getUnReadNumber = createSelector(
  getChatById,
  (meta) => meta?.unReadMessages || 0
);

export const {
  selectById: getMessageById,
  selectAll: getAllMessages,
  selectIds: getMessagesIds,
} = messagesAdapter.getSelectors<EntityState<MessageType, string> | undefined>(
  (state) => state || messagesState
);

window.addEventListener("beforeunload", () => {
  if (socket) {
    socket.close();
  }
});

import {
  PayloadAction,
  createEntityAdapter,
  createSelector,
  createSlice,
} from "@reduxjs/toolkit";
import type { LatestMessagesType, MessageType } from "../../models/chat";
import type { AppDispatch, RootState } from "../../app/store";
import { getCurrentUser } from "../auth/authSlice";

const latestMessagesAdapter = createEntityAdapter<LatestMessagesType>({});

const initialState = {
  latestMessage: latestMessagesAdapter.getInitialState(),
};

const chatSlice = createSlice({
  name: "chatSlice",
  initialState,
  reducers: {
    setLatestMessage(state, action) {
      latestMessagesAdapter.setAll(state.latestMessage, action.payload);
    },
    updateLatestMessage(state, action) {
      latestMessagesAdapter.updateOne(state.latestMessage, action.payload);
    },
    increaseUnReadMessage(state, action: PayloadAction<string>) {
      latestMessagesAdapter.updateOne(state.latestMessage, {
        id: action.payload,
        changes: {
          unReadMessages:
            state.latestMessage.entities[action.payload].unReadMessages + 1,
        },
      });
    },
    resetUnReadMessage(state, action: PayloadAction<string>) {
      latestMessagesAdapter.updateOne(state.latestMessage, {
        id: action.payload,
        changes: {
          unReadMessages: 0,
        },
      });
    },
  },
});

export const recieveNewMessage =
  (latestMessage: MessageType) =>
  (dispatch: AppDispatch, getState: () => RootState) => {
    const user = getCurrentUser(getState());
    dispatch(
      updateLatestMessage({
        id: latestMessage.room as string,
        changes: {
          latestMessage,
        },
      })
    );
    if (latestMessage.userId !== user) {
      dispatch(increaseUnReadMessage(latestMessage.room));
    }
  };

export default chatSlice.reducer;
export const {
  setLatestMessage,
  updateLatestMessage,
  increaseUnReadMessage,
  resetUnReadMessage,
} = chatSlice.actions;
export const { selectById: getRoomMetaDataById } =
  latestMessagesAdapter.getSelectors<RootState>(
    (state) => state.chat.latestMessage
  );

export const getLastSeenArr = createSelector(
  getRoomMetaDataById,

  (room) => room?.lastSeen
);
export const getLastSeenTimeStamp = createSelector(
  [getLastSeenArr, (state, room, userId) => userId],
  (lastSeen, userId) =>
    lastSeen?.find((user) => user.userId !== userId)?.timeStamp
);

export const getUnReadNumber = createSelector(
  getRoomMetaDataById,
  (meta) => meta?.unReadMessages || 0
);

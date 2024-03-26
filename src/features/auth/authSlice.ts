import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import { jwtDecode } from "jwt-decode";

export type setCredentialsArgs = { token: string };

type InitialState = { token: string; user: string };

const initialState: InitialState = { token: "", user: "" };

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<setCredentialsArgs>) {
      state.token = action.payload.token;
      if (action.payload.token)
        state.user = (jwtDecode(action.payload.token) as { id: string }).id;
    },
    logout(state) {
      state.token = "";
    },
  },
});

export default authSlice.reducer;
export const { setCredentials, logout } = authSlice.actions;
export const getToken = (state: RootState) => state.auth.token;
export const getCurrentUser = (state: RootState) => state.auth.user;

import { apiSlice } from "../../app/api/apiSlice";
import type { LoginType, RegisterType } from "../../models/auth";
import { logout, setCredentials, type setCredentialsArgs } from "./authSlice";

export const authApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<setCredentialsArgs, LoginType>({
      query: (args) => ({
        url: "/login",
        method: "post",
        data: args,
      }),
      async onQueryStarted(args, { queryFulfilled, dispatch }) {
        try {
          const res = await queryFulfilled;
          dispatch(setCredentials(res.data));
        } catch (err) {
          console.log(err);
        }
      },
    }),
    register: builder.mutation<setCredentialsArgs, RegisterType>({
      query: (args) => ({
        url: "/register",
        method: "post",
        data: args,
      }),
      async onQueryStarted(args, { queryFulfilled, dispatch }) {
        try {
          const res = await queryFulfilled;
          dispatch(setCredentials(res.data));
        } catch (err) {
          console.log(err);
        }
      },
    }),
    refresh: builder.mutation<setCredentialsArgs, void>({
      query: () => "/refresh",
      async onQueryStarted(args, { queryFulfilled, dispatch }) {
        try {
          const res = await queryFulfilled;
          dispatch(setCredentials(res.data));
        } catch (err) {
          console.log(err);
        }
      },
    }),
    logout: builder.mutation<void, void>({
      query: () => "/logout",
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(logout());
        } catch (err) {
          console.log(err);
        }
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useRefreshMutation,
  useLogoutMutation,
} = authApiSlice;

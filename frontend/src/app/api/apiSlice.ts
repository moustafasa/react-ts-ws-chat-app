import type { BaseQueryFn } from "@reduxjs/toolkit/query/react";
import type { AxiosRequestConfig, AxiosError } from "axios";
import type { RootState } from "../store";
import { createApi } from "@reduxjs/toolkit/query/react";
import {
  getToken,
  logout,
  setCredentials,
  setCredentialsArgs,
} from "../../features/auth/authSlice";
import axios from "axios";
import { Mutex } from "async-mutex";
import type { Dispatch, UnknownAction } from "@reduxjs/toolkit";

type baseQueryArgs =
  | {
      url: string;
      headers?: AxiosRequestConfig["headers"];
      method?: AxiosRequestConfig["method"];
      data?: AxiosRequestConfig["data"];
    }
  | string;

export type baseQueryError = { status: number | undefined; data: string };

type baseQueryType<ResultType = unknown> = BaseQueryFn<
  baseQueryArgs,
  ResultType,
  baseQueryError,
  unknown,
  { dispatch: Dispatch<UnknownAction> }
>;

const axiosBaseQuery =
  <ResultType>(): baseQueryType<ResultType> =>
  async (args, { getState, dispatch }) => {
    const defaultHeaders: AxiosRequestConfig["headers"] = {
      "Content-Type": "application/json",
    };
    const baseUrl: string =
      `https://react-ts-ws-chat-app-production.up.railway.app` as const;
    const token = getToken(getState() as RootState);

    // add authorization header if there is token
    if (token) defaultHeaders["Authorization"] = `Bearer ${token}`;

    try {
      let res;

      // check if args is url only or has another config object
      if (typeof args === "string") {
        res = await axios({
          url: baseUrl + args,
          withCredentials: true,
          headers: defaultHeaders,
        });
      } else {
        const { url, method, data, headers } = args;

        res = await axios({
          url: baseUrl + url,
          method,
          data,
          headers: { ...defaultHeaders, ...headers },
          withCredentials: true,
        });
      }

      // return data
      return {
        data: res.data,
        meta: { dispatch },
      };
    } catch (axiosErr) {
      const err = axiosErr as AxiosError;
      return {
        error: {
          status: err?.response?.status,
          data: (err?.response?.data || err.message) as string,
        },
      };
    }
  };

const mutex = new Mutex();
const reAuthBaseQuery: baseQueryType = async (args, api, extra) => {
  const baseQuery = axiosBaseQuery();
  await mutex.waitForUnlock();
  let res = await baseQuery(args, api, extra);
  const token = getToken(api.getState() as RootState);
  if (res?.error?.status === 401 && args !== "/refresh" && token) {
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();
      try {
        const refRes = await axiosBaseQuery<setCredentialsArgs>()(
          "/refresh",
          api,
          extra
        );
        if (refRes?.data) {
          api.dispatch(setCredentials({ ...refRes.data }));
          res = await baseQuery(args, api, extra);
        } else {
          api.dispatch(logout());
        }
      } finally {
        release();
      }
    } else {
      await mutex.waitForUnlock();
      res = await baseQuery(args, api, extra);
    }
  }
  return res;
};

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: reAuthBaseQuery,
  tagTypes: ["Chats", "Messages"],
  endpoints: () => ({}),
});

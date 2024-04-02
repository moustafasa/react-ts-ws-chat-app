import { redirect } from "react-router-dom";
import { AppDispatch } from "../../app/store";
import { authApiSlice } from "./authApiSlice";

export const action = (dispatch: AppDispatch) => async () => {
  await dispatch(
    authApiSlice.endpoints.logout.initiate(undefined, { track: false })
  );

  return redirect("/");
};

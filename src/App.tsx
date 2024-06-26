import {
  RouterProvider,
  createBrowserRouter,
  redirect,
} from "react-router-dom";
import LayOut from "./components/layout/LayOut";
import Login from "./features/auth/Login/Login";
import Register from "./features/auth/Register/Register";
import { useAppDispatch, useAppSelector } from "./app/hooks";
import { getToken } from "./features/auth/authSlice";
import Home from "./components/home/Home";
import ChatPage from "./features/chat/ChatPage/ChatPage";
import { useMemo } from "react";
import PersistLogin from "./features/auth/PersistentLogin";
import ChatWelcomPage from "./features/chat/ChatWelcomPage/ChatWelcomPage";
import ChatBox from "./features/chat/ChatBox/ChatBox";
import MessageBox from "./features/chat/MessageBox/MessageBox";
import { action as logoutAction } from "./features/auth/LogOut";

const authBackLoader = (token: string) => async () => {
  if (token) {
    return redirect("/");
  }
  return null;
};

function App() {
  const token = useAppSelector(getToken);
  const dispatch = useAppDispatch();

  const router = useMemo(
    () =>
      createBrowserRouter([
        {
          element: <PersistLogin />,
          children: [
            {
              path: "/",
              element: <LayOut />,
              children: [
                { index: true, element: <Home /> },
                {
                  path: "login",
                  element: <Login />,
                  loader: authBackLoader(token),
                },
                {
                  path: "register",
                  element: <Register />,
                  loader: authBackLoader(token),
                },
                {
                  path: "chat",
                  element: <ChatPage />,
                  children: [
                    {
                      index: true,
                      element: <ChatWelcomPage />,
                    },
                    {
                      path: ":room",
                      element: (
                        <>
                          <ChatBox />
                          <MessageBox />
                        </>
                      ),
                    },
                  ],
                },
                { path: "/logout", action: logoutAction(dispatch) },
              ],
            },
          ],
        },
      ]),
    [token, dispatch]
  );
  return (
    <div>
      <RouterProvider router={router} />
    </div>
  );
}

export default App;

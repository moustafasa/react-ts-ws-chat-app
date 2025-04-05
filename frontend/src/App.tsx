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
import PersistLogin from "./features/auth/PersistentLogin";
import ChatWelcomPage from "./features/chat/ChatWelcomPage/ChatWelcomPage";
import ChatBox from "./features/chat/ChatBox/ChatBox";
import MessageBox from "./features/chat/MessageBox/MessageBox";
import { action as logoutAction } from "./features/auth/LogOut";
import { useRefreshMutation } from "./features/auth/authApiSlice";
import NotFound from "./components/not-found/NotFound";
import { useCallback } from "react";

const authBackLoader = (token: string) => async () => {
  if (token) {
    return redirect("/chat");
  }
  return null;
};

function App() {
  const token = useAppSelector(getToken);
  const [, { isLoading }] = useRefreshMutation();
  const protectLoader = useCallback(async () => {
    if (!!token || isLoading) {
      return null;
    } else {
      return redirect("/login");
    }
  }, [isLoading, token]);

  const dispatch = useAppDispatch();

  const router = createBrowserRouter([
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
              loader: protectLoader,
            },
            { path: "/logout", loader: logoutAction(dispatch) },
            { path: "/not-found", element: <NotFound /> },
          ],
        },
      ],
    },
  ]);
  return (
    <div>
      <RouterProvider router={router} />
    </div>
  );
}

export default App;

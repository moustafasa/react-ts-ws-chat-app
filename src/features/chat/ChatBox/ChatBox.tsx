import { useParams } from "react-router-dom";
import ChatBody from "./ChatBody/ChatBody";
import { selectUserByRoom, useGetChatsQuery } from "../chatApiSlice";

const ChatBox = () => {
  const { chat } = useParams();
  const { user } = useGetChatsQuery(undefined, {
    selectFromResult: ({ data, ...rest }) => ({
      user: selectUserByRoom(data, chat || ""),
      ...rest,
    }),
  });

  return (
    <div className="flex-grow-1 d-flex flex-column gap-2">
      <header className="d-flex  border-bottom p-4 align-items-center gap-3 text-capitalize fw-bold fs-5 ">
        <img src={user?.img} width={70} className="rounded-circle" />
        <span>{user?.name}</span>
      </header>
      <ChatBody />
    </div>
  );
};

export default ChatBox;

import { useParams } from "react-router-dom";
import ChatBody from "./ChatBody/ChatBody";
import { selectUserByRoom, useGetChatsQuery } from "../chatApiSlice";
import ChatBoxHeaderSk from "../../../components/skeleton/ChatBoxHeaderSk";

const ChatBox = () => {
  const { room } = useParams();
  const { user, isLoading } = useGetChatsQuery(undefined, {
    selectFromResult: ({ data, ...rest }) => ({
      user: selectUserByRoom(data, room || ""),
      ...rest,
    }),
  });

  return (
    <div className="flex-grow-1 d-flex flex-column gap-2">
      {isLoading ? (
        <ChatBoxHeaderSk />
      ) : (
        <header
          style={{ maxHeight: "120px" }}
          className="d-flex  border-bottom p-4 align-items-center gap-3 text-capitalize fw-bold fs-5 "
        >
          <img
            src={user?.img || "https://placehold.co/50"}
            width={70}
            height={70}
            className="rounded-circle"
          />
          <span>{user?.name}</span>
        </header>
      )}
      <ChatBody />
    </div>
  );
};

export default ChatBox;

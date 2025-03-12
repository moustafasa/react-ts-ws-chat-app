import { Nav } from "react-bootstrap";
import ChatListItem from "./ChatListItem/ChatListItem";
import sass from "./ChatList.module.scss";
import { getAllChats, useGetChatsQuery } from "../chatApiSlice";
import ChatListHeader from "./ChatListHeader/ChatListHeader";

const ChatList = () => {
  const { chats = [] } = useGetChatsQuery(undefined, {
    selectFromResult: ({ data, ...rest }) => {
      return { chats: getAllChats(data), ...rest };
    },
  });

  return (
    <div className={"col-md-3 col border-md-end pt-4 " + sass["chat-list"]}>
      <ChatListHeader />
      <Nav variant="pills" className="flex-column gap-4 pt-4 ">
        {chats.map((chat) => (
          <ChatListItem key={chat.id} chat={chat} />
        ))}
      </Nav>
    </div>
  );
};

export default ChatList;

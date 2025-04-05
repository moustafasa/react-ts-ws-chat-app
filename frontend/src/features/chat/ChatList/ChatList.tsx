import { Nav } from "react-bootstrap";
import ChatListItem from "./ChatListItem/ChatListItem";
import { getAllChats, useGetChatsQuery } from "../chatApiSlice";
import ChatListHeader from "./ChatListHeader/ChatListHeader";
import ChatListItemSk from "../../../components/skeleton/ChatListItemSk";

const ChatList = () => {
  const { chats = [], isLoading } = useGetChatsQuery(undefined, {
    selectFromResult: ({ data, ...rest }) => {
      return { chats: getAllChats(data), ...rest };
    },
  });

  return (
    <div className={"col-md-3 col border-md-end pt-4 "}>
      <ChatListHeader />
      <Nav variant="pills" className="flex-column gap-4 pt-4 ">
        {isLoading
          ? Array(3)
              .fill(0)
              .map((_, _id) => <ChatListItemSk key={_id} />)
          : chats.map((chat) => <ChatListItem key={chat.id} chat={chat} />)}
      </Nav>
    </div>
  );
};

export default ChatList;

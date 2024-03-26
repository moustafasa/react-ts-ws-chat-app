import { useParams } from "react-router-dom";
import Message from "./Message/Message";
import { getMessagesIdsOfRoom, useGetChatsQuery } from "../../chatApiSlice";

const ChatBody = () => {
  const { chat } = useParams();
  const { messages = [] } = useGetChatsQuery(undefined, {
    selectFromResult: ({ data, ...rest }) => {
      return { messages: getMessagesIdsOfRoom(data, chat || ""), ...rest };
    },
  });
  return (
    <div className="bg-light-subtle flex-grow-1 overflow-hidden p-3 d-flex flex-column gap-3">
      {messages.map((msgId) => (
        <Message key={msgId} id={msgId} />
      ))}
    </div>
  );
};

export default ChatBody;

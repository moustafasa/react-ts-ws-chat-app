import { useParams } from "react-router-dom";
import Message from "./Message/Message";
import { Fragment, useEffect, useRef } from "react";
import {
  getAllMessages,
  GetChatsType,
  getUnReadNumber,
  useGetChatsQuery,
  useGetMessagesQuery,
  useReadMessageMutation,
} from "../../chatApiSlice";
import sass from "./ChatBody.module.scss";
import { useAppSelector } from "../../../../app/hooks";

const ChatBody = () => {
  const { room } = useParams();
  const { messages = [], isFetching } = useGetMessagesQuery(room || "", {
    selectFromResult: ({ data, ...rest }) => {
      return { messages: getAllMessages(data), ...rest };
    },
  });
  const unReadMessages = useGetChatsQuery(undefined, {
    selectFromResult: ({ data }) => ({
      unReadNumber: getUnReadNumber(data, room || ""),
    }),
  }).unReadNumber;

  const [readMessage] = useReadMessageMutation();

  const spanRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (spanRef.current) spanRef.current.scrollIntoView({ behavior: "smooth" });
  }, [room, isFetching]);

  useEffect(() => {
    console.log(unReadMessages);
    if (unReadMessages > 0) readMessage(room || "");
  }, [room, readMessage, unReadMessages]);

  useEffect(() => {
    spanRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div
      className={
        "bg-light-subtle flex-grow-1 overflow-auto p-3 d-flex flex-column gap-3 " +
        sass["chat-body"]
      }
    >
      {messages.map((message) => (
        <Fragment key={message.id}>
          <Message key={message.id} message={message} />
        </Fragment>
      ))}
      <span ref={spanRef}></span>
    </div>
  );
};

export default ChatBody;

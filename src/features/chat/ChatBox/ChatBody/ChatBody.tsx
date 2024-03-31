import { useParams } from "react-router-dom";
import Message from "./Message/Message";
// import { getMessagesIdsOfRoom, useGetChatsQuery } from "../../chatApiSlice";
import { Fragment, useEffect, useRef, useState } from "react";
import {
  getAllMessages,
  useGetMessagesQuery,
  useReadMessageMutation,
} from "../../chatApiSlice";
import sass from "./ChatBody.module.scss";
import { useAppSelector } from "../../../../app/hooks";
import { getUnReadNumber } from "../../chatSlice";

const ChatBody = () => {
  const { room } = useParams();
  const { messages = [], isFetching } = useGetMessagesQuery(room || "", {
    selectFromResult: ({ data, ...rest }) => {
      return { messages: getAllMessages(data), ...rest };
    },
  });
  const unReadMessages = useAppSelector((state) =>
    getUnReadNumber(state, room || "")
  );

  const [readMessage] = useReadMessageMutation();

  const spanRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (spanRef.current) spanRef.current.scrollIntoView({ behavior: "smooth" });
  }, [room, isFetching]);

  useEffect(() => {
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

import { Navigate, useParams } from "react-router-dom";
import Message from "./Message/Message";
import { Fragment, useEffect, useRef } from "react";
import {
  getAllMessages,
  getUnReadNumber,
  useGetChatsQuery,
  useGetMessagesQuery,
  useReadMessageMutation,
} from "../../chatApiSlice";
import sass from "./ChatBody.module.scss";
import LoadingSpinner from "../../../../components/Spinner/LoadingSpinner";

const ChatBody = () => {
  const { room } = useParams();
  const {
    messages = [],
    isFetching,
    error,
  } = useGetMessagesQuery(room || "", {
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
    if (unReadMessages > 0) readMessage(room || "");
  }, [room, readMessage, unReadMessages]);

  useEffect(() => {
    spanRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (error && "status" in error && error.status === 404)
    return <Navigate replace to="/not-found" />;
  return (
    <div
      className={
        "bg-light-subtle flex-grow-1 overflow-auto p-3 d-flex flex-column gap-3 " +
        sass["chat-body"]
      }
    >
      {isFetching && <LoadingSpinner showP />}
      {!isFetching &&
        messages.map((message) => (
          <Fragment key={message.id}>
            <Message key={message.id} message={message} />
          </Fragment>
        ))}
      <span ref={spanRef}></span>
    </div>
  );
};

export default ChatBody;

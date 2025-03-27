import classNames from "classnames";
import sass from "./Message.module.scss";
import {
  getLastSeenTimeStamp,
  getUserById,
  useGetChatsQuery,
} from "../../../chatApiSlice";
import { useAppSelector } from "../../../../../app/hooks";
import { getCurrentUser } from "../../../../auth/authSlice";
import { differenceInDays, formatDistance, formatRelative } from "date-fns";
import type { MessageType } from "../../../../../models/chat";
import { FaCheckDouble } from "react-icons/fa";
import { useParams } from "react-router-dom";

type PropsType = {
  message: MessageType;
};
const Message = ({ message }: PropsType) => {
  const currentUser = useAppSelector(getCurrentUser);
  const { room } = useParams();
  const { messageAuthor } = useGetChatsQuery(undefined, {
    selectFromResult: ({ data, ...rest }) => {
      return {
        messageAuthor: getUserById(data, message.userId),
        ...rest,
      };
    },
  });

  const isMe = message.userId === currentUser;

  const messageClass = classNames(
    "d-flex align-items-start gap-3",
    sass.message,
    {
      [sass.me]: isMe,
    }
  );

  const timeStamp = new Date(message.timeStamp);

  const lastSeen = useGetChatsQuery(undefined, {
    selectFromResult: ({ data }) => ({
      lastSeen: getLastSeenTimeStamp(data, room || "", message.userId),
    }),
  }).lastSeen;

  return (
    <div className={messageClass}>
      {!isMe && <img src={messageAuthor?.img} className="rounded-circle" />}
      <div className={" ps-3 pe-2 py-2 rounded " + sass["message-cont"]}>
        {!isMe && (
          <div className="text-capitalize text-info ">
            <h6>{messageAuthor?.name}</h6>
          </div>
        )}
        <div className="text-capitalize py-1 ">{message?.msg}</div>
        <div>
          <div
            className="text-body-secondary text-capitalize fw-bold d-flex justify-content-end align-items-center gap-1"
            style={{ fontSize: "0.7rem" }}
          >
            <span>
              {differenceInDays(new Date(), timeStamp) >= 1
                ? formatRelative(timeStamp, new Date())
                : formatDistance(timeStamp, new Date(), {
                    addSuffix: true,
                  })}
            </span>
            <FaCheckDouble
              className={classNames({
                "text-info":
                  lastSeen &&
                  timeStamp.getTime() < new Date(lastSeen).getTime(),
              })}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Message;

import classNames from "classnames";
import sass from "./Message.module.scss";
import {
  getMessageById,
  getUserById,
  useGetChatsQuery,
} from "../../../chatApiSlice";
import { useAppSelector } from "../../../../../app/hooks";
import { getCurrentUser } from "../../../../auth/authSlice";

type PropsType = {
  id: string;
};
const Message = ({ id }: PropsType) => {
  const currentUser = useAppSelector(getCurrentUser);
  const { message, messageAuthor } = useGetChatsQuery(undefined, {
    selectFromResult: ({ data, ...rest }) => {
      const message = getMessageById(data, id);
      return {
        message,
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
  return (
    <div className={messageClass}>
      {!isMe && <img src={messageAuthor?.img} className="rounded-circle" />}
      <div className={" px-3 py-2 rounded " + sass["message-cont"]}>
        {!isMe && (
          <div className="text-capitalize text-info ">
            <h6>{messageAuthor?.name}</h6>
          </div>
        )}
        <div className="text-capitalize py-1 ">{message?.msg}</div>
      </div>
    </div>
  );
};

export default Message;

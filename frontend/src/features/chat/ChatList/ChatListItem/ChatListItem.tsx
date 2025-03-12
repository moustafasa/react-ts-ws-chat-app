import { NavLink } from "react-router-dom";
import { ParsedChatType } from "../../../../models/chat";
import { getUserById, useGetChatsQuery } from "../../chatApiSlice";
import sass from "./ChatListItem.module.scss";
import classNames from "classnames";
import { useAppSelector } from "../../../../app/hooks";
import { getRoomMetaDataById } from "../../chatSlice";
import { Badge } from "react-bootstrap";

type PropsType = { chat: ParsedChatType };

const ChatListItem = ({ chat }: PropsType) => {
  const { user } = useGetChatsQuery(undefined, {
    selectFromResult: ({ data, ...rest }) => ({
      user: getUserById(data, chat.user),
      ...rest,
    }),
  });
  const roomMeta = useAppSelector((state) =>
    getRoomMetaDataById(state, chat.id)
  );

  return (
    <NavLink
      to={`/chat/${chat.id}`}
      className={({ isActive }) => {
        return classNames(
          "text-capitalize nav-link text-left d-flex gap-2 w-100 text-white",
          sass["nav-link"],
          {
            [sass.active]: isActive,
          }
        );
      }}
    >
      <img
        src={user.img || "https://placehold.co/50"}
        className="rounded-circle"
      />
      <div
        className="d-flex flex-column gap-1 justify-content-center flex-grow-1"
        style={{ overflow: "hidden", whiteSpace: "nowrap" }}
      >
        <div className="d-flex align-items-center gap-3 pe-2 ">
          <span
            className="d-block "
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {user.name}
          </span>
          {user.active && (
            <span
              className="rounded-circle bg-success d-block"
              style={{ width: "8px", height: "8px" }}
            ></span>
          )}
        </div>
        <div className="d-flex align-items-center gap-3 pe-2">
          <p
            className=" m-0 rounded flex-grow-1 text-info"
            style={{
              fontSize: "0.9rem",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {roomMeta.latestMessage?.msg || "no messages yet"}
          </p>
          {roomMeta.unReadMessages > 0 && (
            <Badge bg="danger">{roomMeta.unReadMessages}</Badge>
          )}
        </div>
      </div>
    </NavLink>
  );
};

export default ChatListItem;

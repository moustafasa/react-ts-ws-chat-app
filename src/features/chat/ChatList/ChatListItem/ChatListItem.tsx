import { Nav } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import { ParsedChatType } from "../../../../models/chat";
import { getUserById, useGetChatsQuery } from "../../chatApiSlice";

type PropsType = { chat: ParsedChatType };

const ChatListItem = ({ chat }: PropsType) => {
  const { user } = useGetChatsQuery(undefined, {
    selectFromResult: ({ data, ...rest }) => ({
      user: getUserById(data, chat.user),
      ...rest,
    }),
  });
  return (
    <Nav.Link
      as={NavLink}
      to={`/chat/${chat.id}`}
      className="text-capitalize text-left d-flex gap-2 w-100 text-white"
    >
      <img src={user.img} className="rounded-circle" />
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
        <p
          className=" m-0 rounded flex-grow-1"
          style={{
            fontSize: "0.9rem",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          no messages yet
          {/* {chat.latestMessage || "no messages yet"} */}
        </p>
      </div>
    </Nav.Link>
  );
};

export default ChatListItem;

import classNames from "classnames";
import Skeleton from "react-loading-skeleton";

const ChatListItemSk = () => {
  return (
    <div
      className={classNames(
        "text-capitalize nav-link text-left d-flex gap-2 w-100 text-white"
      )}
    >
      <Skeleton circle width={"50px"} height={"50px"} />
      <div className="d-flex flex-column gap-1 justify-content-center flex-grow-1 ">
        <div className="d-flex align-items-center gap-3 pe-2 ">
          <span className="d-block w-100">
            <Skeleton width={"60%"} height={"10px"} className="rounded " />
          </span>
        </div>
        <div className="d-flex align-items-center gap-3 pe-2">
          <p className="flex-grow-1">
            <Skeleton width={"100%"} height={"10px"} className="rounded" />
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatListItemSk;

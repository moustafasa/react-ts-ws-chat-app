import Skeleton from "react-loading-skeleton";

export default function ChatBoxHeaderSk() {
  return (
    <header
      style={{ maxHeight: "120px" }}
      className="d-flex  border-bottom p-4 align-items-center gap-3 text-capitalize fw-bold fs-5 "
    >
      <Skeleton circle width={"70px"} height={"70px"} />
      <h2 className="w-100">
        <Skeleton width={"30%"} height={"15px"} className="rounded" />
      </h2>
    </header>
  );
}

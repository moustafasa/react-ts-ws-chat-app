import { Container, Row } from "react-bootstrap";
import ChatList from "../ChatList/ChatList";
import { Outlet, useLocation } from "react-router-dom";
import useWindowSize from "../../../customHooks/useWindowSize";

const ChatPage = () => {
  const location = useLocation();
  const isChildPath = /\/chat\/\d+/.test(location.pathname);
  const { width } = useWindowSize();

  return (
    <Container fluid>
      <Row style={{ height: "100%" }}>
        {(!isChildPath || width >= 768) && <ChatList />}
        {(isChildPath || width >= 768) && (
          <div className="col d-flex flex-column">
            <Outlet />
          </div>
        )}
      </Row>
    </Container>
  );
};

export default ChatPage;

import { Container, Row } from "react-bootstrap";
import ChatList from "../ChatList/ChatList";
import { Outlet } from "react-router-dom";

const ChatPage = () => {
  return (
    <Container fluid>
      <Row style={{ height: "100%" }}>
        <ChatList />
        <div className="col d-flex flex-column">
          <Outlet />
        </div>
      </Row>
    </Container>
  );
};

export default ChatPage;

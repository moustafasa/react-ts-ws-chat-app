import { Container, Row } from "react-bootstrap";
import ChatList from "../ChatList/ChatList";
import ChatBox from "../ChatBox/ChatBox";
import MessageBox from "../MessageBox/MessageBox";
import { useParams } from "react-router-dom";
import { useEffect } from "react";

const ChatPage = () => {
  const { chat } = useParams();

  return (
    <Container fluid>
      <Row style={{ height: "100%" }}>
        <ChatList />
        <div className="col d-flex flex-column">
          {chat ? (
            <>
              <ChatBox />
              <MessageBox />
            </>
          ) : (
            <div className=" h-100 text-capitalize  p-3">
              <h1 className="bg-light-subtle h-100 d-flex  justify-content-center align-items-center">
                welcome to chat app
              </h1>
            </div>
          )}
        </div>
      </Row>
    </Container>
  );
};

export default ChatPage;

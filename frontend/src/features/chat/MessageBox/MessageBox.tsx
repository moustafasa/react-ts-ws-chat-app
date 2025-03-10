import { Button, FormControl } from "react-bootstrap";
import { useSendMessageMutation } from "../chatApiSlice";
import { FormEvent, useState } from "react";
import { useParams } from "react-router-dom";
import { WsType } from "../../../models/chat";

const MessageBox = () => {
  const { room } = useParams();
  const [message, setMessage] = useState("");
  const [sendMessage] = useSendMessageMutation();

  const submitHandler = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (message) {
      sendMessage({ type: WsType.MESSAGE, msg: message, room });
      setMessage("");
    }
  };

  return (
    <div className="border-top py-3  mb-3" style={{ maxHeight: "100px" }}>
      <form className="d-flex gap-2" onSubmit={submitHandler}>
        <FormControl
          type="text"
          placeholder="write your message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <Button type="submit" className="text-capitalize">
          send
        </Button>
      </form>
    </div>
  );
};

export default MessageBox;

import classNames from "classnames";
import { FormEvent, useState } from "react";
import sass from "./ChatListHeader.module.scss";
import { Button, Form } from "react-bootstrap";
import { RiUserAddFill } from "react-icons/ri";
import { useCreateChatMutation } from "../../chatApiSlice";

const ChatListHeader = () => {
  const [createChat] = useCreateChatMutation();
  const [showForm, setShowForm] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");

  const formClass = classNames(
    "d-flex gap-3 px-3 justify-content-center align-items-center mt-4",
    sass["add-user-form"],
    { [sass.show]: showForm }
  );

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createChat(email);
    setEmail("");
  };

  return (
    <>
      <h2 className="fs-4 px-1 text-capitalize d-flex align-items-center justify-content-between">
        chats
        <Button
          variant="success"
          className="d-flex justify-content-center align-items-center px-3"
          onClick={() => setShowForm((showForm) => !showForm)}
        >
          <RiUserAddFill />
        </Button>
      </h2>
      <Form className={formClass} onSubmit={handleSubmit}>
        <Form.Control
          type="text"
          placeholder="Type email to add"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit">Add</Button>
      </Form>
    </>
  );
};

export default ChatListHeader;

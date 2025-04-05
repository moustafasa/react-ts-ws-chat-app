import classNames from "classnames";
import { FormEvent, useState } from "react";
import sass from "./ChatListHeader.module.scss";
import { Button, Form } from "react-bootstrap";
import { RiUserAddFill } from "react-icons/ri";
import { useCreateChatMutation } from "../../chatApiSlice";
import { FaUserPlus } from "react-icons/fa";

const ChatListHeader = () => {
  const [createChat, { error, isLoading }] = useCreateChatMutation();
  const [showForm, setShowForm] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");

  const formClass = classNames(" px-3  mt-4", sass["add-user-form"], {
    [sass.show]: showForm,
  });

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
        <div className="d-flex gap-3 justify-content-center align-items-center">
          <Form.Control
            type="text"
            placeholder="Type email to add"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            isInvalid={!!error}
          />
          <Button type="submit">
            {isLoading ? (
              <span
                className="spinner-border spinner-border-sm"
                role="status"
                aria-hidden="true"
              ></span>
            ) : (
              <FaUserPlus />
            )}
          </Button>
        </div>
        {error && (
          <Form.Text className="text-danger text-capitalize">
            {"status" in error
              ? error.status === 400
                ? "chat already exists"
                : error.status === 404
                ? "invalid email"
                : "server error"
              : "An unknown error occurred"}
          </Form.Text>
        )}
      </Form>
    </>
  );
};

export default ChatListHeader;

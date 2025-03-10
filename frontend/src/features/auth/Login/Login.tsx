import { Alert, Button, Container, Form } from "react-bootstrap";
import { useForm } from "react-hook-form";
import {
  LoginSchema,
  type LoginKeysType,
  type LoginType,
  type inputField,
} from "../../../models/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import classNames from "classnames";
import { useLoginMutation } from "../authApiSlice";
import { baseQueryError } from "../../../app/api/apiSlice";

const Login = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginType>({
    resolver: zodResolver(LoginSchema),
  });
  const fields: inputField<LoginKeysType>[] = [
    { type: "email", key: "email" },
    { type: "password", key: "password" },
  ];

  const [login, { isLoading, error: serverErr }] = useLoginMutation();

  const getServerErrMessage = () => {
    switch ((serverErr as baseQueryError).status) {
      case 401:
        return "the email or password is wrong";
      case undefined:
        return "network error";
      default:
        return "unknown error";
    }
  };

  return (
    <Container className="pt-5">
      <Form
        className="border p-4 rounded  text-capitalize mx-auto"
        style={{ maxWidth: "700px" }}
        method="POST"
        onSubmit={handleSubmit((data) => {
          login(data);
        })}
      >
        {serverErr && <Alert variant="danger">{getServerErrMessage()}</Alert>}
        <h2 className="fs-1 text-decoration-underline text-center mb-4">
          login
        </h2>
        {fields.map((field, id) => (
          <Form.FloatingLabel
            className="mb-3"
            label={field?.label || field.key}
            key={field.key + id}
            controlId={field.key}
          >
            <Form.Control
              type={field.type}
              className={classNames({ "is-invalid": !!errors[field.key] })}
              placeholder={field?.label || field.key}
              disabled={isLoading}
              {...register(field.key)}
            />
            <Form.Control.Feedback type="invalid">
              {errors[field.key]?.message}
            </Form.Control.Feedback>
          </Form.FloatingLabel>
        ))}
        <Button
          variant="primary"
          type="submit"
          className="text-capitalize d-block mx-auto px-4 mt-4"
          disabled={isLoading}
        >
          login
        </Button>
      </Form>
    </Container>
  );
};

export default Login;

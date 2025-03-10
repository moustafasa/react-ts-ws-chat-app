import { zodResolver } from "@hookform/resolvers/zod";
import classNames from "classnames";
import { Alert, Button, Container, Form } from "react-bootstrap";
import { useForm } from "react-hook-form";
import {
  RegisterSchema,
  type RegisterKeysType,
  type inputField,
  type RegisterType,
} from "../../../models/auth";
import { useRegisterMutation } from "../authApiSlice";
import type { baseQueryError } from "../../../app/api/apiSlice";

const Register = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterType>({
    resolver: zodResolver(RegisterSchema),
  });

  const fields: inputField<RegisterKeysType>[] = [
    { type: "text", key: "name", label: "full name" },
    { type: "email", key: "email" },
    { type: "password", key: "password", label: "password" },
    { type: "password", key: "passConfirm", label: "confirm password" },
  ];

  const [registerUser, { isLoading = true, error: serverErr }] =
    useRegisterMutation();

  const getServerErrMessage = () => {
    switch ((serverErr as baseQueryError).status) {
      case 409:
        return "this email is already registered";
      case undefined:
        return "network error";
      default:
        return "unknown error occured";
    }
  };

  return (
    <Container className="pt-5">
      <Form
        className="border p-4 rounded text-capitalize mx-auto"
        style={{ maxWidth: "700px" }}
        method="POST"
        onSubmit={handleSubmit((data) => {
          registerUser(data);
        })}
        noValidate
      >
        {serverErr && <Alert variant="danger">{getServerErrMessage()}</Alert>}
        <h2 className="fs-1 text-decoration-underline text-center mb-4">
          register
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
          Register
        </Button>
      </Form>
    </Container>
  );
};

export default Register;

import { Container, Nav, Navbar } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useAppSelector } from "../../app/hooks";
import { getToken } from "../../features/auth/authSlice";
import { useEffect, useRef } from "react";
import { useLogoutMutation } from "../../features/auth/authApiSlice";

const NavBar = () => {
  const token = useAppSelector(getToken);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [logout, { isSuccess, isLoading }] = useLogoutMutation();
  const navigate = useNavigate();

  useEffect(() => {
    if (isSuccess) {
      navigate("/", { replace: true });
    }
  }, [isSuccess, navigate]);

  useEffect(() => {
    const hideOnBlur = (e: MouseEvent) => {
      const element = e.target as HTMLElement | null;
      if (
        !element?.closest("#basic-navbar-nav") &&
        !element?.closest(".navbar-toggler") &&
        !buttonRef.current?.classList.contains("collapsed")
      ) {
        buttonRef.current?.click();
      }
    };
    document.addEventListener("click", hideOnBlur);
    return () => {
      document.removeEventListener("click", hideOnBlur);
    };
  }, []);

  return (
    <Navbar expand="lg" className="bg-body-tertiary">
      <Container>
        <Link to={"/"} className="text-capitalize navbar-brand">
          chat app
        </Link>
        <Navbar.Toggle aria-controls="basic-navbar-nav" ref={buttonRef} />
        <Navbar.Collapse id="basic-navbar-nav" className="collapse">
          <Nav className="ms-auto text-capitalize ">
            <Link to={"/"} className="nav-link">
              home
            </Link>
            {!token || isLoading ? (
              <>
                <Link to={"/login"} className="nav-link">
                  Login
                </Link>
                <Link to={"/register"} className="nav-link">
                  register
                </Link>
              </>
            ) : (
              <>
                <Link to={"/chat"} className="nav-link">
                  chat
                </Link>

                <button
                  onClick={() => {
                    logout();
                  }}
                  className="nav-link text-start text-capitalize"
                >
                  logout
                </button>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavBar;

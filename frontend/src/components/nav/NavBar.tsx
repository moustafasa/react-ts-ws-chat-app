import { Container, Nav, Navbar } from "react-bootstrap";
import { Form, Link, useNavigation } from "react-router-dom";
import { useAppSelector } from "../../app/hooks";
import { getToken } from "../../features/auth/authSlice";

const NavBar = () => {
  const token = useAppSelector(getToken);
  const navig = useNavigation();

  return (
    <Navbar expand="lg" className="bg-body-tertiary">
      <Container>
        <Link to={"/"} className="text-capitalize navbar-brand">
          chat app
        </Link>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto text-capitalize ">
            <Link to={"/"} className="nav-link">
              home
            </Link>
            {!token ? (
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

                <Link to="/logout" className="nav-link">
                  logout
                </Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavBar;

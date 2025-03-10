import { Outlet } from "react-router-dom";
import NavBar from "../nav/NavBar";

const LayOut = () => {
  return (
    <div className="d-grid min-vh-100" style={{ gridTemplateRows: "auto 1fr" }}>
      <NavBar />
      <Outlet />
    </div>
  );
};

export default LayOut;

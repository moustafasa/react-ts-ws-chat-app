import React, { useEffect } from "react";
import { useRefreshMutation } from "./authApiSlice";
import { Outlet } from "react-router-dom";
import LoadingSpinner from "../../components/Spinner/LoadingSpinner";

const PersistLogin = () => {
  const [refresh, { isLoading, isUninitialized }] = useRefreshMutation();

  useEffect(() => {
    if (isUninitialized && !isLoading) {
      refresh();
    }
  }, [refresh, isUninitialized, isLoading]);

  return isUninitialized || isLoading ? (
    <div style={{ marginTop: "10rem" }}>
      <LoadingSpinner showP />
    </div>
  ) : (
    <Outlet />
  );
};

export default PersistLogin;

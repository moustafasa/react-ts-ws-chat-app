import React, { useEffect } from "react";
import { useRefreshMutation } from "./authApiSlice";
import { Outlet } from "react-router-dom";

const PersistLogin = () => {
  const [refresh, { isLoading, isUninitialized }] = useRefreshMutation();

  useEffect(() => {
    if (isUninitialized && !isLoading) {
      refresh();
    }
  }, [refresh, isUninitialized, isLoading]);

  return isUninitialized || isLoading ? <p>persist loading...</p> : <Outlet />;
};

export default PersistLogin;

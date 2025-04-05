import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./sass/custom.scss";
import { Provider } from "react-redux";
import store from "./app/store.ts";
import { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <SkeletonTheme baseColor="#333" highlightColor="#444">
        <App />
      </SkeletonTheme>
    </Provider>
  </React.StrictMode>
);

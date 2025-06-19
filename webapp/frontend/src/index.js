import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { store } from "./app/store";
import { BrowserRouter } from "react-router-dom";
import {Provider} from 'react-redux'
import "./index.css";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// import { Toaster } from "react-hot-toast";

// import { Provider } from "react-redux";
// // import { configureStore } from "@reduxjs/toolkit";
// // import rootReducer from "./reducer";

// const store = configureStore({
//   reducer: rootReducer,
// });

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
        <ToastContainer />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
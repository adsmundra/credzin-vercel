import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { store } from "./app/store";
import { BrowserRouter } from "react-router-dom";
import {Provider} from 'react-redux'
import "./index.css";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// import { Toaster } from "react-hot-toast";

// import { Provider } from "react-redux";
// // import { configureStore } from "@reduxjs/toolkit";
// // import rootReducer from "./reducer";

// const store = configureStore({
//   reducer: rootReducer,
// });

const queryClient = new QueryClient();

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
          <ToastContainer />
          {/* <ReactQueryDevtools initialIsOpen={false} /> */}
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>
);

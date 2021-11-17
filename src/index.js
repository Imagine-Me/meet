import { createMuiTheme, ThemeProvider } from "@material-ui/core";
import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import { RecoilRoot } from "recoil";

import App from "./App";

const MuiTheme = createMuiTheme({
  palette: {
    primary: {
      main: "#5775C1",
    },
    grey: {
      main: "#ffffff",
    },
  },
  typography: {
    allVariants: {
      color: "#5775C1",
    },
  },
});

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={MuiTheme}>
        <RecoilRoot>
          <App />
        </RecoilRoot>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById("root")
);

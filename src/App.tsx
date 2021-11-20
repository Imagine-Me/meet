import { lazy, Suspense } from "react";
import { Route, Switch } from "react-router";
import { Alert, Snackbar } from "@mui/material";
import { useRecoilState } from "recoil";
import "./index.css";
import Home from "./pages/Home";
import { snackbar } from "./recoil/state";
const Meet = lazy(() => import("./pages/Meet"));

function App() {
  const [snackBarState, setSnackBarState] = useRecoilState(snackbar);
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Switch>
        <Route path="/" exact component={Home} />
        <Route path="/:meetId" exact component={Meet} />
      </Switch>
      <Snackbar
        onClose={() => setSnackBarState((prev) => ({ ...prev, show: false }))}
        open={snackBarState.show}
        autoHideDuration={3000}
      >
        <Alert severity={snackBarState.type}>{snackBarState.message}</Alert>
      </Snackbar>
    </Suspense>
  );
}

export default App;

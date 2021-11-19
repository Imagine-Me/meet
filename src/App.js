import { lazy, Suspense } from "react";
import { Route, Switch } from "react-router";
import "./index.css";
import Home from "./pages/Home";
const Meet = lazy(() => import("./pages/Meet"));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Switch>
        <Route path="/" exact component={Home} />
        <Route path="/:meetId" exact component={Meet} />
      </Switch>
    </Suspense>
  );
}

export default App;

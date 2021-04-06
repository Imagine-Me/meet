import { lazy, Suspense, useEffect } from "react";
import { Route, Switch } from "react-router";

import Firebase from "firebase";

import "./index.css";
import { useSetRecoilState } from "recoil";
import { user } from "./recoil/state";
import { firebaseConfig } from "./utils/firebase/firebaseConfig";
import Home from "./pages/Home";
const Meet = lazy(() => import("./pages/Meet"));

function App() {
  const setUser = useSetRecoilState(user);
  useEffect(() => {
    const firebase =
      Firebase.apps && Firebase.apps.length > 0
        ? Firebase.apps[0]
        : Firebase.initializeApp(firebaseConfig);
    setUser((oldState) => ({
      ...oldState,
      firebase,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

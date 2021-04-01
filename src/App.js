import { Suspense, useEffect } from "react";
import { Route, Switch } from "react-router";

import Home from "./pages/Home";
import Firebase from "firebase";

import "./index.css";
import { useSetRecoilState } from "recoil";
import { user } from "./recoil/state";
import { firebaseConfig } from "./utils/firebase/firebaseConfig";

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
  }, []);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Switch>
        <Route path="/" exact component={Home} />
      </Switch>
    </Suspense>
  );
}

export default App;

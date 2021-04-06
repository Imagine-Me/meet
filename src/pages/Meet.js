import { useEffect, useState } from "react";
import { useHistory } from "react-router";
import { useRecoilState } from "recoil";
import { state as userState, user as userDetails } from "../recoil/state";
import { createOffer } from "../utils/Video";
import { io } from "socket.io-client";

export default function Meet(props) {
  const [socket, setSocket] = useState(null);
  const [state, setState] = useRecoilState(userState);
  const [user, setUser] = useRecoilState(userDetails);

  const history = useHistory();
  useEffect(
    () => {
      const link = props.match.params.meetId;
      setState((oldState) => ({
        ...oldState,
        link,
      }));
      if (state.pc !== null) {
        if (state.stream !== undefined) {
          state.stream
            .getTracks()
            .forEach((track) => state.pc.addTrack(track, state.stream));
        }
        state.pc.onicecandidate = (e) => {
          if (e.candidate) {
            console.log(e.candidate);
          }
        };
        setSocket(io(process.env.REACT_APP_BASE_URL));
      } else {
        history.push(`/?redirect=${link}`);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    if (socket !== null) {
      socket.on("connect", () => {
        const socketId = socket.id;
        socket.emit("room", { socketId, meetId: state.link });
        setUser((oldState) => ({
          ...oldState,
          socketId,
        }));
      });
      socket.on("user_joined", (data) => {
        if (data !== socket.id) {
          // A NEW USER JOINED CREATE AN OFFER
        }
      });
      // socket
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);
  const initiateOffer = async () => {
    const sdp = await createOffer(state.pc);
    state.pc.setLocalDescription(sdp);
    console.log(JSON.stringify(state.pc.localDescription));
  };

  return <div>Meet</div>;
}

import { useEffect, useState } from "react";
import { useHistory } from "react-router";
import { useRecoilState } from "recoil";
import { state as userState, user as userDetails } from "../recoil/state";
import { createOffer, initiatePeerConnection } from "../utils/Video";
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
      if (user.isAuthenticated) {
        // if (state.stream !== undefined) {
        //   state.stream
        //     .getTracks()
        //     .forEach((track) => state.pc.addTrack(track, state.stream));
        // }
        // state.pc.onicecandidate = (e) => {
        //   if (e.candidate) {
        //     console.log(e.candidate);
        //   }
        // };
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
          console.log("A NEW USER JOINED WITH SOCKET ID -", data);
          initiateOffer(data);
        }
      });
      socket.on("get_offer", (data) => {
        console.log("GOT AN SDP ", data);
      });
      // socket
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);
  const initiateOffer = async (socket) => {
    console.log("INITIATING OFFER FOR NEW USER");
    const pc = initiatePeerConnection();

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState == "disconnected") {
      }
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        console.error(socket);
        console.log(e.candidate);
      }
    };
    pc.onnegotiationneeded = await createOffers(pc);

    const peerConnections = [...state.pc];
    const peerConnection = {
      socket,
      sdp: pc.localDescription,
      pc,
    };
    peerConnections.push(peerConnection);

    setState((oldState) => ({
      ...oldState,
      pc: peerConnections,
    }));
    sendOffer(peerConnection);
  };

  const createOffers = async (pc) => {
    const sdp = await createOffer(pc);
    pc.setLocalDescription(sdp);
  };

  const sendOffer = (peerConnection) => {
    const data = {
      socketId: peerConnection.socket,
      sdp: peerConnection.sdp,
    };
    socket.emit("send_offer", data);
  };

  return <div>Meet</div>;
}

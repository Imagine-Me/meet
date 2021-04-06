import { useEffect, useState } from "react";
import { useHistory } from "react-router";
import { useRecoilState } from "recoil";
import { state as userState, user as userDetails } from "../recoil/state";
import {
  addRemoteDescription,
  answerOffer,
  createOffer,
  initiatePeerConnection,
} from "../utils/Video";
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
        initiateAnswers(data);
      });
      socket.on("get_answer", (data) => {
        console.log("GOT ANSWER", data);
        addAnswer(data);
      });
      // socket
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  useEffect(() => {
    state.pc.forEach((pc) => {
      if (!pc.isCompleted) {
        console.log("here ", pc);
        const data = {
          socket: pc.socket,
          sdp: pc.sdp,
        };
        pc.method(data);
        return;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.pc]);
  const initiateOffer = async (socket) => {
    console.log("INITIATING OFFER FOR NEW USER");
    const pc = await initiatePeerConnection();

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
      method: sendOffer,
      isCompleted: false,
    };
    peerConnections.push(peerConnection);
    setState((oldState) => ({
      ...oldState,
      pc: peerConnections,
    }));
  };

  const createOffers = async (pc) => {
    const sdp = await createOffer(pc);
    pc.setLocalDescription(sdp);
  };

  const sendOffer = (peerConnection) => {
    console.log("SENDING OFFER.....", peerConnection);
    const data = {
      socketId: peerConnection.socket,
      sdp: peerConnection.sdp,
    };
    const newPc = state.pc.map((peer) => {
      if (peer.socket === peerConnection.socket) {
        peer.isCompleted = true;
      }
      return peer;
    });
    setState((oldState) => ({
      ...oldState,
      pc: newPc,
    }));
    socket.emit("send_offer", data);
  };

  const initiateAnswers = async (data) => {
    console.log("ANSWERING OFFER");
    const pc = await initiatePeerConnection();
    await addRemoteDescription(pc, data.sdp);
    await answerOffers(pc);

    const peerConnections = [...state.pc];
    const peerConnection = {
      socket: data.socketId,
      sdp: pc.localDescription,
      pc,
      method: sendAnswer,
      isCompleted: false,
    };
    peerConnections.push(peerConnection);
    setState((oldState) => ({
      ...oldState,
      pc: peerConnections,
    }));
  };

  const answerOffers = async (pc) => {
    const localDescription = await answerOffer(pc);
    pc.setLocalDescription(localDescription);
  };

  const sendAnswer = (peerConnection) => {
    console.log("SENDING ANSWER...");
    const data = {
      socketId: peerConnection.socket,
      sdp: peerConnection.sdp,
    };
    const newPc = state.pc.map((peer) => {
      if (peer.socket === peerConnection.socket) {
        peer.isCompleted = true;
      }
      return peer;
    });
    setState((oldState) => ({
      ...oldState,
      pc: newPc,
    }));
    socket.emit("send_answer", data);
  };
  const addAnswer = (data) => {
    console.log("GOT AN ANSWER", data);
  };

  return <div>Meet</div>;
}

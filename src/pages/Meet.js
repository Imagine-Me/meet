import { useEffect, useRef, useState } from "react";
import { useHistory } from "react-router";
import { useRecoilState } from "recoil";
import { v4 as uuidv4 } from "uuid";
import { state as userState, user as userDetails } from "../recoil/state";
import {
  addIceCandidate,
  addRemoteDescription,
  answerOffer,
  createOffer,
  initiatePeerConnection,
} from "../utils/Video";
import { io } from "socket.io-client";
import {
  ADD_ANSWER,
  GET_ICE_CANDIDATE,
  INITIATE_ANSWER,
  INITIATE_OFFER,
} from "../utils/constants";
import { makeStyles } from "@material-ui/styles";

const useStyles = makeStyles({
  mainContainer: {
    backgroundColor: "black",
    width: "100%",
    height: "100%",
    position: "relative",
  },
  videoContainer: {
    height: "425px",
    maxWidth: "570px",
    width: "100%",
    maxHeight: "600px",
    backgroundColor: "black",
    borderRadius: "7px",
  },
  video: {
    width: "100%",
    height: "100%",
  },
});

export default function Meet(props) {
  const [socket, setSocket] = useState(null);
  const [call, setCall] = useState({});
  const [state, setState] = useRecoilState(userState);
  const [user, setUser] = useRecoilState(userDetails);

  const history = useHistory();
  const styles = useStyles();
  const videoRef = useRef(null);

  useEffect(
    () => {
      const link = props.match.params.meetId;
      setState((oldState) => ({
        ...oldState,
        link,
      }));
      if (user.isAuthenticated) {
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
          const result = {
            type: INITIATE_OFFER,
            value: data,
          };
          setCall(result);
        }
      });
      socket.on("get_offer", (data) => {
        const result = {
          type: INITIATE_ANSWER,
          value: data,
        };
        setCall(result);
      });
      socket.on("get_answer", function (data) {
        const result = {
          type: ADD_ANSWER,
          value: data,
        };
        setCall(result);
      });
      socket.on("get_ice_candidates", (data) => {
        const result = {
          type: GET_ICE_CANDIDATE,
          value: data,
        };
        setCall(result);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  useEffect(() => {
    const type = call?.type;
    switch (type) {
      case INITIATE_OFFER:
        initiateOffer(call.value);
        break;
      case INITIATE_ANSWER:
        initiateAnswers(call.value);
        break;
      case ADD_ANSWER:
        addAnswer(call.value);
        break;
      case GET_ICE_CANDIDATE:
        setIceCandidates(call.value);
        break;
      default:
        break;
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call]);

  useEffect(() => {
    state.pc.forEach((pc) => {
      if (!pc.isCompleted) {
        const data = {
          socket: pc.socket,
          sdp: pc.sdp,
          id: pc.id,
        };
        switch (pc.method) {
          case "offer":
            sendOffer(data);
            return;
          case "answer":
            sendAnswer(data);
            return;
          default:
            return;
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.pc]);
  const initiateOffer = async (socketId) => {
    const pc = await initiatePeerConnection();
    const pcId = uuidv4();

    if (state.stream !== undefined) {
      state.stream
        .getTracks()
        .forEach((track) => pc.addTrack(track, state.stream));
    }
    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "disconnected") {
      }
    };
    // pc.addTransceiver()

    const candidates = [];
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        candidates.push(e.candidate);
      } else {
        const data = {
          socketId,
          candidates: candidates,
          pcId,
        };
        socket.emit("send_ice_candidate", data);
      }
    };
    pc.ontrack = (e) => {
      console.log("INCOMING STREAM", e);
      videoRef.current.srcObject = e.streams[0];
    };
    pc.onnegotiationneeded = await createOffers(pc);
    const peerConnections = [...state.pc];
    const peerConnection = {
      id: pcId,
      socket: socketId,
      sdp: pc.localDescription,
      pc,
      method: "offer",
      isCompleted: false,
    };
    peerConnections.push(peerConnection);
    setState((oldState) => ({
      ...oldState,
      pc: peerConnections,
    }));
  };

  const createOffers = (pc) => {
    return createOffer(pc).then((sdp) => pc.setLocalDescription(sdp));
  };

  const sendOffer = (peerConnection) => {
    console.log("SENDING OFFER...");
    const data = {
      socketId: peerConnection.socket,
      sdp: peerConnection.sdp,
      id: peerConnection.id,
    };
    const newPc = state.pc.map((peer) => {
      if (peer.socket === peerConnection.socket) {
        const p = { ...peer };
        p.isCompleted = true;
        return p;
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
    const pc = await initiatePeerConnection();

    if (state.stream !== undefined) {
      state.stream
        .getTracks()
        .forEach((track) => pc.addTrack(track, state.stream));
    }

    pc.ontrack = (e) => {
      console.log("INCOMING STREAM", e);
      videoRef.current.srcObject = e.streams[0];
    };

    await addRemoteDescription(pc, data.sdp);
    await answerOffers(pc);

    const peerConnections = [...state.pc];
    const peerConnection = {
      socket: data.socketId,
      id: data.id,
      sdp: pc.localDescription,
      pc,
      method: "answer",
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
    const data = {
      socketId: peerConnection.socket,
      sdp: peerConnection.sdp,
      id: peerConnection.id,
    };
    const newPc = state.pc.map((peer) => {
      if (peer.socket === peerConnection.socket) {
        const p = { ...peer };
        p.isCompleted = true;
        return p;
      }
      return peer;
    });
    setState((oldState) => ({
      ...oldState,
      pc: newPc,
    }));
    socket.emit("send_answer", data);
  };
  const addAnswer = async (data) => {
    const pcId = data.id;
    const sdp = data.sdp;
    const peer = state.pc.filter((p) => p.id === pcId);
    const pc = peer?.[0].pc;
    await addRemoteDescription(pc, sdp);
  };

  const setIceCandidates = (data) => {
    console.log("Adding candidates..");
    const pcId = data.pcId;
    const candidates = data.candidates;
    const peer = state.pc.filter((p) => p.id === pcId);
    const pc = peer?.[0].pc;
    addIceCandidate(pc, candidates);
  };

  return (
    <div className={styles.mainContainer}>
      <video ref={videoRef} className={styles.video} autoPlay playsInline />
    </div>
  );
}

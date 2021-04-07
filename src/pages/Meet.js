import { useEffect, useState } from "react";
import { useHistory } from "react-router";
import { useRecoilState } from "recoil";
import { v4 as uuidv4 } from "uuid";
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
  const [call, setCall] = useState({});
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
            type: "initiate_offer",
            value: data,
          };
          setCall(result);
        }
      });
      socket.on("get_offer", (data) => {
        const result = {
          type: "initiate_answer",
          value: data,
        };
        setCall(result);
      });
      socket.on("get_answer", function (data) {
        const result = {
          type: "add_answer",
          value: data,
        };
        setCall(result);
      });
      // socket
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  useEffect(() => {
    const type = call?.type;
    switch (type) {
      case "initiate_offer":
        initiateOffer(call.value);
        break;
      case "initiate_answer":
        initiateAnswers(call.value);
        break;
      case "add_answer":
        addAnswer(call.value);
        break;
      default:
        break;
    }
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
  const initiateOffer = async (socket) => {
    const pc = await initiatePeerConnection();

    if (state.stream !== undefined) {
      state.stream
        .getTracks()
        .forEach((track) => pc.addTrack(track, state.stream));
    }
    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState == "disconnected") {
      }
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        console.log(e.candidate, socket);
      } else {
      }
    };
    pc.onnegotiationneeded = await createOffers(pc);
    const peerConnections = [...state.pc];
    const pcId = uuidv4();
    const peerConnection = {
      id: pcId,
      socket,
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

  return <div>Meet</div>;
}

import { useEffect, useMemo, useState, createRef } from "react";
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
  REQUEST_OFFER,
} from "../utils/constants";
import { makeStyles } from "@material-ui/styles";
import { Grid, useMediaQuery } from "@material-ui/core";
import { isObjectEmpty } from "../utils/object";
import BottomNavigation from "../components/BottomNavigation";
import { desktopGridSize, mobileGridSize } from "../utils/gridSize";

const useStyles = makeStyles({
  mainContainer: {
    backgroundColor: "#363636",
    width: "100%",
    height: "calc(100% - 100px)",
    position: "relative",
  },
  videoContainer: {
    height: "100%",
    width: "100%",
  },
  video: {
    objectFit: "cover",
    width: "100%",
    height: "100%",
  },
});

export default function Meet(props) {
  const [socket, setSocket] = useState(null);
  const [isBusy, setIsBusy] = useState(false);
  const [track, setTrack] = useState({});
  const [pcRequestQueue, setPcRequestQueue] = useState([]);
  const [socketListener, setSocketListener] = useState(null);
  const [ice, setIce] = useState([]);
  const [state, setState] = useRecoilState(userState);
  const [user, setUser] = useRecoilState(userDetails);

  const isDesktopWidth = useMediaQuery((theme) => theme.breakpoints.up("md"));

  const history = useHistory();
  const styles = useStyles();
  const videoRefs = useMemo(() => {
    return state.pc.map((p) => ({
      id: p.id,
      ref: createRef(),
    }));
  }, [state.pc]);

  const { mobileGrid, desktopGrid } = useMemo(() => {
    return {
      mobileGrid: mobileGridSize(videoRefs.length),
      desktopGrid: desktopGridSize(videoRefs.length),
    };
  }, [videoRefs]);

  console.log(mobileGrid, desktopGrid, videoRefs);

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

      socket.on("get_users", (data) => {
        const initialUsers = data.map((value) => ({
          isCompleted: false,
          socketTo: value,
          requests: [{ type: REQUEST_OFFER, isCompleted: false }],
          id: undefined,
        }));
        setSocketListener(initialUsers);
      });

      socket.on("get_offer_request", (data) => {
        const result = {
          socketTo: data,
          id: null,
          requests: [{ type: INITIATE_OFFER, isCompleted: false }],
          isCompleted: false,
        };
        setSocketListener(result);
      });

      socket.on("get_offer", (data) => {
        const result = {
          id: data.id,
          socketTo: data.socketFrom,
          requests: [
            { type: INITIATE_ANSWER, isCompleted: false, value: data },
          ],
        };
        setSocketListener(result);
      });

      socket.on("get_answer", function (data) {
        const result = {
          id: data.id,
          socketTo: data.socketFrom,
          requests: [{ type: ADD_ANSWER, value: data, isCompleted: false }],
        };
        setSocketListener(result);
      });

      socket.on("get_ice_candidates", (data) => {
        const result = {
          isCompleted: false,
          id: data.pcId,
          requests: [
            {
              type: GET_ICE_CANDIDATE,
              value: data.candidates,
              isCompleted: false,
            },
          ],
        };
        setSocketListener(result);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  useEffect(() => {
    if (socketListener !== null) {
      if (Array.isArray(socketListener)) {
        setPcRequestQueue(socketListener);
      } else {
        if (socketListener.id) {
          const pcRequestQueueCopy = pcRequestQueue.map((pr) => {
            if (
              pr.id === socketListener.id ||
              pr.socketTo === socketListener.socketTo
            ) {
              const prCopy = { ...pr };
              prCopy.id = socketListener.id;
              const requestCopy = [...prCopy.requests];
              const updatedRequest = requestCopy.concat(
                socketListener.requests
              );
              prCopy.requests = updatedRequest;
              return prCopy;
            }
            return pr;
          });
          setPcRequestQueue(pcRequestQueueCopy);
        } else {
          const pcRequestQueueCopy = [...pcRequestQueue];
          pcRequestQueueCopy.push(socketListener);
          setPcRequestQueue(pcRequestQueueCopy);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socketListener]);

  useEffect(() => {
    let flag = false;
    pcRequestQueue.every((pcRequest, index) => {
      if (isBusy) {
        return false;
      }
      if (!pcRequest.isCompleted) {
        flag = true;
        pcRequest.requests.every((request) => {
          const result = {
            socketFrom: socket.id,
            socketTo: pcRequest.socketTo,
          };
          if (!request.isCompleted) {
            switch (request.type) {
              case REQUEST_OFFER:
                socket.emit("get_offer", result);
                setUpdatedPcRequest(index, request.type);
                return false;
              case INITIATE_OFFER:
                setIsBusy(true);
                initiateOffer(pcRequest.socketTo);
                setUpdatedPcRequest(index, request.type);
                return false;
              case INITIATE_ANSWER:
                setIsBusy(true);
                initiateAnswers(request.value);
                setUpdatedPcRequest(index, request.type);
                return false;
              case ADD_ANSWER:
                setIsBusy(true);
                addAnswer({ ...request.value, ...result });
                setUpdatedPcRequest(index, request.type);
                return false;
              case GET_ICE_CANDIDATE:
                setIsBusy(true);
                setIceCandidates({
                  pcId: pcRequest.id,
                  candidates: request.value,
                });
                return false;
              default:
                return false;
            }
          } else {
            return true;
          }
        });
      }
      return !flag;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pcRequestQueue]);

  useEffect(() => {
    ice.forEach((iceCandidate, index) => {
      if (!iceCandidate.isCompleted) {
        socket.emit("send_ice_candidate", iceCandidate);
        const iceCopy = ice.map((iceC, i) => {
          if (index === i) {
            const candidateCopy = { ...iceC };
            candidateCopy.isCompleted = true;
            return candidateCopy;
          }
          return iceC;
        });
        setIce(iceCopy);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ice]);

  const setUpdatedPcRequest = (index, type) => {
    const updatedPcRequestQueue = pcRequestQueue.map((pr, i) => {
      if (index === i) {
        const requests = [...pr.requests];
        const updatedRequests = requests.map((request) => {
          if (request.type === type) {
            const updatedRequest = { ...request };
            updatedRequest.isCompleted = true;
            return updatedRequest;
          }
          return request;
        });
        const updatedData = { ...pr };
        updatedData.requests = updatedRequests;
        return updatedData;
      }
      return pr;
    });
    setPcRequestQueue(updatedPcRequestQueue);
  };

  useEffect(() => {
    if (!isObjectEmpty(track) && !track.isAdded) {
      let videoRef = videoRefs.filter((v) => v.id === track.id);
      videoRef = videoRef?.[0];
      if (videoRef) {
        const data = { ...track };
        data.isAdded = true;
        setTrack(data);
        addTracksToVideo(videoRef.ref, track.stream);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track]);
  useEffect(() => {
    if (!isObjectEmpty(track) && !track.isAdded) {
      let videoRef = videoRefs.filter((v) => v.id === track.id);
      videoRef = videoRef?.[0];
      if (videoRef) {
        const data = { ...track };
        data.isAdded = true;
        setTrack(data);
        addTracksToVideo(videoRef.ref, track.stream);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoRefs]);

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

    const candidates = [];
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        candidates.push(e.candidate);
      } else {
        const result = {
          pcId,
          candidates,
          isCompleted: false,
          socketId,
        };
        const iceCopy = [...ice];
        iceCopy.push(result);
        setIce(iceCopy);
      }
    };
    pc.ontrack = (e) => {
      const data = {
        id: pcId,
        stream: e.streams[0],
        isAdded: false,
      };
      setTrack(data);
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
    const data = {
      socketTo: peerConnection.socket,
      sdp: peerConnection.sdp,
      id: peerConnection.id,
      socketFrom: socket.id,
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
    setIsBusy(false);
  };

  const initiateAnswers = async (data) => {
    const pc = await initiatePeerConnection();
    if (state.stream !== undefined) {
      state.stream
        .getTracks()
        .forEach((track) => pc.addTrack(track, state.stream));
    }

    pc.ontrack = (e) => {
      const datas = {
        id: data.id,
        stream: e.streams[0],
        isAdded: false,
      };
      setTrack(datas);
    };

    await addRemoteDescription(pc, data.sdp);
    await answerOffers(pc);

    const peerConnections = [...state.pc];
    const peerConnection = {
      socket: data.socketFrom,
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
    await pc.setLocalDescription(localDescription);
  };

  const sendAnswer = (peerConnection) => {
    const data = {
      socketTo: peerConnection.socket,
      sdp: peerConnection.sdp,
      id: peerConnection.id,
      socketFrom: socket.id,
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
    setIsBusy(false);
  };

  const addAnswer = async (data) => {
    const pcId = data.id;
    const sdp = data.sdp;
    const peer = state.pc.filter((p) => p.id === pcId);
    const pc = peer?.[0].pc;
    await addRemoteDescription(pc, sdp);
    setPcRequestQueueCompleted(pcId);

    const iceCandidate = ice.filter((candidate) => candidate.pcId === pcId);
    socket.emit("send_ice_candidate", {
      socketTo: data.socketTo,
      ...iceCandidate[0],
    });
    setIsBusy(false);
  };

  const setIceCandidates = ({ pcId, candidates }) => {
    const peer = state.pc.filter((p) => p.id === pcId);
    const pc = peer?.[0].pc;
    addIceCandidate(pc, candidates);
    setPcRequestQueueCompleted(pcId);
    setIsBusy(false);
  };

  const addTracksToVideo = (ref, stream) => {
    ref.current.srcObject = stream;
  };
  const setPcRequestQueueCompleted = (pcId) => {
    const pcRequestQueueCopy = pcRequestQueue.map((pr) => {
      if (pr.id === pcId) {
        const prCopy = { ...pr };
        prCopy.isCompleted = true;
        return prCopy;
      }
      return pr;
    });
    setPcRequestQueue(pcRequestQueueCopy);
  };

  const mediaHandler = () => {};

  return (
    <div className={styles.mainContainer}>
      <Grid
        container
        direction="row"
        justify="center"
        alignItems="center"
        spacing={0}
      >
        {videoRefs.map((v, index) => (
          <Grid
            key={index}
            item
            xs={mobileGrid.sizes[index]}
            lg={desktopGrid.sizes[index]}
            style={{
              height: isDesktopWidth ? desktopGrid.height : mobileGrid.height,
            }}
          >
            <video ref={v.ref} className={styles.video} autoPlay playsInline />
          </Grid>
        ))}
      </Grid>
      <BottomNavigation clickHandler={mediaHandler} />
    </div>
  );
}

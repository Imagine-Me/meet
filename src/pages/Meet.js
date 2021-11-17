import { useEffect, useMemo, useState, createRef, useRef } from "react";
import { useHistory } from "react-router";
import { useRecoilState } from "recoil";
import { v4 as uuidv4 } from "uuid";
import { state as userState, user as userDetails } from "../recoil/state";
import addSockets from "../utils/socket";
import {
  addIceCandidate,
  addRemoteDescription,
  answerOffer,
  createOffer,
  initiatePeerConnection,
  addTracksToVideo,
  getUserStream,
} from "../utils/Video";
import { io } from "socket.io-client";
import {
  ADD_ANSWER,
  DISCONNECTED,
  GET_ICE_CANDIDATE,
  INITIATE_ANSWER,
  INITIATE_OFFER,
  REQUEST_OFFER,
  AUDIO_TOGGLE,
} from "../utils/constants";
import { meetStyles } from "../theme/meet";
import { Avatar, Grid, Typography, useMediaQuery } from "@material-ui/core";
import BottomNavigation from "../components/BottomNavigation";
import { desktopGridSize, mobileGridSize } from "../utils/gridSize";
import {
  addUserDetailToPC,
  completePcRequestArray,
  getPcById,
  removeConnection,
  setPcRequestQueueCompletedArray,
  toggleAudio,
  updatePcBeforeSendingOffer,
  updatePcRequestArray,
} from "../utils/helper";
import { IconButton } from "../components/Button";
import { AudioOff } from "../icons/Audio";
import { synchronousTaskQueue } from "synchronous-task-manager";

export default function Meet(props) {
  const [socket, setSocket] = useState(null);
  const [isBusy, setIsBusy] = useState(false);
  const [track, setTrack] = useState([]);
  const [pcRequestQueue, setPcRequestQueue] = useState([]);
  const [socketListener, setSocketListener] = useState(null);
  const [ice, setIce] = useState([]);
  const [state, setState] = useRecoilState(userState);
  const [user, setUser] = useRecoilState(userDetails);

  const taskQueue = useRef(synchronousTaskQueue);

  const isDesktopWidth = useMediaQuery((theme) => theme.breakpoints.up("md"));

  const history = useHistory();
  const styles = meetStyles();
  const videoRefs = useMemo(() => {
    return state.pc.map((p) => ({
      id: p.id,
      ref: createRef(),
      name: p.name,
      photo: p.photo,
      audio: p.audio,
    }));
  }, [state.pc]);

  const selfVideoRef = useRef();

  const { mobileGrid, desktopGrid } = useMemo(() => {
    return {
      mobileGrid: mobileGridSize(videoRefs.length),
      desktopGrid: desktopGridSize(videoRefs.length),
    };
  }, [videoRefs]);

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
      return () => {
        state.pc.forEach((pc) => {
          pc.pc.close();
        });
        setState((oldState) => ({
          ...oldState,
          link: null,
          pc: [],
        }));
      };
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
      addSockets(socket, setSocketListener);
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
                setPcRequestQueue(
                  updatePcRequestArray(pcRequestQueue, index, request.type)
                );
                return false;
              case INITIATE_OFFER:
                setIsBusy(true);
                initiateOffer(pcRequest.socketTo);
                setPcRequestQueue(
                  updatePcRequestArray(pcRequestQueue, index, request.type)
                );
                return false;
              case INITIATE_ANSWER:
                setIsBusy(true);
                initiateAnswers(request.value);
                setPcRequestQueue(
                  updatePcRequestArray(pcRequestQueue, index, request.type)
                );
                return false;
              case ADD_ANSWER:
                setIsBusy(true);
                addAnswer({ ...request.value, ...result });
                setPcRequestQueue(
                  updatePcRequestArray(pcRequestQueue, index, request.type)
                );
                return false;
              case GET_ICE_CANDIDATE:
                setIsBusy(true);
                setIceCandidates({
                  pcId: pcRequest.id,
                  candidates: request.value,
                });
                return false;
              case DISCONNECTED:
                setIsBusy(true);
                const updatedPc = removeConnection(state.pc, request.value);
                setState((oldState) => ({
                  ...oldState,
                  pc: updatedPc,
                }));
                setPcRequestQueue(
                  completePcRequestArray(pcRequestQueue, index)
                );
                setIsBusy(false);
                return false;
              case AUDIO_TOGGLE:
                setIsBusy(true);
                const updatedPcs = toggleAudio(state.pc, request.value);
                setState((oldState) => ({
                  ...oldState,
                  pc: updatedPcs,
                }));
                setPcRequestQueue(
                  completePcRequestArray(pcRequestQueue, index)
                );
                setIsBusy(false);
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

  useEffect(() => {
    videoRefs.forEach((videoRef) => {
      let mediaTrack = track.filter((t) => t.id === videoRef.id);
      mediaTrack = mediaTrack?.[0]?.stream;
      if (mediaTrack) {
        addTracksToVideo(videoRef.ref, mediaTrack);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoRefs, track]);

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

  useEffect(() => {
    async function getUserMediaStream() {
      if (state.stream) {
        state.stream.getTracks().forEach(function (track) {
          track.stop();
        });
      }
      const stream = await getUserStream(state.constraints);
      setState((oldState) => ({
        ...oldState,
        stream,
      }));
      if (selfVideoRef.current) {
        selfVideoRef.current.srcObject = stream;
      }
      // videoRef.current.srcObject = stream;
    }
    getUserMediaStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.constraints]);

  const initiateOffer = async (socketId) => {
    const pc = await initiatePeerConnection();
    const pcId = uuidv4();

    if (state.stream !== undefined) {
      state.stream
        .getTracks()
        .forEach((track) => pc.addTrack(track, state.stream));
    }

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
      const updatedTrack = [...track];
      const data = {
        id: pcId,
        stream: e.streams[0],
      };
      updatedTrack.push(data);
      setTrack(updatedTrack);
    };
    pc.onnegotiationneeded = await createOffer(pc);
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

  const sendOffer = (peerConnection) => {
    const { data, newPc } = updatePcBeforeSendingOffer(
      peerConnection,
      state.pc,
      socket.id,
      user,
      state.constraints
    );
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
      const updatedTrack = [...track];
      const datas = {
        id: data.id,
        stream: e.streams[0],
      };
      updatedTrack.push(datas);
      setTrack(updatedTrack);
    };
    try {
      await addRemoteDescription(pc, data.sdp);
    } catch {
      console.log("An error occurred");
    }
    await answerOffer(pc);

    const peerConnections = [...state.pc];
    const peerConnection = {
      socket: data.socketFrom,
      id: data.id,
      name: data.name,
      photo: data.photo,
      audio: data.audio,
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

  const sendAnswer = (peerConnection) => {
    const { data, newPc } = updatePcBeforeSendingOffer(
      peerConnection,
      state.pc,
      socket.id,
      user,
      state.constraints
    );
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
    const pc = getPcById(state.pc, pcId);
    try {
      await addRemoteDescription(pc, sdp);
    } catch {
      console.log("Error occurred");
    }
    setPcRequestQueue(setPcRequestQueueCompletedArray(pcRequestQueue, pcId));
    const iceCandidate = ice.filter((candidate) => candidate.pcId === pcId);
    socket.emit("send_ice_candidate", {
      socketTo: data.socketTo,
      ...iceCandidate[0],
    });
    const newPcs = addUserDetailToPC(
      state.pc,
      pcId,
      data.name,
      data.photo,
      data.audio
    );
    setState((oldState) => ({
      ...oldState,
      pc: newPcs,
    }));
    setIsBusy(false);
  };

  const setIceCandidates = ({ pcId, candidates }) => {
    const pc = getPcById(state.pc, pcId);
    addIceCandidate(pc, candidates);
    setPcRequestQueue(setPcRequestQueueCompletedArray(pcRequestQueue, pcId));
    setIsBusy(false);
  };

  const mediaHandler = async (type) => {
    switch (type) {
      case "disconnect":
        socket.disconnect();
        history.push("/");
        break;
      case "video":
        const constraints = { ...state.constraints };
        constraints.video = !constraints.video;
        setState((oldState) => ({
          ...oldState,
          constraints,
        }));
        break;
      case "audio":
        const mediaContraints = { ...state.constraints };
        mediaContraints.audio = !mediaContraints.audio;
        setState((oldState) => ({
          ...oldState,
          constraints: mediaContraints,
        }));
        socket.emit("toggle_audio", {
          audio: mediaContraints.audio,
        });
        break;
      default:
        break;
    }
  };

  return (
    <div className={styles.mainContainer}>
      <Grid
        container
        direction="row"
        justify="center"
        alignItems="center"
        spacing={0}
      >
        {videoRefs.length === 0 ? (
          <video
            className={styles.selfVideo}
            ref={selfVideoRef}
            autoPlay
            playsInline
            muted
          />
        ) : (
          <video
            className={styles.selfVideo2}
            ref={selfVideoRef}
            autoPlay
            playsInline
            muted
          />
        )}

        {videoRefs.map((v, index) => (
          <Grid
            key={index}
            className={styles.Grid}
            item
            xs={mobileGrid.sizes[index]}
            lg={desktopGrid.sizes[index]}
            style={{
              height: isDesktopWidth ? desktopGrid.height : mobileGrid.height,
            }}
          >
            <div className={styles.UserDesc}>
              <Avatar alt={v.name} src={v.photo} />
              <Typography variant="h6" color="secondary">
                {v.name}
              </Typography>
            </div>
            <div>
              {v.audio ? null : (
                <IconButton isSmall>
                  <AudioOff width={14} height={14} fill="white" />
                </IconButton>
              )}
            </div>
            <video
              ref={v.ref}
              className={styles.video}
              autoPlay
              playsInline
              muted={!v.audio}
            />
          </Grid>
        ))}
      </Grid>
      <BottomNavigation clickHandler={mediaHandler} />
    </div>
  );
}

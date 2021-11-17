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
  initiateOfferNew,
  initiateAnswersNew,
  addAnswerNew,
} from "../utils/Video";
import { io } from "socket.io-client";
import * as SOCKET_CONSTANTS from "../constants/socketConstant";
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
  const [tracks, setTracks] = useState([]);
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
    return tracks.map((p) => ({
      id: p.id,
      ref: createRef(),
    }));
  }, [tracks]);

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
      taskQueue.current.setState((_) => ({
        pc: [],
        track: [],
        ice: [],
      }));

      taskQueue.current.onStateChange((prev, next) => {
        const prevIce = prev.ice;
        const nextIce = next.ice;

        const prevTrack = prev.track;
        const nextTrack = next.track;

        if (prevTrack.length !== nextTrack.length) {
          setTracks(nextTrack);
        }

        if (prevIce.length !== nextIce.length) {
          const newIce = next.ice.map((ice) => {
            if (!ice.isCompleted) {
              ice.isCompleted = true;
              socket.emit("send_ice_candidate", {
                socketTo: ice.socketTo,
                ...ice,
              });
            }
            return ice;
          });

          taskQueue.current.setState((prev) => ({
            ...prev,
            ice: newIce,
          }));
        }
      });

      taskQueue.current.listen(processTask);
      addSockets(state.link, socket, taskQueue.current, setSocketListener);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  const processTask = async (value) => {
    switch (value.type) {
      case SOCKET_CONSTANTS.INITIATE_CONNECTION:
        console.log("CONNECTION INITIATED", value.value);
        setUser((oldState) => ({
          ...oldState,
          socketId: value.value,
        }));
        break;
      case SOCKET_CONSTANTS.INITIATE_OFFER:
        console.log("INITIATE OFFER", value.value);
        const peerConnectionOffer = await initiateOfferNew(
          value.value,
          state.stream,
          taskQueue.current
        );
        const offerData = {
          socketTo: value.value,
          sdp: peerConnectionOffer.pc.localDescription,
          id: peerConnectionOffer.id,
          socketFrom: socket.id,
          name: user.name,
          audio: state.constraints.audio,
        };
        console.log("SENDING OFFER", offerData);
        socket.emit("send_offer", offerData);
        break;
      case SOCKET_CONSTANTS.INITIATE_ANSWER:
        console.log("GOT AN OFFER", value.value);
        const peerConnectionAnswer = await initiateAnswersNew(
          value.value,
          state.stream,
          taskQueue.current
        );
        const answerData = {
          socketTo: value.value.socketFrom,
          sdp: peerConnectionAnswer.pc.localDescription,
          id: peerConnectionAnswer.id,
          socketFrom: socket.id,
          name: user.name,
          audio: state.constraints.audio,
        };
        console.log("SENDING ANSWER", answerData);
        socket.emit("send_answer", answerData);
        break;
      case SOCKET_CONSTANTS.ADD_ANSWER:
        console.log("GOT AN ANSWER", value.value);
        await addAnswerNew(value.value, taskQueue.current);
        console.log("ANSWER ADDED");
        break;
      case SOCKET_CONSTANTS.GET_ICE_CANDIDATE:
        console.log("GOT SOME ICE CANDIDATES", value.value);
        const newPc = taskQueue.current.state.pc.map((pc) => {
          if (pc.id === value.id) {
            addIceCandidate(pc.pc, value.value);
          }
          return pc;
        });
        taskQueue.current.setState((prev) => ({
          ...prev,
          pc: newPc,
        }));
        break;
      default:
        return;
    }
    taskQueue.current.complete();
  };

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
              case SOCKET_CONSTANTS.REQUEST_OFFER:
                socket.emit("get_offer", result);
                setPcRequestQueue(
                  updatePcRequestArray(pcRequestQueue, index, request.type)
                );
                return false;
              case SOCKET_CONSTANTS.INITIATE_OFFER:
                setIsBusy(true);
                initiateOffer(pcRequest.socketTo);
                setPcRequestQueue(
                  updatePcRequestArray(pcRequestQueue, index, request.type)
                );
                return false;
              case SOCKET_CONSTANTS.INITIATE_ANSWER:
                setIsBusy(true);
                initiateAnswers(request.value);
                setPcRequestQueue(
                  updatePcRequestArray(pcRequestQueue, index, request.type)
                );
                return false;
              case SOCKET_CONSTANTS.ADD_ANSWER:
                setIsBusy(true);
                addAnswer({ ...request.value, ...result });
                setPcRequestQueue(
                  updatePcRequestArray(pcRequestQueue, index, request.type)
                );
                return false;
              case SOCKET_CONSTANTS.GET_ICE_CANDIDATE:
                setIsBusy(true);
                setIceCandidates({
                  pcId: pcRequest.id,
                  candidates: request.value,
                });
                return false;
              case SOCKET_CONSTANTS.DISCONNECTED:
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
              case SOCKET_CONSTANTS.AUDIO_TOGGLE:
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
      let mediaTrack = tracks.filter((t) => t.id === videoRef.id);
      mediaTrack = mediaTrack?.[0]?.stream;
      console.log("ADDING STREAM", mediaTrack);
      if (mediaTrack && videoRef.ref.current) {
        addTracksToVideo(videoRef.ref, mediaTrack);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoRefs, tracks]);

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

        {tracks.map((v, index) => (
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
              <Typography variant="h6" color="secondary">
                {/* {v.name} */}
              </Typography>
            </div>
            <div>
              {/* {v.audio ? null : (
                <IconButton isSmall>
                  <AudioOff width={14} height={14} fill="white" />
                </IconButton>
              )} */}
            </div>
            <video
              ref={v.ref}
              className={styles.video}
              autoPlay
              playsInline
              muted={true}
            />
          </Grid>
        ))}
      </Grid>
      <BottomNavigation clickHandler={mediaHandler} />
    </div>
  );
}

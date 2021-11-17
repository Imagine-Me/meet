import { useEffect, useMemo, useState, createRef, useRef } from "react";
import { useHistory } from "react-router";
import { useRecoilState } from "recoil";
import { v4 as uuidv4 } from "uuid";
import { state as userState, user as userDetails } from "../recoil/state";
import addSockets from "../utils/socket";
import {
  addIceCandidate,
  addTracksToVideo,
  getUserStream,
  initiateOfferNew,
  initiateAnswersNew,
  addAnswerNew,
} from "../utils/Video";
import { io } from "socket.io-client";
import * as SOCKET_CONSTANTS from "../constants/socketConstant";
import { meetStyles } from "../theme/meet";
import { Grid, Typography, useMediaQuery } from "@material-ui/core";
import BottomNavigation from "../components/BottomNavigation";
import { desktopGridSize, mobileGridSize } from "../utils/gridSize";
import { synchronousTaskQueue } from "synchronous-task-manager";

export default function Meet(props) {
  const [socket, setSocket] = useState(null);
  const [tracks, setTracks] = useState([]);
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
  const selfVideoRef1 = useRef();

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

        const prevPc = prev.pc;
        const nextPc = next.pc;

        if (prevTrack.length !== nextTrack.length) {
          setTracks(nextTrack);
        }

        if (prevIce.length !== nextIce.length) {
          console.log("HMM", nextIce);
          nextIce.forEach((ice) => {
            if (!ice.isCompleted) {
              ice.isCompleted = true;
              const pc = nextPc.find((pc) => pc.id === ice.pcId);
              if (pc) {
                socket.emit("send_offer", pc.offerData);
              } else {
                console.log("COULD'NT CREATE PC");
              }
            }
          });
        }
      });

      taskQueue.current.listen(processTask);
      addSockets(state.link, socket, taskQueue.current);
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

        peerConnectionOffer.offerData = offerData;
        const newPcOffer = [...taskQueue.current.state.pc];
        newPcOffer.push(peerConnectionOffer);
        taskQueue.current.setState((prev) => ({
          ...prev,
          pc: newPcOffer,
        }));
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
        taskQueue.current.state.ice.forEach((ice) => {
          if (ice.pcId === value.value.id) {
            console.log("THIS CANDIDATE SHOULD SEND NOW...", ice);
            const iceCandidates = {
              socketId: ice.socketId,
              candidates: ice.candidates,
              pcId: ice.pcId,
            };
            console.log("SENDING ICE CANDIDATE", iceCandidates);
            socket.emit("send_ice_candidate", iceCandidates);
          }
        });
        console.log("ANSWER ADDED", value.value);
        break;
      case SOCKET_CONSTANTS.GET_ICE_CANDIDATE:
        console.log("GOT SOME ICE CANDIDATES", value.value);
        const newPc = taskQueue.current.state.pc.map((pc) => {
          if (pc.id === value.id) {
            console.log("ADDING ICE CANDIDATE");
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
    videoRefs.forEach((videoRef) => {
      let mediaTrack = tracks.filter((t) => t.id === videoRef.id);
      mediaTrack = mediaTrack?.[0]?.stream;
      console.log("ADDING STREAM", mediaTrack);
      if (mediaTrack && videoRef.ref.current) {
        addTracksToVideo(selfVideoRef1, mediaTrack);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoRefs, tracks]);

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
      <video
        style={{
          width: "300px",
          height: "300px",
          position: "absolute",
          top: "0",
          left: "0",
        }}
        ref={selfVideoRef1}
        autoPlay
        playsInline
        muted
      />
      {/* <Grid
        container
        direction="row"
        justify="center"
        alignItems="center"
        spacing={0}
      >

      </Grid>
      <BottomNavigation clickHandler={mediaHandler} /> */}
    </div>
  );
}

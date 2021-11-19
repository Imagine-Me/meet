import {
  useEffect,
  useMemo,
  useState,
  createRef,
  useRef,
  useCallback,
} from "react";
import { RouteProps, useHistory } from "react-router";
import VideoContainer from '../components/VideoContainer';
import { useRecoilState } from "recoil";
import { v4 as uuidv4 } from "uuid";
import { state as userState, user as userDetails } from "../recoil/state";
import addSockets, { DataType } from "../utils/socket";
import {
  addAnswer,
  addIceCandidate,
  getUserStream,
  initiateAnswer,
  initiateOffer,
  PcType,
  UserDetails,
} from "../utils/Video";
import { io, Socket } from "socket.io-client";
import * as SOCKET_CONSTANTS from "../constants/socketConstant";
import { meetStyles } from "../theme/meet";
import { Grid, Typography, useMediaQuery } from "@material-ui/core";
import BottomNavigation from "../components/BottomNavigation";
import { desktopGridSize, mobileGridSize } from "../utils/gridSize";
import { SynchronousTaskManager } from "synchronous-task-manager";

export default function Meet(props: any) {
  const [socket, setSocket] = useState<Socket | null>(null);
  // const [tracks, setTracks] = useState([]);
  const [pc, setPc] = useState<PcType[]>([]);
  const [state, setState] = useRecoilState(userState);
  const [user, setUser] = useRecoilState(userDetails);

  const taskQueue = useRef(new SynchronousTaskManager<PcType[], DataType>([]));

  // const isDesktopWidth = useMediaQuery((theme) => theme.breakpoints.up("md"));

  const history = useHistory();
  const selfVideoRef = useRef<HTMLVideoElement>(null);
  const styles = meetStyles();
  const videoRefs = useMemo(
    () =>
      pc.map((element) => ({
        videoRef: createRef<HTMLVideoElement>(),
        ...element,
      })),
    [pc]
  );

  useEffect(() => {
    videoRefs.forEach((element) => {
      if (element.videoRef.current) {
        element.videoRef.current.srcObject = element.track;
      }
    });
  }, [videoRefs]);


  useEffect(() => {
    async function getUserMediaStream() {
      if (state.stream) {
        state.stream.getTracks().forEach(function (track) {
          track.stop();
        });
      }
      const stream = await getUserStream(state.constraints);
      if (stream) {
        setState((oldState) => ({
          ...oldState,
          stream,
        }));
        if (selfVideoRef.current) {
          selfVideoRef.current.srcObject = stream;
        }
      }
    }
    getUserMediaStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.constraints]);

  const videoButtonClickHandler = (type: string) => {
    const constraints = { ...state.constraints };
    switch (type) {
      case "audio":
        constraints.audio = !constraints.audio;
        break;
      case "video":
        constraints.video = !constraints.video;
        break;
    }
    setState((oldState) => ({
      ...oldState,
      constraints,
    }));
    return null;
  };




  useEffect(
    () => {
      const link = props.match.params.meetId;
      setState((oldState) => ({
        ...oldState,
        link,
      }));
      if (user.isAuthenticated) {
        if (process.env.REACT_APP_BASE_URL) {
          const socketTemp = io(process.env.REACT_APP_BASE_URL);
          setSocket(socketTemp);
          addSockets(link, socketTemp, taskQueue.current);

          console.log("SETTING INITIAL STATE OF PC IN TASK QUEUE");
          taskQueue.current.setState((_) => []);

          taskQueue.current.onStateChange((_, currentState: PcType[]) => {
            setPc(currentState);
          });
        }
      } else {
        history.push(`/?redirect=${link}`);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const processTask = async (value: DataType) => {
    const userDetail = {
      name: user.name,
      audio: state.constraints.audio,
      socketFrom: socket?.id,
    } as UserDetails;

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
        const offerData = await initiateOffer(
          value.value,
          userDetail,
          state.stream,
          taskQueue.current
        );
        console.log("SENDING OFFER.....", offerData);
        socket?.emit("send_offer", offerData);
        break;

      case SOCKET_CONSTANTS.INITIATE_ANSWER:
        console.log("GOT AN OFFER", value.value);
        const answerData = await initiateAnswer(
          userDetail,
          value.value,
          state.stream,
          taskQueue.current
        );
        console.log("SENDING ANSWER", answerData);
        socket?.emit("send_answer", answerData);
        break;

      case SOCKET_CONSTANTS.ADD_ANSWER:
        console.log("GOT AN ANSWER", value.value);
        if (taskQueue.current.state) {
          const newPc = await addAnswer(value.value, taskQueue.current.state);
          console.log("ANSWER ADDED", newPc);
        }
        break;

      case SOCKET_CONSTANTS.SEND_ICE:
        console.log("SENDING ICE...", value.value);
        socket?.emit("send_ice_candidate", value.value);
        break;
      case SOCKET_CONSTANTS.GET_ICE_CANDIDATE:
        console.log("GOT SOME ICE CANDIDATES", value.value);
        if (taskQueue.current.state) {
          const tempData: PcType | undefined = taskQueue.current.state.find(
            (element) => element.id === value.id
          );
          if (tempData) {
            addIceCandidate(tempData.pc, value.value);
          }
        }
        break;
      default:
        return;
    }
    taskQueue.current.complete();
  };

  const processTaskCallback = useCallback(processTask, [socket, user, state]);

  useEffect(() => {
    taskQueue.current.listen(processTaskCallback);
  }, [processTaskCallback]);

  return (
    <div className={styles.mainContainer}>
      {/* {videoRefs.length===0 ? <video
      className={styles.selfVideo}
      ref={selfVideoRef}
      autoPlay
      muted
      /> : <video
      className={styles.selfVideo2}
      ref={selfVideoRef}
      autoPlay
      muted
    />} */}

    <VideoContainer video audio={false} name='Prince' color="#2e663a"></VideoContainer>

      {videoRefs.map((video) => (
        <video
          style={{
            width: "300px",
            height: "300px",
            marginRight: "10px",
          }}
          ref={video.videoRef}
          autoPlay
          muted
        />
      ))}

      {/* <BottomNavigation clickHandler={() => null} /> */}
    </div>
  );
}

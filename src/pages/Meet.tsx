import {
  useEffect,
  useMemo,
  useState,
  createRef,
  useRef,
  useCallback,
} from "react";
import { useHistory } from "react-router";
import VideoContainer from "../components/VideoContainer";
import { useRecoilState, useSetRecoilState } from "recoil";
import { LinkDialog } from "../components/LinkDialog";
import {
  ConstraintsProps,
  snackbar,
  state as userState,
  user as userDetails,
} from "../recoil/state";
import addSockets, { DataType } from "../utils/socket";
import {
  addAnswer,
  addIceCandidate,
  addTracksToPc,
  disconnect,
  getUserStream,
  initiateAnswer,
  initiateOffer,
  PcType,
  renegotiateAnswer,
  renegotiateOffer,
  toggleAudio,
  toggleVideo,
  UserDetails,
} from "../utils/Video";
import { io, Socket } from "socket.io-client";
import * as SOCKET_CONSTANTS from "../constants/socketConstant";
import { meetStyles } from "../theme/meet";
import { Grid, GridSize, useMediaQuery } from "@mui/material";
import BottomNavigation from "../components/BottomNavigation";
import { desktopGridSize, mobileGridSize } from "../utils/gridSize";
import { SynchronousTaskManager } from "synchronous-task-manager";

export default function Meet(props: any) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [pc, setPc] = useState<PcType[]>([]);
  const [show, setShow] = useState<boolean>(true);
  const [state, setState] = useRecoilState(userState);
  const [user, setUser] = useRecoilState(userDetails);
  const setSnackState = useSetRecoilState(snackbar);

  const taskQueue = useRef(new SynchronousTaskManager<PcType[], DataType>([]));

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

  const isDesktopWidth = useMediaQuery((theme: any) =>
    theme.breakpoints.up("md")
  );

  const { mobileGrid, desktopGrid } = useMemo(() => {
    return {
      mobileGrid: mobileGridSize(videoRefs.length),
      desktopGrid: desktopGridSize(videoRefs.length),
    };
  }, [videoRefs]);

  useEffect(() => {
    videoRefs.forEach((element) => {
      if (element.videoRef.current && element.track) {
        element.videoRef.current.srcObject = element.track;
      }
    });
  }, [videoRefs]);

  useEffect(() => {
    if (selfVideoRef.current) {
      selfVideoRef.current.srcObject = state.stream;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.stream]);

  const changeStream = async (constraints: ConstraintsProps) => {
    const stream = await getUserStream(constraints);
    if (!stream) return;
    const userDetail = {
      name: user.name,
      ...state.constraints,
      socketFrom: socket?.id,
    } as UserDetails;
    if (taskQueue.current && taskQueue.current.state) {
      taskQueue.current.state.forEach(async (element) => {
        const videoSender = addTracksToPc(
          element.pc,
          stream,
          element.videoSender
        );
        const offerData = await renegotiateOffer(element, userDetail);
        socket?.emit("send_offer", offerData);
        const temp = { ...element };
        temp.videoSender = videoSender;
        return temp;
      });
    }
    setState((oldState) => ({
      ...oldState,
      stream,
    }));
  };

  const videoButtonClickHandler = async (type: string) => {
    const constraints = { ...state.constraints };
    switch (type) {
      case "audio":
        constraints.audio = !constraints.audio;
        socket?.emit("toggle_audio", {
          audio: constraints.audio,
        });
        break;
      case "video":
        constraints.video = !constraints.video;
        socket?.emit("toggle_video", {
          video: constraints.video,
        });
        await changeStream(constraints);

        break;
      case "disconnect":
        socket?.close();
        history.push(`/`);
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
          taskQueue.current.setState((_) => []);

          taskQueue.current.onStateChange((_, currentState: PcType[]) => {
            setPc(currentState);
          });
          if (selfVideoRef.current) {
            selfVideoRef.current.srcObject = state.stream;
          }
          setShowDialog(true);
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
      ...state.constraints,
      socketFrom: socket?.id,
    } as UserDetails;

    switch (value.type) {
      case SOCKET_CONSTANTS.INITIATE_CONNECTION:
        setUser((oldState) => ({
          ...oldState,
          socketId: value.value,
        }));
        break;
      case SOCKET_CONSTANTS.INITIATE_OFFER:
        const offerData = await initiateOffer(
          value.value,
          userDetail,
          state.stream,
          taskQueue.current
        );
        socket?.emit("send_offer", offerData);
        break;

      case SOCKET_CONSTANTS.INITIATE_ANSWER:
        let tempPc = null;
        let answerData = null;
        if (taskQueue.current && taskQueue.current.state) {
          tempPc = taskQueue.current.state.find(
            (element) => element.id === value.value.id
          );
        }
        if (tempPc) {
          answerData = await renegotiateAnswer(tempPc, value.value, userDetail);
        } else {
          answerData = await initiateAnswer(
            userDetail,
            value.value,
            state.stream,
            taskQueue.current
          );
        }
        socket?.emit("send_answer", answerData);
        break;

      case SOCKET_CONSTANTS.ADD_ANSWER:
        if (taskQueue.current.state) {
          const { newPcs, isAlreadyJoined } = await addAnswer(
            value.value,
            taskQueue.current.state
          );
          if (!isAlreadyJoined) {
            setSnackState({
              message: `${value.value.name} joined`,
              type: "success",
              show: true,
            });
          }
          taskQueue.current.setState((_) => newPcs);
        }
        break;

      case SOCKET_CONSTANTS.SEND_ICE:
        socket?.emit("send_ice_candidate", value.value);
        break;
      case SOCKET_CONSTANTS.GET_ICE_CANDIDATE:
        if (taskQueue.current.state) {
          const tempData: PcType | undefined = taskQueue.current.state.find(
            (element) => element.id === value.id
          );
          if (tempData) {
            addIceCandidate(tempData.pc, value.value);
          }
        }
        break;
      case SOCKET_CONSTANTS.AUDIO_TOGGLE:
        if (taskQueue.current.state) {
          const newPc = toggleAudio(value.value, taskQueue.current.state);
          taskQueue.current.setState((_) => newPc);
        }
        break;
      case SOCKET_CONSTANTS.VIDEO_TOGGLE:
        if (taskQueue.current.state) {
          const newPc = toggleVideo(value.value, taskQueue.current.state);
          taskQueue.current.setState((_) => newPc);
        }
        break;
      case SOCKET_CONSTANTS.DISCONNECTED:
        if (taskQueue.current.state) {
          const { newPc, userName } = disconnect(
            value.value,
            taskQueue.current.state
          );
          setSnackState({
            message: `${userName} is leaving`,
            type: "error",
            show: true,
          });
          taskQueue.current.setState((_) => newPc);
        }
        break;
      default:
        return;
    }
    taskQueue.current.complete();
  };
  const toggleBottomNavigation = () => setShow((prev) => !prev);

  const processTaskCallback = useCallback(
    processTask,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [socket, user, state]
  );

  const copyToClipBoard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setSnackState({
        message: "Link copied to clipboard",
        type: "info",
        show: true,
      });
      setShowDialog(false);
    } catch {}
  };

  useEffect(() => {
    taskQueue.current.listen(processTaskCallback);
  }, [processTaskCallback]);

  return (
    <div className={styles.mainContainer}>
      <div
        onClick={toggleBottomNavigation}
        className={
          videoRefs.length > 0 ? styles.selfVideoSmall : styles.videoContainer
        }
      >
        <VideoContainer
          video={state.constraints.video}
          audio={state.constraints.audio}
          name={`${user.name} (You)`}
          color="#2e663a"
        >
          <video
            className={styles.video}
            ref={selfVideoRef}
            autoPlay
            muted
          ></video>
        </VideoContainer>
      </div>
      <div onClick={toggleBottomNavigation}>
        <Grid
          container
          direction="row"
          justifyContent="center"
          alignItems="center"
          spacing={0}
        >
          {videoRefs.map((v, index) => {
            const mobileSize = mobileGrid.sizes[index] ?? 3;
            const deskTopSize = desktopGrid.sizes[index] ?? 3;

            return (
              <Grid
                className={styles.Grid}
                itemScope
                item
                xs={mobileSize as GridSize}
                md={deskTopSize as GridSize}
                style={{
                  height: isDesktopWidth
                    ? desktopGrid.height
                    : mobileGrid.height,
                }}
              >
                <VideoContainer
                  video={v.video}
                  audio={v.audio}
                  name={v.name}
                  color={v.color}
                >
                  <video
                    ref={v.videoRef}
                    className={styles.video}
                    autoPlay
                    playsInline
                    muted={!v.audio}
                  />
                </VideoContainer>
              </Grid>
            );
          })}
        </Grid>
      </div>
      <BottomNavigation
        clickHandler={videoButtonClickHandler}
        show={show}
        copyToClipboard={copyToClipBoard}
      />
      <LinkDialog
        open={showDialog}
        handleClose={() => {
          setShowDialog(false);
        }}
        copyToClipboard={copyToClipBoard}
      />
    </div>
  );
}

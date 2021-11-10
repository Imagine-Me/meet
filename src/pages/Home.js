import {
  Box,
  Button,
  CircularProgress,
  Grid,
  TextField,
  Typography,
} from "@material-ui/core";
import { useEffect, useRef, useState } from "react";
import { useRecoilState } from "recoil";
import { getUserStream } from "../utils/Video";
import { state as siteState, user as userState } from "../recoil/state";
import { IconButton } from "../components/Button";
import VideoIcon, { VideoOff } from "../icons/videoIcon";
import { Audio, AudioOff } from "../icons/Audio";
import { fetchApi } from "../utils/fetch";
import useQuery from "../hooks/useQuery";
import { useHistory } from "react-router";
import { homeStyle } from "../theme/home";

export default function Home(props) {
  const [host, setHost] = useState(false);
  const [link, setLink] = useState("");
  const [state, setState] = useRecoilState(siteState);
  const [user, setUser] = useRecoilState(userState);
  const style = homeStyle();
  const parameter = useQuery(props.location);

  const videoRef = useRef(null);

  const history = useHistory();

  useEffect(() => {
    if (localStorage.getItem("meet_p_user_name")) {
      setUser((prev) => ({
        ...prev,
        name: localStorage.getItem("meet_p_user_name"),
        isAuthenticated: true,
      }));
    }
    const redirectLink = parameter.get("redirect");
    if (redirectLink) {
      setLink(redirectLink);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    }
    getUserMediaStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.constraints]);

  const videoButtonClickHandler = (type) => {
    const constraints = { ...state.constraints };
    switch (type) {
      case "audio":
        constraints.audio = !constraints.audio;
        break;
      case "video":
        constraints.video = !constraints.video;
        break;
      default:
        return;
    }
    setState((oldState) => ({
      ...oldState,
      constraints,
    }));
  };

  const meetButtonHandler = (type) => {
    setUser((prev) => ({
      ...prev,
      isAuthenticated: true,
    }));
    if (user.name !== localStorage.getItem("meet_p_user_name")) {
      localStorage.setItem("meet_p_user_name", user.name);
    }
    switch (type) {
      case "host":
        setHost(true);
        const dataHost = [
          {
            name: user.name,
            email: "",
          },
        ];
        initiatePeer("host", dataHost);
        break;
      case "join":
        const dataJoin = {
          name: user.name,
          email: "",
          meetId: link,
        };
        initiatePeer("join", dataJoin);
        break;

      default:
        return;
    }
  };

  const initiatePeer = async (type, data) => {
    const response = await fetchApi(type, data);
    const json = await response.json();
    setState((oldState) => ({
      ...oldState,
      link: json.meetId,
    }));
    setHost(false);
    history.push(`/${json.meetId}`);
  };

  return (
    <div className={style.body}>
      <Box className={style.bodyPadding} display="flex" alignItems="center">
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box className={style.formContainer}>
              <Typography variant="h5" color="textPrimary">
                Start instant meeting
              </Typography>
              <Box>
                <TextField
                  variant="outlined"
                  placeholder="Enter Name"
                  label=""
                  className={style.textField}
                  onChange={(e) =>
                    setUser((prev) => ({ ...prev, name: e.target.value }))
                  }
                  value={user.name}
                  fullWidth
                />
                <Button
                  color="primary"
                  variant="contained"
                  size="large"
                  fullWidth
                  className={style.marginTop}
                  onClick={() => meetButtonHandler("host")}
                  disabled={!user.name || link.length}
                >
                  {host ? (
                    <CircularProgress
                      color="inherit"
                      size={18}
                      style={{ marginRight: "8px" }}
                    />
                  ) : null}
                  Start Instant Meeting
                </Button>
                <TextField
                  variant="outlined"
                  placeholder="Enter link"
                  label=""
                  className={style.marginTop}
                  onChange={(e) => setLink(e.target.value)}
                  value={link}
                  fullWidth
                />
                <Button
                  color="secondary"
                  variant="contained"
                  size="large"
                  fullWidth
                  className={style.marginTop}
                  disabled={!link || !user.name}
                  onClick={() => meetButtonHandler("join")}
                >
                  Join Meeting
                </Button>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box position="relative" className={style.videoContainer}>
              <video
                className={style.video}
                ref={videoRef}
                autoPlay
                playsInline
                muted
              ></video>
              <div className={style.videoFooter}>
                <IconButton
                  onClick={() => videoButtonClickHandler("video")}
                  on={state.constraints.video}
                >
                  {state.constraints.video ? (
                    <VideoIcon
                      width={16}
                      height={16}
                      fill={state.constraints.video ? "black" : "white"}
                    />
                  ) : (
                    <VideoOff
                      width={16}
                      height={16}
                      fill={state.constraints.video ? "black" : "white"}
                    />
                  )}
                </IconButton>
                <IconButton
                  onClick={() => videoButtonClickHandler("audio")}
                  on={state.constraints.audio}
                >
                  {state.constraints.audio ? (
                    <Audio
                      width={16}
                      height={16}
                      fill={state.constraints.audio ? "black" : "white"}
                    />
                  ) : (
                    <AudioOff
                      width={16}
                      height={16}
                      fill={state.constraints.audio ? "black" : "white"}
                    />
                  )}
                </IconButton>
              </div>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </div>
  );
}

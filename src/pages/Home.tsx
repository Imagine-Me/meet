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
import {
  state as siteState,
  user as userState,
  UserProps,
} from "../recoil/state";
import { fetchApi } from "../utils/fetch";
import useQuery from "../hooks/useQuery";
import { RouteProps, useHistory } from "react-router";
import { homeStyle } from "../theme/home";
import { AudioButton, VideoButton } from "../components/VideoButton";

interface Props {
  location: RouteProps["location"];
}

type ConstraintsTypes = "AUDIO" | "VIDEO";
type UserTypes = "HOST" | "JOIN";

export default function Home({ location }: Props) {
  const [host, setHost] = useState<boolean>(false);
  const [link, setLink] = useState<string>("");
  const [state, setState] = useRecoilState(siteState);
  const [user, setUser] = useRecoilState(userState);
  const style = homeStyle();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const parameter = useQuery(location);

  const history = useHistory();

  useEffect(() => {
    const name = localStorage.getItem("meet_p_user_name");
    if (name) {
      setUser((prev: UserProps) => ({
        ...prev,
        name: name,
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

  const videoButtonClickHandler = (type: ConstraintsTypes) => {
    const constraints = { ...state.constraints };
    switch (type) {
      case "AUDIO":
        constraints.audio = !constraints.audio;
        break;
      case "VIDEO":
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

  const meetButtonHandler = (type: UserTypes) => {
    setUser((prev) => ({
      ...prev,
      isAuthenticated: true,
    }));
    if (user.name !== localStorage.getItem("meet_p_user_name")) {
      localStorage.setItem("meet_p_user_name", user.name);
    }
    switch (type) {
      case "HOST":
        setHost(true);
        const dataHost = [
          {
            name: user.name,
          },
        ];
        initiatePeer("host", dataHost);
        break;
      case "JOIN":
        const dataJoin = {
          name: user.name,
          meetId: link,
        };
        initiatePeer("join", dataJoin);
        break;

      default:
        return;
    }
  };

  const initiatePeer = async (type: string, data: any) => {
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
                  onClick={() => meetButtonHandler("HOST")}
                  disabled={!user.name || link.length > 0}
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
                  onClick={() => meetButtonHandler("JOIN")}
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
                <VideoButton
                  on={state.constraints.video}
                  clickHandler={() => {
                    videoButtonClickHandler("VIDEO");
                  }}
                />
                <AudioButton
                  on={state.constraints.audio}
                  clickHandler={() => videoButtonClickHandler("AUDIO")}
                />
              </div>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </div>
  );
}

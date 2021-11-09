import {
  Box,
  Button,
  CircularProgress,
  Grid,
  Modal,
  TextField,
  Typography,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";
import { useEffect, useRef, useState } from "react";
import { useRecoilState } from "recoil";
import Firebase from "firebase/app";

import Navigation from "../components/Navigation";
import { getUserStream } from "../utils/Video";
import { state as siteState, user as userState } from "../recoil/state";
import { IconButton } from "../components/Button";
import VideoIcon, { VideoOff } from "../icons/videoIcon";
import { Audio, AudioOff } from "../icons/Audio";
import GoogleIcon from "../icons/google";
import { fetchApi } from "../utils/fetch";
import useQuery from "../hooks/useQuery";
import { useHistory } from "react-router";

const useStyles = makeStyles((theme) => ({
  body: {
    height: "100%",
  },
  videoContainer: {
    height: "425px",
    width: "100%",
    backgroundColor: "black",
    borderRadius: "7px",
    margin: "auto",
    [theme.breakpoints.up("lg")]: {
      maxWidth: "570px",
    },
  },
  video: {
    objectFit: "cover",
    width: "100%",
    height: "100%",
    borderRadius: "7px",
  },
  videoFooter: {
    position: "absolute",
    bottom: "10px",
    left: 0,
    right: 0,
    display: "flex",
    justifyContent: "center",
  },
  modal: {
    backgroundColor: "white",
    borderRadius: "5px",
    marginTop: "10%",
    padding: "15px",
  },
  marginTop: {
    marginTop: "15px",
  },
  googleButton: {
    display: "flex",
    alignItems: "center",
    borderRadius: "5px",
    border: "1px solid gray",
    textTransform: "uppercase",
    padding: "5px ",
    marginTop: "10px",
    cursor: "pointer",
  },
  bodyMargin: {
    margin: "50px 15px",
    [theme.breakpoints.up("lg")]: {
      margin: "50px 45px",
    },
  },
  formContainer: {
    [theme.breakpoints.up("lg")]: {
      maxWidth: "450px",
    },
  },
}));

export default function Home(props) {
  const [modal, setModal] = useState(false);
  const [host, setHost] = useState(false);
  const [link, setLink] = useState("");
  const [state, setState] = useRecoilState(siteState);
  const [user, setUser] = useRecoilState(userState);
  const style = useStyles();
  console.log(props.location);
  const parameter = useQuery(props.location);

  const videoRef = useRef(null);

  const history = useHistory();

  useEffect(() => {
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

  useEffect(() => {
    if (user.firebase) {
      user.firebase.auth().onAuthStateChanged((u) => {
        if (u) {
          setUser((oldState) => ({
            ...oldState,
            isAuthenticated: true,
            name: u.displayName,
            email: u.email,
            photo: u.photoURL,
          }));
        } else {
          setModal(true);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.firebase]);

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

  const signInButtonHandler = () => {
    const provider = new Firebase.auth.GoogleAuthProvider();
    user.firebase
      .auth()
      .signInWithPopup(provider)
      .then((result) => {
        setModal(false);
        setUser((oldState) => ({
          ...oldState,
          isAuthenticated: true,
        }));
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const meetButtonHandler = (type) => {
    switch (type) {
      case "host":
        if (!user.isAuthenticated) {
          setModal(true);
          return;
        }
        setHost(true);
        const dataHost = [
          {
            name: user.name,
            email: user.email,
          },
        ];
        initiatePeer("host", dataHost);
        break;
      case "join":
        if (!user.isAuthenticated) {
          setModal(true);
          return;
        }
        const dataJoin = {
          name: user.name,
          email: user.email,
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
      <Navigation modalHandler={() => setModal(true)} />
      <Box
        className={style.bodyMargin}
        height="90%"
        display="flex"
        alignItems="center"
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box className={style.formContainer}>
              <Typography variant="h4" color="textPrimary">
                Start instant meeting
              </Typography>
              <Box>
                <Button
                  color="primary"
                  variant="contained"
                  size="large"
                  fullWidth
                  className={style.marginTop}
                  onClick={() => meetButtonHandler("host")}
                  disabled={host}
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
                  disabled={!link}
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
                      width={25}
                      height={25}
                      fill={state.constraints.video ? "black" : "white"}
                    />
                  ) : (
                    <VideoOff
                      width={25}
                      height={25}
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
                      width={25}
                      height={25}
                      fill={state.constraints.audio ? "black" : "white"}
                    />
                  ) : (
                    <AudioOff
                      width={25}
                      height={25}
                      fill={state.constraints.audio ? "black" : "white"}
                    />
                  )}
                </IconButton>
              </div>
            </Box>
          </Grid>
        </Grid>
      </Box>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        aria-labelledby="sign in modal"
        aria-describedby="sign in to start/join meeting"
      >
        <Box
          width="100%"
          padding="10px"
          maxWidth="400px"
          className={style.modal}
          marginX="auto"
        >
          <Typography variant="h6" color="textSecondary" align="center">
            Sign In
          </Typography>
          <div className={style.googleButton} onClick={signInButtonHandler}>
            <div
              style={{
                marginTop: "2px",
                borderRight: "1px solid gray",
                padding: "0 5px",
                marginRight: "7px",
              }}
            >
              <GoogleIcon width={25} height={25} />
            </div>
            <div>Sign in with Google</div>
          </div>
        </Box>
      </Modal>
    </div>
  );
}

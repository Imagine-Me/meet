import { Box, Button, Grid, Modal, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";
import { useEffect, useRef, useState } from "react";
import { useRecoilState } from "recoil";
import Firebase from "firebase";

import Navigation from "../components/Navigation";
import { getUserStream } from "../utils/Video";
import { state as siteState, user as userState } from "../recoil/state";
import { IconButton } from "../components/Button";
import VideoIcon, { VideoOff } from "../icons/videoIcon";
import { Audio, AudioOff } from "../icons/Audio";
import GoogleIcon from "../icons/google";

const useStyles = makeStyles({
  body: {
    height: "100%",
  },
  videoContainer: {
    height: "425px",
    maxWidth: "570px",
    width: "100%",
    maxHeight: "600px",
    backgroundColor: "black",
    borderRadius: "7px",
  },
  video: {
    width: "100%",
    height: "100%",
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
    transform: "translateY(-50%)",
    marginTop: "38%",
    padding: "15px",
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
});

export default function Home() {
  const [modal, setModal] = useState(false);
  const [state, setState] = useRecoilState(siteState);
  const [user, setUser] = useRecoilState(userState);
  const style = useStyles();

  const videoRef = useRef(null);

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
      videoRef.current.srcObject = stream;
    }
    getUserMediaStream();
  }, [state.constraints]);

  useEffect(() => {
    if (user.firebase) {
      user.firebase.auth().onAuthStateChanged((u) => {
        if (u) {
          setUser((oldState) => ({
            ...oldState,
            isAuthenticated: true,
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
        var user = result.user;
        setModal(false);
        setUser((oldState) => ({
          ...oldState,
          isAuthenticated: true,
        }));
      })
      .catch((error) => {});
  };

  return (
    <div className={style.body}>
      <Navigation modalHandler={() => setModal(true)} />
      <Box height="90%" display="flex" alignItems="center" marginX={10}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6} justifyContent="center">
            <Box>
              <Typography variant="h4" color="textPrimary">
                Start instant meeting
              </Typography>
              <Box maxWidth="350px">
                <Button
                  color="primary"
                  variant="contained"
                  size="large"
                  fullWidth
                  style={{ marginTop: "15px" }}
                  disabled={!user.isAuthenticated}
                >
                  Start Instant Meeting
                </Button>
                <Button
                  color="secondary"
                  variant="contained"
                  size="large"
                  fullWidth
                  style={{ marginTop: "15px" }}
                  disabled={!user.isAuthenticated}
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

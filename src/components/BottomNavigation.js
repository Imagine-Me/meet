import { Box, makeStyles } from "@material-ui/core";
import { useRecoilValue } from "recoil";
import { Audio, AudioOff } from "../icons/Audio";
import { Call } from "../icons/Call";
import VideoIcon, { VideoOff } from "../icons/videoIcon";
import { state as siteState } from "../recoil/state";

import { IconButton } from "./Button";

const useStyles = makeStyles({
  navigation: {
    backgroundColor: "white",
  },
});

export default function BottomNavigation({ clickHandler }) {
  const state = useRecoilValue(siteState);
  const classes = useStyles();
  return (
    <Box
      className={classes.navigation}
      position="fixed"
      bottom="0"
      left="0"
      right="0"
      height="100px"
      display="flex"
      justifyContent="center"
      alignItems="center"
      boxShadow={2}
    >
      <div>
        <IconButton
          onClick={() => clickHandler("video")}
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
          onClick={() => clickHandler("audio")}
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
        <IconButton onClick={() => clickHandler("audio")} on={false}>
          <Call width={25} height={25} color="white" />
        </IconButton>
      </div>
    </Box>
  );
}

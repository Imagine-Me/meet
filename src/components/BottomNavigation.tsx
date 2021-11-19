import { Box, makeStyles } from "@material-ui/core";
import { useRecoilValue } from "recoil";
import { state as siteState } from "../recoil/state";
import { MdOutlineCallEnd } from "react-icons/md";

import { IconButton } from "./Button";
import { AudioButton, VideoButton } from "./IconButtons";

const useStyles = makeStyles({
  navigation: {
    backgroundColor: "white",
  },
});

interface Props {
  clickHandler: (val: String) => null;
}

export default function BottomNavigation({ clickHandler }: Props) {
  const state = useRecoilValue(siteState);
  const classes = useStyles();
  return (
    <Box
      className={classes.navigation}
      position="fixed"
      bottom="0"
      left="0"
      right="0"
      height="80px"
      display="flex"
      justifyContent="center"
      alignItems="center"
      boxShadow={2}
    >
      <div>
        <VideoButton
          on={state.constraints.video}
          clickHandler={() => clickHandler("video")}
        />
        <AudioButton
          on={state.constraints.audio}
          clickHandler={() => clickHandler("audio")}
        />
        <IconButton
          onClick={() => clickHandler("disconnect")}
          on={false}
          isSmall={false}
        >
          <MdOutlineCallEnd size={20} color="white" />
        </IconButton>
      </div>
    </Box>
  );
}

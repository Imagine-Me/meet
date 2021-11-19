import { Box, makeStyles } from "@material-ui/core";
import { useRecoilValue } from "recoil";
import { state as siteState } from "../recoil/state";
import { MdOutlineCallEnd } from "react-icons/md";

import { IconButton } from "./Button";
import { AudioButton, VideoButton } from "./IconButtons";
import { useEffect, useState } from "react";

const useStyles = makeStyles({
  navigation: {
    backgroundColor: "white",
    transform: "translate(0,80px)",
    transition: "0.5s",
    position: "fixed",
    left: 0,
    right: 0,
    height: "80px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
});

interface Props {
  clickHandler: (val: String) => null;
}

export default function BottomNavigation({ clickHandler }: Props) {
  const [show, setShow] = useState(true);
  const state = useRecoilValue(siteState);
  const classes = useStyles();

  useEffect(() => {
    document.body.addEventListener("click", onClickBody);
    return () => {
      document.body.removeEventListener("click", onClickBody);
    };
  });
  const onClickBody = () => {
    console.log("Body Click works");
    setShow((prev) => !prev);
  };
  return (
    <Box
      className={classes.navigation}
      bottom={show ? "80px" : "-81px"}
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

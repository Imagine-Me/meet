import { Badge, Box, Button, IconButton } from "@mui/material";
import { makeStyles } from "@mui/styles";
import { useRecoilValue } from "recoil";
import { state as siteState } from "../recoil/state";
import { MdOutlineCallEnd } from "react-icons/md";
import { AiOutlineLink, AiOutlineUser } from "react-icons/ai";

import { IconButton as IconButtonCustom } from "./Button";
import { AudioButton, VideoButton } from "./IconButtons";

interface Props {
  clickHandler: (val: string) => void;
  show: boolean;
  count: number;
  copyToClipboard: () => void;
}

const useStyles = makeStyles({
  navigation: {
    backgroundColor: "white",
    transform: "translate(0,80px)",
    transition: "0.5s",
    position: "fixed",
    left: 0,
    right: 0,
    height: "80px",
  },
  container: {
    maxWidth: "700px",
    height: "100%",
    margin: "auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
});

const BottomNavigation = ({
  clickHandler,
  show,
  copyToClipboard,
  count,
}: Props) => {
  const state = useRecoilValue(siteState);
  const classes = useStyles();
  return (
    <Box
      className={classes.navigation}
      bottom={show ? "80px" : "-81px"}
      boxShadow={2}
    >
      <div className={classes.container}>
        <div>
          <IconButton aria-label="delete" onClick={copyToClipboard}>
            <AiOutlineLink />
          </IconButton>
        </div>
        <div>
          <VideoButton
            on={state.constraints.video}
            clickHandler={() => clickHandler("video")}
          />
          <AudioButton
            on={state.constraints.audio}
            clickHandler={() => clickHandler("audio")}
          />
          <IconButtonCustom
            onClick={() => clickHandler("disconnect")}
            on={false}
            isSmall={false}
          >
            <MdOutlineCallEnd size={20} color="white" />
          </IconButtonCustom>
        </div>
        <div>
          <Badge badgeContent={count} color="primary">
            <Button
              sx={{
                minWidth: "50px",
                width: "50px",
                height: "50px",
                borderRadius: "50%",
              }}
              variant="contained"
              color="inherit"
              onClick={() => clickHandler("disconnect")}
            >
              <AiOutlineUser size={20} />
            </Button>
          </Badge>
        </div>
      </div>
    </Box>
  );
};

export default BottomNavigation;

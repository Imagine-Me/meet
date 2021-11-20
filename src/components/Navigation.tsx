import { Box, Button, Theme, Typography } from "@mui/material";
import { makeStyles } from "@mui/styles";
import { useRecoilValue } from "recoil";
import { user as userState } from "../recoil/state";

import User from "../icons/user";
import VideoIcon from "../icons/videoIcon";

const useStyles = makeStyles((theme: Theme) => ({
  bodyMargin: {
    margin: "0 15px",
    [theme.breakpoints.up("lg")]: {
      margin: "0 45px",
    },
  },
}));

interface Props {
  modalHandler: () => null;
}

export default function Navigation({ modalHandler }: Props) {
  const user = useRecoilValue(userState);

  const classes = useStyles();
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      className={classes.bodyMargin}
      flexDirection="row"
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <VideoIcon fill="#5775C1" width="40" height="40" />
        <Typography style={{ marginLeft: "10px" }} variant="h5">
          Meet
        </Typography>
      </div>
      <Button onClick={user.isAuthenticated ? undefined : modalHandler}>
        <User />
        <div style={{ marginLeft: "5px" }}>{user.name ?? "Login"}</div>
      </Button>
    </Box>
  );
}

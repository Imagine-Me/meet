import { Box, Button, Typography } from "@material-ui/core";
import { useRecoilValue } from "recoil";
import { user as userState } from "../recoil/state";

import User from "../icons/user";
import VideoIcon from "../icons/videoIcon";

export default function Navigation({ modalHandler }) {
  const user = useRecoilValue(userState);
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      marginX={10}
      flexDirection="row"
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <VideoIcon fill="#5775C1" width="40" height="40" />
        <Typography style={{ marginLeft: "10px" }} variant="h5">
          Meet
        </Typography>
      </div>
      <Button onClick={user.isAuthenticated ? null : modalHandler}>
        <User />
        <div style={{ marginLeft: "5px" }}>{user.name ?? "Login"}</div>
      </Button>
    </Box>
  );
}

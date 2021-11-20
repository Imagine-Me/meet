import {
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import { UserList } from "../pages/Meet";
import { useRecoilValue } from "recoil";
import { AiOutlineAudio, AiOutlineAudioMuted } from "react-icons/ai";
import { BsCameraVideo, BsCameraVideoOff } from "react-icons/bs";
import { user as UserState, state as VideoState } from "../recoil/state";
import UserAvatar from "./UserAvatar";

const useStyles = makeStyles({
  iconButton: {
    width: "20px",
    height: "20px",
    display: "flex",
    justifyContent: "center",
    alignContent: "center",
    borderRadius: "50%",
  },
  iconContainer: {
    display: "flex",
  },

  audio: {
    width: "25px",
    height: "25px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: "50%",
    marginLeft: "5px",
  },
});

interface Props {
  open: boolean;
  users: UserList[];
  closeDrawer: () => void;
}

export default function ListDrawer({ open, users, closeDrawer }: Props) {
  const user = useRecoilValue(UserState);
  const video = useRecoilValue(VideoState);
  return (
    <Drawer anchor="right" open={open} onClose={closeDrawer}>
      <List>
        <UserListItem
          name={`${user.name} (You)`}
          audio={video.constraints.audio}
          video={video.constraints.video}
          color="#2e663a"
        />
        <Divider />
        {users.map((element, index) => (
          <>
            <UserListItem
              key={`user_list_${index}`}
              name={element.name}
              audio={element.audio}
              video={element.video}
              color={element.color}
            />
            <Divider />
          </>
        ))}
      </List>
    </Drawer>
  );
}

interface UserProps {
  name: string;
  video: boolean;
  audio: boolean;
  color: string;
}

function UserListItem({ name, video, audio, color }: UserProps) {
  const classes = useStyles();
  return (
    <ListItem sx={{ minWidth: "250px" }}>
      <ListItemIcon>
        <UserAvatar color={color} name={name} size={35} />
      </ListItemIcon>
      <ListItemText>{name}</ListItemText>
      <ListItemSecondaryAction>
        <div className={classes.iconContainer}>
          <div
            className={classes.audio}
            style={{
              backgroundColor: video ? "green" : "red",
            }}
          >
            {video ? (
              <BsCameraVideo size={15} color="white" />
            ) : (
              <BsCameraVideoOff size={15} color="white" />
            )}
          </div>
          <div
            className={classes.audio}
            style={{
              backgroundColor: audio ? "green" : "red",
            }}
          >
            {audio ? (
              <AiOutlineAudio size={15} color="white" />
            ) : (
              <AiOutlineAudioMuted size={15} color="white" />
            )}
          </div>
        </div>
      </ListItemSecondaryAction>
    </ListItem>
  );
}

import { makeStyles } from "@material-ui/core";
import UserAvatar from "../components/UserAvatar";
import { AiOutlineAudioMuted, AiOutlineAudio } from "react-icons/ai";

interface Props {
  audio: boolean;
  video: boolean;
  name: string;
  color: string;
  children?: React.ReactNode;
}

const useStyle1 = makeStyles((theme) => ({
  containerWithoutVideo: {
    backgroundColor: "#363636",
    border: "2px solid grey",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
  },
  userDetails: {
    position: "absolute",
    bottom: "0",
    padding: "10px",
    display: "flex",
    fontSize: "16px",
    alignItems: "center",
    color: "white",
    left: 0,
    right: 0,
  },
  audio: {
    width: "25px",
    height: "25px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: "50%",
  },
}));

const useStyle2 = makeStyles({
  container: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
});

function UserDetails({ name, audio }: Partial<Props>) {
  const styles = useStyle1();

  return (
    <div className={styles.userDetails}>
      <div
        className={styles.audio}
        style={{ backgroundColor: audio ? "" : "red" }}
      >
        {audio ? (
          <AiOutlineAudio size={15} color="white" />
        ) : (
          <AiOutlineAudioMuted size={15} color="white" />
        )}
      </div>
      <div style={{ marginLeft: "5px" }}>{name}</div>
    </div>
  );
}

function ContainerWithoutVideo({ audio, name, color }: Partial<Props>) {
  const styles = useStyle1();
  return (
    <div className={styles.containerWithoutVideo}>
      <UserAvatar size={100} name={name ?? ""} color={color ?? ""} />
      <UserDetails audio={audio} name={name} />
    </div>
  );
}

function ContainerWithVideo({ audio, name, children }: Partial<Props>) {
  const styles = useStyle1();
  return (
    <div className={styles.containerWithoutVideo}>
      {children}
      <UserDetails audio={audio} name={name} />
    </div>
  );
}

export default function VideoContainer({
  audio,
  video,
  name,
  children,
  color,
}: Props) {
  return video ? (
    <ContainerWithVideo audio={audio} name={name}>
      {children}
    </ContainerWithVideo>
  ) : (
    <ContainerWithoutVideo audio={audio} name={name} color={color} />
  );
}

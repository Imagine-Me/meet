import { makeStyles } from "@material-ui/styles";

const useStyles = makeStyles((theme) => ({
  videoContainer: {
    position: "relative",
  },
  photoContainer: {
    position: "absolute",
    top: "0",
    left: "0",
    bottom: "0",
    right: "0",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
}));

interface Props{
  image: string,
  name: string,
  children: React.ReactNode
}

export default function Video({ image, name, children }: Props) {
  const classes = useStyles();
  return (
    <div className={classes.videoContainer}>
      <div className={classes.photoContainer}>
          <img src={image} />
      </div>
      {children}
    </div>
  );
}

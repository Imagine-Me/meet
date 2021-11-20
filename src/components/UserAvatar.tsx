import { makeStyles } from "@mui/styles";

const useStyle = makeStyles({
  container: {
    borderRadius: "50%",
    minWidth: "20px",
    minHeight: "20px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "white",
    textTransform: "capitalize",
  },
});

interface Props {
  size: number;
  name: string;
  color: string;
}

export default function UserAvatar({ size, name, color }: Props) {
  const fontSize: number = (size - 10) > 0 ? (size - 40) : 5;
  const styles = useStyle();
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        fontSize: `${fontSize}px`,
        backgroundColor: color,
      }}
      className={styles.container}
    >
      {name.charAt(0)}
    </div>
  );
}

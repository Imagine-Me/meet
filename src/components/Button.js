import { Button } from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";

const useStyles = makeStyles({
  button: {
    width: "65px",
    height: "65px",
    borderRadius: "100%",
    padding: "0",
    margin: "0 10px",
  },
});

export const IconButton = ({ children, on, onClick }) => {
  const style = useStyles();
  return (
    <Button
      color={on ? "default" : "secondary"}
      variant="contained"
      className={style.button}
      onClick={onClick}
    >
      {children}
    </Button>
  );
};

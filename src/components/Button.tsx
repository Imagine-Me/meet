import { Button } from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";

const useStyles = makeStyles({
  button: {
    borderRadius: "100%",
    padding: "0",
    margin: "0 10px",
  },
  small: {
    width: "20px",
    height: "20px",
    minWidth: "20px"
  },
  big: {
    width: "50px",
    height: "50px",
    minWidth: "20px"
  },
});

interface Props{
  children: React.ReactNode,
  on: boolean,
  onClick: () => null,
  isSmall: boolean
}

export const IconButton = ({ children, on, onClick, isSmall } : Props) => {
  const style = useStyles();
  return (
    <Button
      color={on ? "default" : "secondary"}
      variant="contained"
      size={isSmall ? "small": "large"}
      className={[style.button, isSmall ? style.small : style.big].join(" ")}
      onClick={onClick ?? null}
    >
      {children}
    </Button>
  );
};

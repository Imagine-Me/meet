import { Button } from "@mui/material";
import { makeStyles } from "@mui/styles";

const useStyles = makeStyles({
  button: {
    borderRadius: "100% !important",
  },
  small: {
    width: "20px",
    height: "20px",
    minWidth: "20px",
  },
  big: {
    width: "50px",
    height: "50px",
  },
});

interface Props {
  children: React.ReactNode;
  on: boolean;
  onClick: () => void;
  isSmall: boolean;
}

export const IconButton = ({ children, on, onClick, isSmall }: Props) => {
  const style = useStyles({ children, on, onClick, isSmall });
  return (
    <Button
      color={on ? "inherit" : "error"}
      variant="contained"
      sx={{ mx: 1, p: 0, minWidth: "20px" }}
      size={isSmall ? "small" : "large"}
      className={[style.button, isSmall ? style.small : style.big].join(" ")}
      onClick={onClick ?? null}
    >
      {children}
    </Button>
  );
};

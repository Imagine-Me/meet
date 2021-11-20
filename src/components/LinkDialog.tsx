import {
  Alert,
  Dialog,
  DialogTitle,
  DialogContentText,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { useSetRecoilState } from "recoil";
import { snackbar } from "../recoil/state";
interface Props {
  open: boolean;
  link: string;
  handleClose: () => void;
}

export const LinkDialog = ({ open, handleClose, link }: Props) => {
  const setSnackState = useSetRecoilState(snackbar);
  const copyToClipBoard = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setSnackState({
        message: "Copied to clipboard",
        type: "info",
        show: true,
      });
      handleClose();
    } catch {}
  };
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">Invite friends</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          Share the following link to your friends to join the meet.
          <Alert severity="success" sx={{ mt: 1 }}>
            {link}
          </Alert>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
        <Button onClick={copyToClipBoard} autoFocus>
          Copy
        </Button>
      </DialogActions>
    </Dialog>
  );
};

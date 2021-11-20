import {
  Alert,
  Dialog,
  DialogTitle,
  DialogContentText,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
interface Props {
  open: boolean;
  handleClose: () => void;
  copyToClipboard: () => void;
}

export const LinkDialog = ({ open, handleClose, copyToClipboard }: Props) => {
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
            {window.location.href}
          </Alert>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
        <Button onClick={copyToClipboard} autoFocus>
          Copy
        </Button>
      </DialogActions>
    </Dialog>
  );
};

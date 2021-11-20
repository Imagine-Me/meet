import { makeStyles } from "@material-ui/core/styles";

export const homeStyle = makeStyles((theme) => ({
    body: {
      height: "100%",
    },
    videoContainer: {
      height: "425px",
      width: "100%",
      backgroundColor: "black",
      borderRadius: "7px",
      margin: "auto",
      [theme.breakpoints.up("lg")]: {
        maxWidth: "570px",
      },
    },
    textField: {
      marginTop: '10px'
    },
    video: {
      objectFit: "cover",
      width: "100%",
      height: "100%",
      borderRadius: "7px",
    },
    videoFooter: {
      position: "absolute",
      bottom: "10px",
      left: 0,
      right: 0,
      display: "flex",
      justifyContent: "center",
    },
    modal: {
      backgroundColor: "white",
      borderRadius: "5px",
      marginTop: "10%",
      padding: "15px",
    },
    marginTop: {
      marginTop: "15px",
    },
    googleButton: {
      display: "flex",
      alignItems: "center",
      borderRadius: "5px",
      border: "1px solid gray",
      textTransform: "uppercase",
      padding: "5px ",
      marginTop: "10px",
      cursor: "pointer",
    },
    bodyPadding: {
      padding: "50px 15px",
      height: 'calc(100% - 100px)',
      [theme.breakpoints.up("lg")]: {
        padding: "50px",
      },
    },
    formContainer: {
      [theme.breakpoints.up("lg")]: {
        margin: 'auto',
        maxWidth: "450px",
      },
    },
  }));
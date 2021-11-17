import { makeStyles } from '@material-ui/core'

export const meetStyles = makeStyles({
    mainContainer: {
        backgroundColor: "#363636",
        width: "100%",
        height: "calc(100% - 100px)",
        position: "relative",
    },
    videoContainer: {
        height: "100%",
        width: "100%",
    },
    video: {
        objectFit: "cover",
        width: "100%",
        height: "100%",
    },
    selfVideo: {
        objectFit: "cover",
        width: "100%",
        height: `calc(${window.innerHeight}px - 100px)`,
    },
    selfVideo2: {
        objectFit: "cover",
        width: "200px",
        height: "120px",
        position: "absolute",
        right: "0",
        top: "0",
        borderRadius: "5px",
    },
    UserDesc: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: -1,
        flexDirection: "column",
    },
    Grid: {
        position: "relative",
    },
});
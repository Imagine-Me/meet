import { makeStyles } from '@mui/styles'

export const meetStyles: any = makeStyles({
    container: {
        width: '100%',
        height: '100%'
    },
    mainContainer: {
        backgroundColor: "#363636",
        width: "100%",
        height: "100%",
        position: "relative",
    },
    videoContainer: {
        height: "100%",
        width: "100%",
    },
    video: {
        objectFit: "fill",
        width: "100%",
        height: "100%",
    },
    selfVideoSmall: {
        position: 'absolute',
        right: '5px',
        top: '5px',
        width: '200px',
        height: '110px',
        zIndex: 1000
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
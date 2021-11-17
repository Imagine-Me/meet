import { Socket } from "socket.io-client";
import * as SOCKET_CONSTANTS from '../constants/socketConstant';

export default function addSockets(socket: Socket, setSocketListener: Function) {

    socket.on("get_users", (data) => {
        const initialUsers = data.map((value: any) => ({
            isCompleted: false,
            socketTo: value,
            requests: [{ type: SOCKET_CONSTANTS.REQUEST_OFFER, isCompleted: false }],
            id: undefined,
        }));
        setSocketListener(initialUsers);
    });

    socket.on("get_offer_request", (data) => {
        const result = {
            socketTo: data,
            id: null,
            requests: [{ type: SOCKET_CONSTANTS.INITIATE_OFFER, isCompleted: false }],
            isCompleted: false,
        };
        setSocketListener(result);
    });

    socket.on("get_offer", (data) => {
        const result = {
            id: data.id,
            socketTo: data.socketFrom,
            requests: [
                { type: SOCKET_CONSTANTS.INITIATE_ANSWER, isCompleted: false, value: data },
            ],
        };
        setSocketListener(result);
    });

    socket.on("get_answer", function (data) {
        const result = {
            id: data.id,
            socketTo: data.socketFrom,
            requests: [{ type: SOCKET_CONSTANTS.ADD_ANSWER, value: data, isCompleted: false }],
        };
        setSocketListener(result);
    });

    socket.on("get_ice_candidates", (data) => {
        const result = {
            isCompleted: false,
            id: data.pcId,
            requests: [
                {
                    type: SOCKET_CONSTANTS.GET_ICE_CANDIDATE,
                    value: data.candidates,
                    isCompleted: false,
                },
            ],
        };
        setSocketListener(result);
    });

    socket.on(SOCKET_CONSTANTS.AUDIO_TOGGLE, function (this: any, data) {
        if (data.socket !== this.id) {
            const result = {
                isCompleted: false,
                requests: [{ type: SOCKET_CONSTANTS.AUDIO_TOGGLE, value: data, isCompleted: false }],
            };
            setSocketListener(result);
        }
    });

    socket.on("disconnected", function (data) {
        const result = {
            isCompleted: false,
            requests: [{ type: SOCKET_CONSTANTS.DISCONNECTED, value: data, isCompleted: false }],
        };
        setSocketListener(result);
    });
}
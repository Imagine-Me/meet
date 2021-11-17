import { SynchronousTaskManager } from 'synchronous-task-manager';
import { Socket } from "socket.io-client";
import * as SOCKET_CONSTANTS from '../constants/socketConstant';

interface DataType {
    type: string,
    value: any,
    id: string | null
}

export default function addSockets(link: string, socket: Socket, taskQueue: SynchronousTaskManager, setSocketListener: Function) {


    socket.on("connect", () => {
        const socketId = socket.id;
        socket.emit("room", { socketId, meetId: link });
        const data = {
            type: SOCKET_CONSTANTS.INITIATE_CONNECTION,
            value: socketId,
            id: null
        } as DataType;
        taskQueue.add(data);
    });

    socket.on("get_users", (initialUsers: string[]) => {
        initialUsers.forEach((peer) => {
            socket.emit('get_offer', {
                socketFrom: socket.id,
                socketTo: peer
            })
        })
    });

    socket.on("get_offer_request", (data) => {
        const result = {
            value: data,
            id: null,
            type: SOCKET_CONSTANTS.INITIATE_OFFER
        };
        taskQueue.add(result);
    });

    socket.on("get_offer", (data) => {
        const result = {
            id: data.id,
            value: data,
            type: SOCKET_CONSTANTS.INITIATE_ANSWER,
        };
        taskQueue.add(result);
    });

    socket.on("get_answer", function (data) {
        const result = {
            id: data.id,
            value: data,
            type: SOCKET_CONSTANTS.ADD_ANSWER
        };
        taskQueue.add(result);
    });

    socket.on("get_ice_candidates", (data) => {
        const result = {
            id: data.pcId,
            value: data.candidates,
            type: SOCKET_CONSTANTS.GET_ICE_CANDIDATE,
        }
        taskQueue.add(result);
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
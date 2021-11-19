import { SynchronousTaskManager } from 'synchronous-task-manager';
import { Socket } from "socket.io-client";
import * as SOCKET_CONSTANTS from '../constants/socketConstant';
import { PcType } from './Video';

export interface DataType {
    type: string,
    value: any,
    id: string | null
}

export default function addSockets(link: string, socket: Socket, taskQueue: SynchronousTaskManager<PcType[], DataType>) {

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
        } as DataType;
        taskQueue.add(result);
    });

    socket.on("get_offer", (data) => {
        const result = {
            id: data.id,
            value: data,
            type: SOCKET_CONSTANTS.INITIATE_ANSWER,
        } as DataType;
        taskQueue.add(result);
    });

    socket.on("get_answer", function (data) {
        const result = {
            id: data.id,
            value: data,
            type: SOCKET_CONSTANTS.ADD_ANSWER
        } as DataType;
        taskQueue.add(result);
    });

    socket.on("get_ice_candidates", (data) => {
        const result = {
            id: data.pcId,
            value: data.candidates,
            type: SOCKET_CONSTANTS.GET_ICE_CANDIDATE,
        } as DataType;
        taskQueue.add(result);
    });

    socket.on(SOCKET_CONSTANTS.AUDIO_TOGGLE, function (this: any, data) {
        const result = {
            type: SOCKET_CONSTANTS.AUDIO_TOGGLE,
            value: data,
            id: null
        } as DataType;
        taskQueue.add(result)
    });

    socket.on("disconnected", function (data) {
        const result = {
            value: data,
            type: SOCKET_CONSTANTS.DISCONNECTED,
            id: null
        } as DataType;
        taskQueue.add(result);
    });
}
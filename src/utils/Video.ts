import { ConstraintsProps, state } from "../recoil/state";
import { v4 as uuidv4 } from "uuid";
import { SynchronousTaskManager } from "synchronous-task-manager";
import { getPcById } from "./helper";
import { RefObject } from "react";
import * as SOCKET_CONSTANTS from '../constants/socketConstant'
import { DataType } from "./socket";

export interface PcType {
  id: string;
  pc: RTCPeerConnection,
  track: MediaStream | null,
  ice: RTCIceCandidate[]
}

export interface UserDetails {
  name: String;
  audio: boolean;
  socketFrom: null | string;
}


interface AnswerProps {
  audio: boolean;
  id: string;
  name: string;
  sdp: any;
  socketFrom: string;
}



export const getUserStream = async (constraints: ConstraintsProps) => {
  try {
    const c = {
      video: constraints.video,
      audio: true,
    };
    const stream = await navigator.mediaDevices.getUserMedia(c);
    return stream;
  } catch (e) { }
};

export const initiatePeerConnection = () => {
  try {
    const connection = new RTCPeerConnection();
    return connection;
  } catch {
    throw new Error("CANT CONNECT PEER CONNECTION");
  }
};

export const createOffer = async (pc: RTCPeerConnection) => {
  console.log("CREATED OFFER");
  const sdp = await pc.createOffer({
    offerToReceiveVideo: true,
    offerToReceiveAudio: true,
  })
  await pc.setLocalDescription(sdp);
  return pc;
};

export const addRemoteDescription = async (pc: RTCPeerConnection, sdp: any) => {
  return await pc.setRemoteDescription(new RTCSessionDescription(sdp));
};

export const answerOffer = async (pc: RTCPeerConnection) => {
  const sdp = await pc.createAnswer({
    offerToReceiveVideo: true,
    offerToReceiveAudio: true,
  })
  await pc.setLocalDescription(sdp);
  return pc;
};

export const addIceCandidate = (pc: RTCPeerConnection, candidates: RTCIceCandidate[]) => {
  console.log('ADDING TO ', pc, 'CANDIDATES', candidates);
  candidates.forEach((candidate: any) =>
    pc.addIceCandidate(new RTCIceCandidate(candidate))
  );
};
// export const addTracksToVideo = (ref: RefObject<HTMLVideoElement>, stream: MediaStream) => {
//   if (ref.current)
//     ref.current.srcObject = stream;
// };


const setUpPeer = (pcId: string, stream: MediaStream, taskQueue: SynchronousTaskManager<PcType[], DataType>) => {
  const pc = initiatePeerConnection();
  if (!pc || !stream)
    throw new Error(`SOME ISSUE WITH PC OR STREAM, ${pc}, ${stream}`);

  stream
    .getTracks()
    .forEach((track) => pc.addTrack(track, stream));

  pc.ontrack = (e) => {
    console.log('GOT A TRACK', taskQueue.state);
    taskQueue.setState((prev) => {
      if (prev) {
        return prev.map(element => {
          if (element.id === pcId) {
            const temp = { ...element }
            temp.track = e.streams[0]
            return temp;
          }
          return element;
        })
      }
      return []
    })
  };
  return pc;
}


export const initiateOffer = async (socketTo: string, userDetails: UserDetails, stream: MediaStream | null, taskQueue: SynchronousTaskManager<PcType[], DataType>) => {
  if (!stream)
    throw new Error(`EMPTY STREAM ${stream}`);


  const pcId = uuidv4();
  const pc = setUpPeer(pcId, stream, taskQueue);

  const candidates: RTCIceCandidate[] = [];
  pc.onicecandidate = (e) => {
    if (e.candidate) {
      candidates.push(e.candidate);
    } else {
      const candidateData = {
        socketId: socketTo,
        pcId: pcId,
        candidates,
      };
      taskQueue.add({
        type: SOCKET_CONSTANTS.SEND_ICE,
        value: candidateData,
        id: null
      })

    }
  };


  await createOffer(pc);
  const peerConnection = {
    id: pcId,
    pc,
    track: null,
    ice: []
  } as PcType;

  taskQueue.setState((prev) => {
    if (Array.isArray(prev)) {
      const temp = [...prev];
      temp.push(peerConnection)
      return temp;
    }
    return [peerConnection]
  })
  const offerData = {
    ...userDetails,
    id: pcId,
    socketTo,
    sdp: pc.localDescription
  }

  return offerData;
};


export const initiateAnswer = async (userDetails: UserDetails, data: AnswerProps, stream: MediaStream | null, taskQueue: SynchronousTaskManager<PcType[], DataType>) => {
  if (!stream) {
    throw new Error(`STREAM IS EMPTY ${stream}`);

  }
  const pc = setUpPeer(data.id, stream, taskQueue);
  const peerConnection = {
    id: data.id,
    pc,
    track: null
  } as PcType;

  taskQueue.setState((prev) => {
    if (Array.isArray(prev)) {
      const temp = [...prev];
      temp.push(peerConnection)
    }
    return [peerConnection];
  })

  try {
    await addRemoteDescription(pc, data.sdp);
    await answerOffer(pc);
  } catch (err) {
    throw new Error("ERROR WHILE ADDING ANSWER");
  }



  const answerData = {
    ...userDetails,
    id: data.id,
    socketTo: data.socketFrom,
    sdp: pc.localDescription
  }

  return answerData;
};

export const addAnswer = async (data: AnswerProps, pc: RTCPeerConnection) => {
  const sdp = data.sdp;
  try {
    await addRemoteDescription(pc, sdp);
  } catch {
    throw new Error("COULDNT ADD ANSWER");
  }
};
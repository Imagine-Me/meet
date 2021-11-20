import { ConstraintsProps } from "../recoil/state";
import { v4 as uuidv4 } from "uuid";
import { SynchronousTaskManager } from "synchronous-task-manager";
import * as SOCKET_CONSTANTS from '../constants/socketConstant'
import { DataType } from "./socket";

export interface PcType {
  id: string;
  pc: RTCPeerConnection,
  track: MediaStream | null,
  name: string,
  audio: boolean,
  color: string,
  video: boolean,
  socketId: string,
  videoSender: RTCRtpSender | null
}

export interface UserDetails {
  name: String;
  audio: boolean;
  video: boolean;
  socketFrom: null | string;
}


interface AnswerProps {
  audio: boolean;
  id: string;
  name: string;
  sdp: any;
  socketFrom: string;
  video: boolean;
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
  candidates.forEach((candidate: any) =>
    pc.addIceCandidate(new RTCIceCandidate(candidate))
  );
};

export const addTracksToPc = (pc: RTCPeerConnection, stream: MediaStream, prevVideoSender?: RTCRtpSender | null) => {

  let videoSender: RTCRtpSender | null = prevVideoSender ?? null;
  const videoTrack = stream.getVideoTracks();
  const audioTrack = stream.getAudioTracks();

  pc.addTrack(audioTrack[0], stream);

  if (videoTrack.length > 0) {
    videoSender = pc.addTrack(videoTrack[0], stream)
  } else if (videoSender) {
    pc.removeTrack(videoSender);
  }
  return videoSender;
}


const setUpPeer = (pcId: string, stream: MediaStream, taskQueue: SynchronousTaskManager<PcType[], DataType>) => {
  const pc = initiatePeerConnection();
  if (!pc || !stream)
    throw new Error(`SOME ISSUE WITH PC OR STREAM, ${pc}, ${stream}`);

  const videoSender = addTracksToPc(pc, stream);

  pc.ontrack = (e) => {

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
  return { pc, videoSender };
}


export const initiateOffer = async (socketTo: string, userDetails: UserDetails, stream: MediaStream | null, taskQueue: SynchronousTaskManager<PcType[], DataType>) => {
  if (!stream)
    throw new Error(`EMPTY STREAM ${stream}`);


  const pcId = uuidv4();
  const { pc, videoSender } = setUpPeer(pcId, stream, taskQueue);

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
        id: pcId
      })

    }
  };


  await createOffer(pc);
  const peerConnection = {
    id: pcId,
    pc,
    track: null,
    name: '',
    audio: true,
    video: true,
    socketId: socketTo,
    videoSender,
    color: `#${(Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0')}`
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

export const renegotiateOffer = async (pc: PcType, userDetails: UserDetails) => {

  await createOffer(pc.pc);
  const offerData = {
    ...userDetails,
    id: pc.id,
    socketTo: pc.socketId,
    sdp: pc.pc.localDescription
  }
  return offerData;
}


export const initiateAnswer = async (userDetails: UserDetails, data: AnswerProps, stream: MediaStream | null, taskQueue: SynchronousTaskManager<PcType[], DataType>) => {
  if (!stream) {
    throw new Error(`STREAM IS EMPTY ${stream}`);

  }
  const { pc, videoSender } = setUpPeer(data.id, stream, taskQueue);
  const peerConnection = {
    id: data.id,
    pc,
    track: null,
    name: data.name,
    audio: data.audio,
    video: data.video,
    socketId: data.socketFrom,
    videoSender,
    color: `#${(Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0')}`
  } as PcType;


  taskQueue.setState((prev) => {
    if (Array.isArray(prev)) {
      const temp = [...prev];
      temp.push(peerConnection)
      return temp;
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

export const renegotiateAnswer = async (pc: PcType, data: AnswerProps, userDetails: UserDetails,) => {
  try {
    await addRemoteDescription(pc.pc, data.sdp);
    await answerOffer(pc.pc);
  } catch (err) {
    throw new Error("ERROR WHILE ADDING ANSWER" + err);
  }
  const answerData = {
    ...userDetails,
    id: data.id,
    socketTo: data.socketFrom,
    sdp: pc.pc.localDescription
  }

  return answerData;
}

export const addAnswer = async (data: AnswerProps, pcs: PcType[]) => {
  const sdp = data.sdp;
  let isAlreadyJoined = false;
  try {
    const pc: PcType | undefined = pcs.find(
      (element) => element.id === data.id
    );
    if (pc) {
      if (pc.pc.remoteDescription) {
        isAlreadyJoined = true;
      }
      await addRemoteDescription(pc.pc, sdp);
    }
  } catch {
    throw new Error("COULDNT ADD ANSWER");
  }


  const newPcs = pcs.map((pc) => {
    if (pc.id === data.id) {
      const temp = { ...pc };
      temp.name = data.name;
      temp.audio = data.audio;
      temp.video = data.video;
      return temp;
    }
    return pc;
  })

  return { newPcs, isAlreadyJoined };
};

interface ToggleAudioProps {
  socket: string;
  audio: boolean;
}

interface ToggleVideoProps {
  socket: string;
  video: boolean;
}

export const toggleAudio = (data: ToggleAudioProps, pcs: PcType[]) => {
  return pcs.map((pc) => {
    if (pc.socketId === data.socket) {
      const temp = { ...pc };
      temp.audio = data.audio;
      return temp;
    }
    return pc;
  })
}

export const toggleVideo = (data: ToggleVideoProps, pcs: PcType[]) => {
  return pcs.map((pc) => {
    if (pc.socketId === data.socket) {
      const temp = { ...pc };
      temp.video = data.video;
      return temp;
    }
    return pc;
  })
}

export const disconnect = (socket: string, pcs: PcType[]) => {
  const pc = pcs.find(element => element.socketId === socket);
  let userName = '';
  if (pc) {
    pc.pc.close();
    userName = pc.name;
  }
  const newPc = pcs.filter(element => element.socketId !== socket)
  return { newPc, userName }
}
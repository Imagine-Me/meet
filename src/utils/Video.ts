import { ConstraintsProps } from "../recoil/state";
import { v4 as uuidv4 } from "uuid";
import { SynchronousTaskManager } from "synchronous-task-manager";
import { getPcById } from "./helper";
import { RefObject } from "react";

interface PcType {
  id: string;
  pc: RTCPeerConnection
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

export const addRemoteDescription = (pc: RTCPeerConnection, sdp: any) => {
  return pc.setRemoteDescription(new RTCSessionDescription(sdp));
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
export const addTracksToVideo = (ref: RefObject<HTMLVideoElement>, stream: MediaStream) => {
  if (ref.current)
    ref.current.srcObject = stream;
};


const setUpPeer = (pcId: string, stream: MediaStream, taskQueue: SynchronousTaskManager) => {
  const pc = initiatePeerConnection();
  if (!pc || !stream)
    throw new Error(`SOME ISSUE WITH PC OR STREAM, ${pc}, ${stream}`);

  stream
    .getTracks()
    .forEach((track) => pc.addTrack(track, stream));

  pc.ontrack = (e) => {
    const track = [...taskQueue.state.track];
    const data = {
      id: pcId,
      stream: e.streams[0],
    };
    track.push(data);
    console.log('GOT A TRACK');

    taskQueue.setState((prev) => ({
      ...prev,
      track
    }))
  };
  return pc;
}


export const initiateOfferNew = async (socketId: string, stream: MediaStream, taskQueue: SynchronousTaskManager) => {
  const pcId = uuidv4();
  const pc = setUpPeer(pcId, stream, taskQueue);

  const candidates: RTCIceCandidate[] = [];
  pc.onicecandidate = (e) => {
    if (e.candidate) {
      candidates.push(e.candidate);
    } else {
      const result = {
        pcId,
        candidates,
        isCompleted: false,
        socketId,
      };
      console.log('GOT SOME ICE', result);

      const ice = [...taskQueue.state.ice];
      ice.push(result);
      taskQueue.setState((prev) => ({
        ...prev,
        ice
      }))

    }
  };


  await createOffer(pc);
  const peerConnection = {
    id: pcId,
    pc,
  } as PcType;

  return peerConnection;
};

interface AnswerProps {
  audio: boolean;
  id: string;
  name: string;
  sdp: any;
  socketFrom: string;
}


export const initiateAnswersNew = async (data: AnswerProps, stream: MediaStream, taskQueue: SynchronousTaskManager) => {
  const pc = setUpPeer(data.id, stream, taskQueue);

  try {
    await addRemoteDescription(pc, data.sdp);
    await answerOffer(pc);
  } catch (err) {
    console.error("An error occurred", err);
  }

  const peerConnections = [...taskQueue.state.pc];
  const peerConnection = {
    id: data.id,
    pc,
  } as PcType;
  peerConnections.push(peerConnection);
  taskQueue.setState((prev) => ({
    ...prev,
    pc: peerConnections
  }))
  return peerConnection;
};

export const addAnswerNew = (data: AnswerProps, taskQueue: SynchronousTaskManager) => {
  const pcId = data.id;
  const sdp = data.sdp;
  taskQueue.state.pc.forEach(async (pc: PcType) => {
    if (pc.id === pcId) {
      try {
        await addRemoteDescription(pc.pc, sdp);
      } catch {
        throw new Error("COULDNT ADD ANSWER");
      }
    }
  });
};
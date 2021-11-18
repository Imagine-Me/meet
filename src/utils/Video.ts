import { ConstraintsProps, state } from "../recoil/state";
import { v4 as uuidv4 } from "uuid";
import { SynchronousTaskManager } from "synchronous-task-manager";
import { getPcById } from "./helper";
import { RefObject } from "react";
import * as SOCKET_CONSTANTS from '../constants/socketConstant'

interface PcType {
  id: string;
  pc: RTCPeerConnection,
  track: MediaStream | null,
  ice: RTCIceCandidate[] | null
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


const setUpPeer = (pcId: string, stream: MediaStream, taskQueue: SynchronousTaskManager, ref: RefObject<HTMLVideoElement>, setPc: Function) => {
  const pc = initiatePeerConnection();
  if (!pc || !stream)
    throw new Error(`SOME ISSUE WITH PC OR STREAM, ${pc}, ${stream}`);

  stream
    .getTracks()
    .forEach((track) => pc.addTrack(track, stream));

  pc.ontrack = (e) => {
    // const track = [...taskQueue.state.track];
    // const data = {
    //   id: pcId,
    //   stream: e.streams[0],
    // };
    // if (ref.current)
    //   ref.current.srcObject = e.streams[0]
    // track.push(data);
    // console.log('GOT A TRACK');

    // taskQueue.setState((prev) => ({
    //   ...prev,
    //   track
    // }))
    setPc((prev: PcType[]) => {
      return prev.map(state => {
        if (state.id === pcId) {
          const tempData = { ...state }
          tempData.track = e.streams[0];
          return tempData;
        }
        return state;
      })
    })

  };
  return pc;
}


export const initiateOfferNew = async (socketId: string, stream: MediaStream, taskQueue: SynchronousTaskManager, ref: RefObject<HTMLVideoElement>, setPc: Function) => {
  const pcId = uuidv4();
  const pc = setUpPeer(pcId, stream, taskQueue, ref, setPc);

  const candidates: RTCIceCandidate[] = [];
  pc.onicecandidate = (e) => {
    if (e.candidate) {
      candidates.push(e.candidate);
    } else {
      taskQueue.add({
        id: pcId,
        type: SOCKET_CONSTANTS.SEND_ICE,
        value: {
          candidates,
          pcId,
          socketId
        }
      })

    }
  };


  await createOffer(pc);
  const peerConnection = {
    id: pcId,
    pc,
    track: null
  } as PcType;

  setPc((prev: PcType[]) => {
    const temp = [...prev];
    temp.push(peerConnection)
    return temp;
  })

  return peerConnection;
};

interface AnswerProps {
  audio: boolean;
  id: string;
  name: string;
  sdp: any;
  socketFrom: string;
}


export const initiateAnswersNew = async (data: AnswerProps, stream: MediaStream, taskQueue: SynchronousTaskManager, ref: RefObject<HTMLVideoElement>, setPc: Function) => {
  const pc = setUpPeer(data.id, stream, taskQueue, ref, setPc);

  try {
    await addRemoteDescription(pc, data.sdp);
    await answerOffer(pc);
  } catch (err) {
    console.error("An error occurred", err);
  }

  const peerConnection = {
    id: data.id,
    pc,
    track: null
  } as PcType;

  setPc((prev: PcType[]) => {
    const temp = [...prev];
    temp.push(peerConnection)
    return temp;
  })
  return peerConnection;
};

export const addAnswerNew = async (data: AnswerProps, pc: RTCPeerConnection) => {
  const sdp = data.sdp;
  try {
    await addRemoteDescription(pc, sdp);
  } catch {
    throw new Error("COULDNT ADD ANSWER");
  }
};
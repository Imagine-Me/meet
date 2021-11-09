import { ConstraintsProps } from "../recoil/state";


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
  } catch { }
};

export const createOffer = (pc: any) => {
  console.log("CREATED OFFER");
  return pc
    .createOffer({
      offerToReceiveVideo: true,
      offerToReceiveAudio: true,
    })
    .then((sdp: any) => pc.setLocalDescription(sdp));
};

export const addRemoteDescription = (pc: any, sdp: any) => {
  return pc.setRemoteDescription(new RTCSessionDescription(sdp));
};

export const answerOffer = (pc: any) => {
  return pc
    .createAnswer({
      offerToReceiveVideo: true,
      offerToReceiveAudio: true,
    })
    .then((sdp: any) => pc.setLocalDescription(sdp));
};

export const addIceCandidate = (pc: any, candidates: any) => {
  candidates.forEach((candidate: any) =>
    pc.addIceCandidate(new RTCIceCandidate(candidate))
  );
};
export const addTracksToVideo = (ref: any, stream: any) => {
  ref.current.srcObject = stream;
};

export const getUserStream = async (constraints) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return stream;
  } catch (e) {}
};

export const initiatePeerConnection = () => {
  try {
    const configuration = {
      iceServers: [{ urls: "stun:stun2.1.google.com:19302" }],
    };
    const connection = new RTCPeerConnection();
    return connection;
  } catch {}
};

export const createOffer = (pc) => {
  return pc.createOffer();
};

export const addRemoteDescription = (pc, sdp) => {
  return pc.setRemoteDescription(new RTCSessionDescription(sdp));
};

export const answerOffer = (pc) => {
  return pc.createAnswer();
};


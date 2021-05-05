export const getUserStream = async (constraints) => {
  try {
    const c = {
      video: constraints.video,
      audio: true,
    };
    const stream = await navigator.mediaDevices.getUserMedia(c);
    return stream;
  } catch (e) {}
};

export const initiatePeerConnection = () => {
  try {
    const connection = new RTCPeerConnection();
    return connection;
  } catch {}
};

export const createOffer = (pc) => {
  console.log("CREATED OFFER");
  return pc
    .createOffer({
      offerToReceiveVideo: true,
      offerToReceiveAudio: true,
    })
    .then((sdp) => pc.setLocalDescription(sdp));
};

export const addRemoteDescription = (pc, sdp) => {
  return pc.setRemoteDescription(new RTCSessionDescription(sdp));
};

export const answerOffer = (pc) => {
  return pc
    .createAnswer({
      offerToReceiveVideo: true,
      offerToReceiveAudio: true,
    })
    .then((sdp) => pc.setLocalDescription(sdp));
};

export const addIceCandidate = (pc, candidates) => {
  candidates.forEach((candidate) =>
    pc.addIceCandidate(new RTCIceCandidate(candidate))
  );
};
export const addTracksToVideo = (ref, stream) => {
  ref.current.srcObject = stream;
};

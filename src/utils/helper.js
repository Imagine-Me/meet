export const updatePcRequestArray = (pcRequestQueue, index, type) => {
  return pcRequestQueue.map((pr, i) => {
    if (index === i) {
      const requests = [...pr.requests];
      const updatedRequests = requests.map((request) => {
        if (request.type === type) {
          const updatedRequest = { ...request };
          updatedRequest.isCompleted = true;
          return updatedRequest;
        }
        return request;
      });
      const updatedData = { ...pr };
      updatedData.requests = updatedRequests;
      return updatedData;
    }
    return pr;
  });
};

export const completePcRequestArray = (pcRequestQueue, index) => {
  return pcRequestQueue.map((pr, i) => {
    if (index === i) {
      const updatedData = { ...pr };
      updatedData.isCompleted = true;
      return updatedData;
    }
    return pr;
  });
};

export const updatePcBeforeSendingOffer = (
  peerConnection,
  pc,
  socketId,
  user
) => {
  const data = {
    socketTo: peerConnection.socket,
    sdp: peerConnection.sdp,
    id: peerConnection.id,
    socketFrom: socketId,
    name: user.name,
    photo: user.photo,
  };
  const newPc = pc.map((peer) => {
    if (peer.socket === peerConnection.socket) {
      const p = { ...peer };
      p.isCompleted = true;
      return p;
    }
    return peer;
  });
  return { data, newPc };
};

export const getPcById = (pc, id) => {
  const peer = pc.filter((p) => p.id === id);
  return peer?.[0].pc;
};

export const addUserDetailToPC = (pc, id, name, photo) => {
  return pc.map((p) => {
    if (p.id === id) {
      const temp = { ...p };
      temp.name = name;
      temp.photo = photo;
      return temp;
    }
    return p;
  });
};

export const getPcBySocketId = (pc, socketId) => {
  const peer = pc.filter((p) => p.socket === socketId);
  return peer?.[0].pc;
};

export const setPcRequestQueueCompletedArray = (pcRequestQueue, pcId) => {
  return pcRequestQueue.map((pr) => {
    if (pr.id === pcId) {
      const prCopy = { ...pr };
      prCopy.isCompleted = true;
      return prCopy;
    }
    return pr;
  });
};

export const removeConnection = (pc, socketId) => {
  const peer = getPcBySocketId(pc, socketId);
  peer.close();
  return pc.filter((pc) => pc.socket !== socketId);
};

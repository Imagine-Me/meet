import { atom } from "recoil";

export const state = atom({
  key: "state",
  default: {
    stream: null,
    constraints: {
      audio: false,
      video: false,
    },
    link: null,
    pc: null,
  },
});

export const user = atom({
  key: "user",
  default: {
    firebase: null,
    isAuthenticated: false,
    name: null,
    email: null,
    socketId: null,
  },
});

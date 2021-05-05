import { atom } from "recoil";

export const state = atom({
  key: "state",
  default: {
    stream: null,
    constraints: {
      audio: true,
      video: false,
    },
    link: null,
    pc: [],
  },
});

export const user = atom({
  key: "user",
  default: {
    firebase: null,
    isAuthenticated: false,
    name: null,
    email: null,
    photo: null,
    socketId: null,
  },
});

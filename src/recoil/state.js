import { atom } from "recoil";

export const state = atom({
  key: "state",
  default: {
    stream: null,
    constraints: {
      audio: false,
      video: false,
    },
  },
});

export const user = atom({
  key: "user",
  default: {
    firebase: null,
    isAuthenticated: false,
  },
});

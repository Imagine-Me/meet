import { atom } from "recoil";

export interface ConstraintsProps{
  audio: boolean,
  video: boolean
}

interface stateProps{
  constraints: ConstraintsProps,
  stream: any,
  link: any,
  pc: Array<any>
}

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
  } as stateProps,
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

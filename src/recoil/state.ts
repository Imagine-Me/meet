import { atom } from "recoil";

export interface ConstraintsProps {
  audio: boolean,
  video: boolean
}

export interface StateProps {
  constraints: ConstraintsProps,
  stream: MediaStream | null,
  link: any,
  pc: Array<any>
}

export interface UserProps {
  isAuthenticated: boolean,
  name: string,
  socketId: null | string
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
  } as StateProps,
});

export const user = atom({
  key: "user",
  default: {
    isAuthenticated: false,
    name: '',
    socketId: null,
  } as UserProps,
});

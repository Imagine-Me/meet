import { atom } from "recoil";

export interface ConstraintsProps {
  audio: boolean,
  video: boolean
}

interface StateProps {
  constraints: ConstraintsProps,
  stream: any,
  link: any,
  pc: Array<any>
}

interface UserProps {
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

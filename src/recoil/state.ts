import { atom } from "recoil";

export interface ConstraintsProps {
  audio: boolean,
  video: boolean
}

interface StateProps {
  constraints: ConstraintsProps,
  stream: MediaStream | null,
  link: any,
}

interface UserProps {
  isAuthenticated: boolean,
  name: string,
}

interface SnackbarProps {
  message: string,
  show: boolean;
  type: SnackType;
}

type SnackType = "error" | "warning" | "info" | "success";

export const state = atom({
  key: "state",
  default: {
    stream: null,
    constraints: {
      audio: true,
      video: false,
    },
    link: null,
  } as StateProps,
});

export const user = atom({
  key: "user",
  default: {
    isAuthenticated: false,
    name: '',
  } as UserProps,
});


export const snackbar = atom({
  key: "snackbar",
  default: {
    show: false,
    message: '',
    type: 'success'
  } as SnackbarProps,
});

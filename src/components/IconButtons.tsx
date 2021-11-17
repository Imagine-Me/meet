import { IconButton } from "./Button";
import { BsCameraVideo, BsCameraVideoOff } from "react-icons/bs";

import { AiOutlineAudio, AiOutlineAudioMuted } from "react-icons/ai";

interface Props {
  on: boolean;
  clickHandler: () => null;
}

export const VideoButton = ({ on, clickHandler }: Props) => {
  return (
    <IconButton isSmall={false} onClick={clickHandler} on={on}>
      {on ? (
        <BsCameraVideo size={16} color="black" />
      ) : (
        <BsCameraVideoOff size={16} color="white" />
      )}
    </IconButton>
  );
};

export const AudioButton = ({ on, clickHandler }: Props) => {
  return (
    <IconButton isSmall={false} onClick={clickHandler} on={on}>
      {on ? (
        <AiOutlineAudio size={16} color="black" />
      ) : (
        <AiOutlineAudioMuted size={16} color="white" />
      )}
    </IconButton>
  );
};

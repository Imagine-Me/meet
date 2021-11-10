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
        <BsCameraVideo color="black" />
      ) : (
        <BsCameraVideoOff color="white" />
      )}
    </IconButton>
  );
};

export const AudioButton = ({ on, clickHandler }: Props) => {
  return (
    <IconButton isSmall={false} onClick={clickHandler} on={on}>
      {on ? (
        <AiOutlineAudio color="black" />
      ) : (
        <AiOutlineAudioMuted color="white" />
      )}
    </IconButton>
  );
};

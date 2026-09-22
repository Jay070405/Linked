import { createContext, useContext, useRef } from 'react';
import useBackgroundMusic from './useBackgroundMusic';

const MusicContext = createContext(null);
export const useMusic = () => useContext(MusicContext);

export default function BackgroundMusic({ children }) {
  const audioRef = useRef(null);
  const music = useBackgroundMusic(audioRef);
  return <MusicContext.Provider value={music}>
    <audio ref={audioRef} className="music-audio" src="/assets/audio/clear-day-melody.mp3" preload="metadata" loop aria-hidden="true" />
    {children}
  </MusicContext.Provider>;
}

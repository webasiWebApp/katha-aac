// Public API of the audio feature. Other features import ONLY from here.
export { AdultDot, type AdultDotProps } from './ui/AdultDot';
export {
  createAudioService,
  sequenceKey,
  type AudioPlatform,
  type AudioService,
  type ClipMaps,
  type SpeakContext,
  type SpeakResult,
  type VoiceStatus,
} from './domain/audioService';
export { getAudioService } from './data/audioInstance';
export { devicePlatformSpeak, TEST_SENTENCE } from './data/testSpeak';

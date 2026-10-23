import { MotionConfig } from 'motion/react';
import { useSettings } from '../../context/SettingsContext';

/** Respects the OS "reduce motion" setting, or the in-app switch in Settings. */
export default function MotionRoot({ children }) {
  const { reduceMotion } = useSettings();
  return <MotionConfig reducedMotion={reduceMotion ? 'always' : 'user'}>{children}</MotionConfig>;
}

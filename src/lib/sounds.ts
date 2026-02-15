import { zzfx } from './zzfx';
import { $settings } from '../store/settingsStore';

// Helper to get volume-adjusted zzfx call
const playWithVolume = (...params: Parameters<typeof zzfx>) => {
  const volume = $settings.get().soundVolume / 100;
  if (volume === 0) return; // Don't play if muted
  const adjustedParams = [...params] as Parameters<typeof zzfx>;
  adjustedParams[0] = (params[0] || 1) * volume; // Adjust volume (first parameter)
  zzfx(...adjustedParams);
};

// ZzFX - Zuper Zmall Zound Zynth - Micro Editiontps://killedbyapixel.github.io/ZzFX/
export const playSound = {
    click: () => playWithVolume(1,.05,1596,0,.01,.1,0,1,0,0,0,0,0,0,0,0,0,.5,.07,0), // High click
    pop: () => playWithVolume(1,.05,373,0,.03,.01,2,3,0,0,0,0,0,0,0,0,0,.55,.02,0), // Pop / Pick up
    place: () => playWithVolume(1,.05,224,0,.06,.09,2,0.8,0,0,0,0,0,.3,0,0,0,.47,.08,0), // Thud / Place
    rotate: () => playWithVolume(1,.05,537,0,.01,.1,0,1,0,0,0,0,0,0,0,0,0,.5,.07,0), // Mechanical tick
    error: () => playWithVolume(1,.05,157,0,.04,.16,3,2.6,-8.7,0,0,0,0,1,0,0,0,.61,.04,0), // Buzz
    
    combatHit: () => playWithVolume(1,.05,126,.02,.07,.19,3,2.8,-5.5,0,0,0,0,1.2,0,0.1,0,.43,.04,0), // Punch
    combatBlock: () => playWithVolume(1,.05,622,0,.02,.12,0,1.6,0,0,0,0,0,0.5,0,0,0,.5,.07,0), // Metal clang
    combatMiss: () => playWithVolume(1,.05,958,0,.03,.08,4,1.8,0,0,0,0,0,0.5,0,0,0,.68,.03,0), // Swoosh

    fanfare: () => {
         // Simple arpeggio
         setTimeout(() => playWithVolume(1,.05,261,0,.1,.3,0,1,0,0,0,0,0,0,0,0,0,.5,.2,0), 0);
         setTimeout(() => playWithVolume(1,.05,329,0,.1,.3,0,1,0,0,0,0,0,0,0,0,0,.5,.2,0), 100);
         setTimeout(() => playWithVolume(1,.05,392,0,.1,.3,0,1,0,0,0,0,0,0,0,0,0,.5,.2,0), 200);
         setTimeout(() => playWithVolume(1,.05,523,0,.1,.5,0,1,0,0,0,0,0,0,0,0,0,.5,.4,0), 300);
    },

    defeat: () => {
         setTimeout(() => playWithVolume(1,.05,200,0,.4,.6,1,0,0,0,0,0,0,0,0,0,0,.5,.2,0), 0);
         setTimeout(() => playWithVolume(1,.05,150,0,.4,.8,1,0,0,0,0,0,0,0,0,0,0,.5,.4,0), 400);
    }
};

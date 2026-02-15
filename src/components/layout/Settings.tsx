import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { useStore } from '@nanostores/react';
import { $settings, setSoundVolume, setMusicVolume, setDifficulty, setGameDuration, toggleReducedMotion, resetSettings } from '../../store/settingsStore';
import clsx from 'clsx';

const Settings: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const settings = useStore($settings);

  return (
    <>
      {/* Settings Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.1 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 left-8 z-50 bg-slate-700 hover:bg-slate-600 text-white rounded-full p-4 shadow-lg hover:shadow-slate-500/50 transition-all"
        aria-label="Open settings"
      >
        <LucideIcons.Settings size={28} />
      </motion.button>

      {/* Settings Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full border-2 border-slate-700 overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-slate-700 to-slate-600 p-6 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-full">
                    <LucideIcons.Settings size={32} className="text-white" />
                  </div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-wider">
                    Settings
                  </h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
                >
                  <LucideIcons.X size={24} />
                </button>
              </div>

              {/* Content */}
              <div className="p-8 space-y-8">
                {/* Audio Settings */}
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <LucideIcons.Volume2 size={24} className="text-blue-400" />
                    <h3 className="text-xl font-bold text-white uppercase tracking-wider">Audio</h3>
                  </div>

                  {/* Sound Volume */}
                  <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-slate-300 font-semibold flex items-center gap-2">
                        <LucideIcons.Volume className="text-slate-400" size={18} />
                        Sound Effects
                      </label>
                      <span className="text-slate-400 font-mono text-sm">{settings.soundVolume}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.soundVolume}
                      onChange={(e) => setSoundVolume(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>

                  {/* Music Volume */}
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-slate-300 font-semibold flex items-center gap-2">
                        <LucideIcons.Music className="text-slate-400" size={18} />
                        Music
                      </label>
                      <span className="text-slate-400 font-mono text-sm">{settings.musicVolume}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.musicVolume}
                      onChange={(e) => setMusicVolume(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                </section>

                {/* Game Settings */}
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <LucideIcons.Gamepad2 size={24} className="text-green-400" />
                    <h3 className="text-xl font-bold text-white uppercase tracking-wider">Game</h3>
                  </div>

                  {/* Difficulty */}
                  <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
                    <label className="text-slate-300 font-semibold mb-3 block">Difficulty</label>
                    <div className="flex gap-3">
                      {(['easy', 'normal', 'hard'] as const).map((diff) => (
                        <button
                          key={diff}
                          onClick={() => setDifficulty(diff)}
                          className={clsx(
                            'flex-1 py-3 rounded-lg font-bold uppercase text-sm transition-all',
                            settings.gameDifficulty === diff
                              ? 'bg-green-600 text-white shadow-lg scale-105'
                              : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                          )}
                        >
                          {diff === 'easy' && '🟢 Easy'}
                          {diff === 'normal' && '🟡 Normal'}
                          {diff === 'hard' && '🔴 Hard'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Game Duration */}
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <label className="text-slate-300 font-semibold mb-3 block">Game Duration</label>
                    <div className="flex gap-3">
                      {([3, 5, 7] as const).map((days) => (
                        <button
                          key={days}
                          onClick={() => setGameDuration(days)}
                          className={clsx(
                            'flex-1 py-3 rounded-lg font-bold transition-all',
                            settings.gameDuration === days
                              ? 'bg-blue-600 text-white shadow-lg scale-105'
                              : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                          )}
                        >
                          <div className="text-2xl">{days}</div>
                          <div className="text-xs uppercase tracking-wider">Days</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Accessibility */}
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <LucideIcons.Eye size={24} className="text-purple-400" />
                    <h3 className="text-xl font-bold text-white uppercase tracking-wider">Accessibility</h3>
                  </div>

                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <label className="flex items-center justify-between cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <LucideIcons.Wind className="text-slate-400 group-hover:text-purple-400 transition-colors" size={20} />
                        <div>
                          <div className="text-slate-300 font-semibold">Reduced Motion</div>
                          <div className="text-slate-500 text-xs">Minimize animations</div>
                        </div>
                      </div>
                      <button
                        onClick={toggleReducedMotion}
                        className={clsx(
                          'w-14 h-8 rounded-full transition-all relative',
                          settings.reducedMotion ? 'bg-purple-600' : 'bg-slate-700'
                        )}
                      >
                        <div
                          className={clsx(
                            'w-6 h-6 bg-white rounded-full absolute top-1 transition-all',
                            settings.reducedMotion ? 'left-7' : 'left-1'
                          )}
                        />
                      </button>
                    </label>
                  </div>
                </section>

                {/* Reset Button */}
                <div className="pt-4 border-t border-slate-700">
                  <button
                    onClick={() => {
                      if (confirm('Reset all settings to default?')) {
                        resetSettings();
                      }
                    }}
                    className="w-full py-3 bg-red-600/20 hover:bg-red-600/30 border-2 border-red-600 text-red-400 font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <LucideIcons.RotateCcw size={18} />
                    Reset to Default
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-slate-900/50 p-6 border-t border-slate-700 flex justify-end">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Settings;

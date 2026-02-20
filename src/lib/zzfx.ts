// ZzFX - Zuper Zmall Zound Zynth - Micro Edition
// MIT License - Copyright 2019 Frank Force
// https://github.com/KilledByAPixel/ZzFX

// This is a minified/compact version adapted for TypeScript

const zzfxV = 0.3
const zzfxR = 44100
let zzfxX: AudioContext | undefined

export const zzfx = (...parameters: (number | undefined)[]) => {
  if (!zzfxX)
    zzfxX = new (window.AudioContext || (window as any).webkitAudioContext)()

  let [
    volume = 1,
    randomness = 0.05,
    frequency = 220,
    attack = 0,
    sustain = 0,
    release = 0.1,
    shape = 0,
    shapeCurve = 1,
    slide = 0,
    deltaSlide = 0,
    pitchJump = 0,
    pitchJumpTime = 0,
    repeatTime = 0,
    noise = 0,
    modulation = 0,
    bitCrush = 0,
    delay = 0,
    sustainVolume = 1,
    decay = 0,
    tremolo = 0,
  ] = parameters

  // init parameters
  // biome-ignore lint/style/useSingleVarDeclarator: <explanation>
    let PI2 = Math.PI * 2,
    sign = (v: number) => (v > 0 ? 1 : -1),
    // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
    startSlide = (slide *= (500 * PI2) / zzfxR / zzfxR),
    // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
    startFrequency = (frequency *=
      ((1 + randomness * 2 * Math.random() - randomness) * PI2) / zzfxR),
    b: any[] = [],
    t = 0,
    tm = 0,
    i = 0,
    j = 1,
    r = 0,
    c = 0,
    s = 0,
    // biome-ignore lint/suspicious/noImplicitAnyLet: <explanation>
    f,
    length

  // scale by sample rate
  attack = attack * zzfxR + 9 // minimum attack to prevent pop
  decay *= zzfxR
  sustain *= zzfxR
  release *= zzfxR
  delay *= zzfxR
  deltaSlide *= (500 * PI2) / zzfxR ** 3
  modulation *= PI2 / zzfxR
  pitchJump *= PI2 / zzfxR
  pitchJumpTime *= zzfxR
  repeatTime = repeatTime * zzfxR

  // generate waveform and post-processing
  for (
    length = (attack + decay + sustain + release + delay) | 0;
    i < length;
    b[i++] = s
  ) {
    if (!(++c % ((bitCrush * 100) | 0))) {
      // bit crush
      s = shape
        ? shape > 1
          ? shape > 2
            ? shape > 3
              ? // wave shape
                Math.sin((t % PI2) ** 3)
              : // 4 noise
                Math.max(Math.min(Math.tan(t), 1), -1)
            : // 3 tan
              1 - (((((2 * t) / PI2) % 2) + 2) % 2)
          : // 2 saw
            1 - 4 * Math.abs(Math.round(t / PI2) - t / PI2)
        : // 1 triangle
          Math.sin(t) // 0 sin

      s =
        (repeatTime
          ? 1 - tremolo + tremolo * Math.sin((PI2 * i) / repeatTime) // tremolo
          : 1) *
        sign(s) *
        Math.abs(s) ** shapeCurve * // curve 0=square, 2=pointy
        volume *
        zzfxV * // envelope
        (i < attack
          ? i / attack
          : // attack
            i < attack + decay
            ? // decay
              1 - ((i - attack) / decay) * (1 - sustainVolume)
            : // decay_falloff
              i < attack + decay + sustain
              ? // sustain
                sustainVolume
              : // sustain_volume
                i < length - delay
                ? // release
                  ((length - i - delay) / release) * // release_falloff
                  sustainVolume
                : // release_volume
                  0) // post_release

      s = delay
        ? s / 2 +
          (delay > i
            ? 0
            : // delay
              (((i < length - delay ? 1 : (length - i) / delay) * // release delay
                b[(i - delay) | 0]) /
                2) *
              1)
        : s // else
    }

    f =
      // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
      (frequency += slide += deltaSlide) * // frequency
      Math.cos(modulation * tm++) // modulation
    t += f - f * noise * (1 - (((Math.sin(i) + 1) * 1e9) % 2)) // noise

    if (j && ++j > pitchJumpTime) {
      // pitch jump
      frequency += pitchJump
      startFrequency += pitchJump
      j = 0
    }

    if (repeatTime && !(++r % repeatTime)) {
      // repeat
      frequency = startFrequency
      slide = startSlide
      j = j || 1
    }
  }

  // copy to audio buffer
  // biome-ignore lint/style/useSingleVarDeclarator: <explanation>
    const buffer = zzfxX.createBuffer(1, length, zzfxR),
    data = buffer.getChannelData(0)
  for (i = 0; i < length; i++) data[i] = b[i]

  // play audio
  const source = zzfxX.createBufferSource()
  source.buffer = buffer
  source.connect(zzfxX.destination)
  source.start()
  return source
}

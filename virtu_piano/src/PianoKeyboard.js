import React, { useState, useEffect, useCallback, useRef } from "react";
import "./PianoKeyboard.css";

// PUBLIC_INTERFACE
export const KEYBOARD_NOTE_MAP = [
  { note: "C4",  label: "C",  key: "Q",  type: "white" },
  { note: "C#4", label: "C#", key: "2",  type: "black" },
  { note: "D4",  label: "D",  key: "W",  type: "white" },
  { note: "D#4", label: "D#", key: "3",  type: "black" },
  { note: "E4",  label: "E",  key: "E",  type: "white" },
  { note: "F4",  label: "F",  key: "R",  type: "white" },
  { note: "F#4", label: "F#", key: "5",  type: "black" },
  { note: "G4",  label: "G",  key: "T",  type: "white" },
  { note: "G#4", label: "G#", key: "6",  type: "black" },
  { note: "A4",  label: "A",  key: "Y",  type: "white" },
  { note: "A#4", label: "A#", key: "7",  type: "black" },
  { note: "B4",  label: "B",  key: "U",  type: "white" }
];

/**
 * Converts a musical note name (e.g. "C4", "A#4") to its corresponding MIDI number.
 */
function noteNameToMidi(note) {
  // C4 = 60, C#4 = 61, ..., B4 = 71
  const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const match = note.match(/^([A-G]#?)(\d)$/);
  if (!match) return 60; // fallback
  const [, n, octaveS] = match;
  const noteIdx = notes.indexOf(n);
  const octave = parseInt(octaveS, 10);
  return 12 * (octave + 1) + noteIdx;
}

/**
 * Returns the frequency for a given note string (A4 = 440Hz).
 */
function noteToFrequency(note) {
  const midi = noteNameToMidi(note);
  return 440 * Math.pow(2, (midi - 69) / 12);
}

const codeToKeyChar = (code) => {
  // Only map uppercase and numbers
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Digit")) return code.slice(5);
  return "";
};

/**
 * Returns the mapped note index (from KEYBOARD_NOTE_MAP) for the given keyboard key.
 * The match is case-insensitive.
 */
function getNoteIndexFromKey(key) {
  if (!key) return -1;
  const upper = key.toUpperCase();
  return KEYBOARD_NOTE_MAP.findIndex((item) => item.key.toUpperCase() === upper);
}

/**
 * Simple synth: maintains one oscillator per note (avoids note overlap during sustained holds).
 */
function useSynth() {
  const audioCtxRef = useRef(null);
  const oscillators = useRef({});
  // Create the audio context on-demand on first use (avoids blocking on initial load)
  function getCtx() {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtxRef.current;
  }
  // PUBLIC_INTERFACE
  function play(note) {
    const ctx = getCtx();
    const freq = noteToFrequency(note);
    if (oscillators.current[note]) {
      return; // Already playing this note.
    }
    const osc = ctx.createOscillator();
    osc.type = "triangle"; // mellow, plucky "piano"-ish
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.23, ctx.currentTime + 0.01); // attack
    gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.18); // decay
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.55); // release (autofade)
    osc.connect(gain);
    gain.connect(ctx.destination);

    // Stop oscillator after ~0.7s (release envelope).
    osc.start();
    osc.stop(ctx.currentTime + 0.62);

    // Cleanup on stop
    osc.onended = () => {
      if (oscillators.current[note] === osc) {
        delete oscillators.current[note];
      }
    };
    oscillators.current[note] = osc;
  }
  // PUBLIC_INTERFACE
  function stop(note) {
    if (oscillators.current[note]) {
      try {
        oscillators.current[note].stop(); // will trigger cleanup
      } catch(e){}
      delete oscillators.current[note];
    }
  }
  return { play, stop };
}

/**
 * PianoKeyboard component renders a horizontal piano keyboard.
 * Handles pointer and keyboard down/up for visual and functional state and audio playback.
 *
 * PUBLIC_INTERFACE
 */
const PianoKeyboard = ({
  onNoteDown, // function(note, index)
  onNoteUp    // function(note, index)
}) => {
  const [activeKeys, setActiveKeys] = useState(new Set());
  const synth = useSynth();

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (e) => {
      const char = codeToKeyChar(e.code);
      const idx = getNoteIndexFromKey(char);
      if (idx !== -1 && !activeKeys.has(idx)) {
        setActiveKeys(prev => new Set(prev).add(idx));
        synth.play(KEYBOARD_NOTE_MAP[idx].note);
        if (onNoteDown) onNoteDown(KEYBOARD_NOTE_MAP[idx].note, idx);
      }
    },
    [activeKeys, onNoteDown, synth]
  );

  const handleKeyUp = useCallback(
    (e) => {
      const char = codeToKeyChar(e.code);
      const idx = getNoteIndexFromKey(char);
      if (idx !== -1) {
        setActiveKeys(prev => {
          const newSet = new Set(prev);
          newSet.delete(idx);
          return newSet;
        });
        synth.stop(KEYBOARD_NOTE_MAP[idx].note);
        if (onNoteUp) onNoteUp(KEYBOARD_NOTE_MAP[idx].note, idx);
      }
    },
    [onNoteUp, synth]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const handlePointerDown = (idx) => {
    setActiveKeys(prev => new Set(prev).add(idx));
    synth.play(KEYBOARD_NOTE_MAP[idx].note);
    if (onNoteDown) onNoteDown(KEYBOARD_NOTE_MAP[idx].note, idx);
  };
  const handlePointerUp = (idx) => {
    setActiveKeys(prev => {
      const newSet = new Set(prev);
      newSet.delete(idx);
      return newSet;
    });
    synth.stop(KEYBOARD_NOTE_MAP[idx].note);
    if (onNoteUp) onNoteUp(KEYBOARD_NOTE_MAP[idx].note, idx);
  };

  // Used so touch events don't stick keys
  const handleGlobalPointerUp = () => {
    setActiveKeys(new Set());
    // Stop all oscillators if any active (supports "release all" for pointer up outside key).
    KEYBOARD_NOTE_MAP.forEach(key => synth.stop(key.note));
  };

  useEffect(() => {
    window.addEventListener("mouseup", handleGlobalPointerUp, false);
    window.addEventListener("touchend", handleGlobalPointerUp, false);
    return () => {
      window.removeEventListener("mouseup", handleGlobalPointerUp, false);
      window.removeEventListener("touchend", handleGlobalPointerUp, false);
    };
  }, []);

  // Only white keys for visual container
  const whiteKeys = KEYBOARD_NOTE_MAP
    .map((key, idx) => ({ ...key, idx }))
    .filter((keyObj) => keyObj.type === "white");

  // Map for correct black key absolute positioning above white keys
  // White key ordering: C D E F G A B (indices in KEYBOARD_NOTE_MAP are 0,2,4,5,7,9,11)
  // Black keys must be absolutely positioned BETWEEN certain white keys
  // There are no black keys between E-F and B-C, matching piano
  const blackKeyPositions = [
    // left as % per white key index
    { note: "C#4", between: [0,1], percent: ((1) / 7) * 100 - 100/14 }, // between C(0) and D(1)
    { note: "D#4", between: [1,2], percent: ((2) / 7) * 100 - 100/14 }, // between D(1) and E(2)
    // No black between E(2)-F(3)
    { note: "F#4", between: [3,4], percent: ((4) / 7) * 100 - 100/14 },
    { note: "G#4", between: [4,5], percent: ((5) / 7) * 100 - 100/14 },
    { note: "A#4", between: [5,6], percent: ((6) / 7) * 100 - 100/14 },
    // No black between B(6)-C(7)
  ];

  return (
    <div className="piano-keyboard-container">
      <div className="piano-white-keys">
        {whiteKeys.map((k, i) => (
          <div
            tabIndex={0}
            key={k.idx}
            className={
              "piano-key white" +
              (activeKeys.has(k.idx) ? " active" : "")
            }
            onMouseDown={() => handlePointerDown(k.idx)}
            onMouseUp={() => handlePointerUp(k.idx)}
            onMouseLeave={() => handlePointerUp(k.idx)}
            onTouchStart={e => { e.preventDefault(); handlePointerDown(k.idx); }}
            onTouchEnd={e => { e.preventDefault(); handlePointerUp(k.idx); }}
            aria-label={k.label}
          >
            <div className="note-label">{k.label}</div>
            <div className="key-label">{k.key}</div>
          </div>
        ))}
        {/* Black keys with correct piano arrangement and positions */}
        {KEYBOARD_NOTE_MAP
          .map((key, idx) => ({ ...key, idx }))
          .filter(k => k.type === "black")
          .map((k) => {
            const posObj = blackKeyPositions.find(bk => bk.note === k.note);
            if(!posObj) return null;
            return (
              <div
                tabIndex={0}
                key={k.idx}
                className={
                  "piano-key black" +
                  (activeKeys.has(k.idx) ? " active" : "")
                }
                style={{
                  left: `calc(${posObj.percent}% - 1vw)`,
                }}
                onMouseDown={e => { e.stopPropagation(); handlePointerDown(k.idx); }}
                onMouseUp={e => { e.stopPropagation(); handlePointerUp(k.idx); }}
                onMouseLeave={e => { e.stopPropagation(); handlePointerUp(k.idx); }}
                onTouchStart={e => { e.preventDefault(); e.stopPropagation(); handlePointerDown(k.idx); }}
                onTouchEnd={e => { e.preventDefault(); e.stopPropagation(); handlePointerUp(k.idx); }}
                aria-label={k.label}
              >
                <div className="note-label">{k.label}</div>
                <div className="key-label">{k.key}</div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default PianoKeyboard;

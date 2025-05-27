import React, { useState, useEffect, useCallback } from "react";
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
 * PianoKeyboard component renders a horizontal piano keyboard.
 * Handles pointer and keyboard down/up for visual and functional state.
 *
 * PUBLIC_INTERFACE
 */
const PianoKeyboard = ({
  onNoteDown, // function(note, index)
  onNoteUp    // function(note, index)
}) => {
  const [activeKeys, setActiveKeys] = useState(new Set());

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (e) => {
      const char = codeToKeyChar(e.code);
      const idx = getNoteIndexFromKey(char);
      if (idx !== -1 && !activeKeys.has(idx)) {
        setActiveKeys(prev => new Set(prev).add(idx));
        if (onNoteDown) onNoteDown(KEYBOARD_NOTE_MAP[idx].note, idx);
      }
    },
    [activeKeys, onNoteDown]
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
        if (onNoteUp) onNoteUp(KEYBOARD_NOTE_MAP[idx].note, idx);
      }
    },
    [onNoteUp]
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
    if (onNoteDown) onNoteDown(KEYBOARD_NOTE_MAP[idx].note, idx);
  };
  const handlePointerUp = (idx) => {
    setActiveKeys(prev => {
      const newSet = new Set(prev);
      newSet.delete(idx);
      return newSet;
    });
    if (onNoteUp) onNoteUp(KEYBOARD_NOTE_MAP[idx].note, idx);
  };

  // Used so touch events don't stick keys
  const handleGlobalPointerUp = () => setActiveKeys(new Set());
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
  // For layered rendering of black keys
  const blackKeys = KEYBOARD_NOTE_MAP
    .map((key, idx) => ({ ...key, idx }))
    .filter((keyObj) => keyObj.type === "black");

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
        {/* Black keys must be layered absolutely and positioned over */}
        {blackKeys.map((k) => {
          // Find position as percent between parent white keys
          // White keys: C D E F G A B (indices in KEYBOARD_NOTE_MAP are 0,2,4,5,7,9,11)
          // Black keys sit between white keys except between E/F and B/C'
          const pos = (() => {
            switch (k.label) {
              case "C#": return 0; // between C(0) and D(1)
              case "D#": return 1;
              case "F#": return 3;
              case "G#": return 4;
              case "A#": return 5;
              default: return null;
            }
          })();
          return (
            <div
              tabIndex={0}
              key={k.idx}
              className={
                "piano-key black" +
                (activeKeys.has(k.idx) ? " active" : "")
              }
              style={{
                left: `calc(${(100/7) * (pos+1) - (100/14)}% - 1vw)`
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

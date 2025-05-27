import React from 'react';
import './App.css';
import PianoKeyboard from "./PianoKeyboard";
import './PianoKeyboard.css';

function App() {
  // Sample handlers for demonstration
  const handleNoteDown = (note, idx) => {
    // TODO: trigger audio playback (future)
    // For now, just log
    //console.log("Note pressed:", note);
  };
  const handleNoteUp = (note, idx) => {
    // Note released handler
  };

  return (
    <div className="app">
      <nav className="navbar">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <div className="logo">
              <span className="logo-symbol">*</span> KAVIA AI
            </div>
          </div>
        </div>
      </nav>

      <main>
        <div className="container">
          <div className="hero" style={{paddingTop: "120px", paddingBottom: "28px"}}>
            <div className="subtitle" style={{fontSize:'1.02rem'}}>Virtual Piano Keyboard Demo</div>
            <h1 className="title" style={{fontSize: "2.5rem"}}>VirtuPiano</h1>
            <div className="description" style={{maxWidth:'360px', marginBottom:24}}>
              Play using your keyboard (Q, 2, W, 3, E, R, 5, T, 6, Y, 7, U) or click/tap on keys below.<br/>
              Highlight: <span style={{color:'#FFD700'}}>Key pressed</span>
            </div>
            <PianoKeyboard onNoteDown={handleNoteDown} onNoteUp={handleNoteUp} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
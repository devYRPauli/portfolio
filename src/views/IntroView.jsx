import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const styles = {
  introSection: {
    position: 'relative',
    display: 'flex',
    minHeight: '100vh',
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#0a0a0a',
    color: '#e2e8f0',
    textAlign: 'center',
    fontFamily: 'Inter, sans-serif',
  },
  bigBang: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '100px',
    height: '100px',
    backgroundColor: 'white',
    borderRadius: '50%',
    zIndex: 100,
    transform: 'translate(-50%, -50%)',
    animation: 'big-bang-effect 0.7s ease-out forwards',
  },
  initialScreen: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 101,
    color: '#94a3b8',
    transition: 'opacity 0.5s ease-out',
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  countdownText: {
    fontSize: 'clamp(2.5rem, 12vw, 7rem)',
    fontWeight: '800',
    color: '#f8fafc',
    animation: 'countdown-pulse 1s ease-in-out',
  },
  initButtonWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
  },
  soundWarning: {
    fontSize: '0.875rem',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: '1.4',
    transition: 'opacity 0.3s ease-in-out',
    whiteSpace: 'nowrap',
  },
  initButton: {
    padding: '1.25rem 4rem',
    fontSize: 'clamp(1.25rem, 5vw, 1.75rem)',
    fontWeight: '600',
    color: '#e2e8f0',
    backgroundColor: 'transparent',
    border: '2px solid #334155',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    animation: 'glow-pulse 2s infinite ease-in-out',
  }
};

function IntroView({ onIntroComplete }) {
  useDocumentTitle('Welcome');
  const [sequenceState, setSequenceState] = useState('initial');
  const [countdownText, setCountdownText] = useState('');
  const synths = useRef(null);

  const handleInitClick = async () => {
    if (sequenceState !== 'initial') return;
    
    await Tone.start();
    if (!synths.current) {
        const reverb = new Tone.Reverb({ decay: 4, wet: 0.5 }).toDestination();
        const beepSynth = new Tone.Synth({ oscillator: { type: 'sine' } }).connect(reverb);
        const boomSynth = new Tone.MembraneSynth({ pitchDecay: 0.05, octaves: 10, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4, attackCurve: 'exponential' } }).connect(reverb);
        const crackSynth = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.2 } }).connect(reverb);
        const metalSynth = new Tone.MetalSynth({ frequency: 50, envelope: { attack: 0.001, decay: 1.4, release: 0.2 }, harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5 }).connect(reverb);
        synths.current = { beep: beepSynth, boom: boomSynth, crack: crackSynth, metal: metalSynth };
    }
    
    setSequenceState('countdown');
  };

  useEffect(() => {
    if (sequenceState === 'countdown') {
      const timers = [
        setTimeout(() => { setCountdownText('3'); synths.current?.beep.triggerAttackRelease('C5', '8n'); }, 500),
        setTimeout(() => { setCountdownText('2'); synths.current?.beep.triggerAttackRelease('C5', '8n'); }, 1500),
        setTimeout(() => { setCountdownText('1'); synths.current?.beep.triggerAttackRelease('C5', '8n'); }, 2500),
        setTimeout(() => {
          setCountdownText('Here We Go!');
          synths.current?.beep.triggerAttackRelease('E5', '4n');
          setTimeout(() => {
            if (synths.current) {
              const now = Tone.now();
              synths.current.boom.triggerAttackRelease("C1", "1n", now);
              synths.current.crack.triggerAttackRelease("0.5n", now + 0.05);
              synths.current.metal.triggerAttackRelease("C1", "1n", now + 0.1);
            }
            setSequenceState('exploding');
            setTimeout(() => {
              onIntroComplete();
            }, 1000);
          }, 1000);
        }, 3500),
      ];
      return () => timers.forEach(clearTimeout);
    }
  }, [sequenceState, onIntroComplete]);

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (sequenceState === 'initial' && event.key === 'Enter') {
        handleInitClick();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [sequenceState]);

  return (
    <main style={styles.introSection}>
      {sequenceState === 'initial' && (
          <div style={styles.initialScreen}>
              <div style={styles.initButtonWrapper}>
                  <button style={styles.initButton} className="init-button-hover" onClick={handleInitClick}>
                      Initialize
                  </button>
                  <p style={styles.soundWarning}>
                      This experience uses sound, you may wanna check your volume.
                  </p>
              </div>
          </div>
      )}

      {sequenceState === 'countdown' && (
        <div style={styles.initialScreen}>
          <p style={styles.countdownText}>{countdownText}</p>
        </div>
      )}

      {sequenceState === 'exploding' && <div style={styles.bigBang}></div>}
    </main>
  );
}

export default IntroView;

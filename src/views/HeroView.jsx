import React, { useState, useEffect } from 'react';
import { TypeAnimation } from 'react-type-animation';
import NeuralNetworkAnimation from '../components/NeuralNetworkAnimation';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const styles = {
  heroSection: {
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
  contentContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '1rem',
    zIndex: 10,
    opacity: 0,
    animation: 'fadeIn 1.5s ease-in-out forwards',
  },
  nameHeading: {
    fontSize: 'clamp(3rem, 10vw, 5rem)',
    fontWeight: '800',
    color: '#f8fafc',
    height: 'clamp(3.5rem, 11vw, 5.5rem)',
    marginBottom: '2vh',
  },
  subtitle: {
    fontSize: 'clamp(1.5rem, 5vw, 2.25rem)',
    color: '#94a3b8',
    height: '50px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '4vh',
  },
  buttonContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: '1rem',
  },
  button: {
    display: 'inline-block',
    padding: '0.75rem 2rem',
    fontSize: '1rem',
    fontWeight: '600',
    borderRadius: '0.5rem',
    textDecoration: 'none',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    position: 'relative',
    zIndex: 2,
    overflow: 'hidden',
    border: 'none',
  },
  buttonPrimary: {
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    border: '1px solid #4f46e5',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    color: '#e2e8f0',
    border: '1px solid #334155',
  },
};

function HeroView({ onNavigate }) {
  useDocumentTitle('Portfolio');
  const [animationsReady, setAnimationsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimationsReady(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main style={styles.heroSection}>
      <NeuralNetworkAnimation isVisible={true} />

      <div style={styles.contentContainer}>
        <h1 style={styles.nameHeading}>
          {animationsReady && (
            <TypeAnimation sequence={['Yash Raj Pandey']} wrapper="span" speed={40} cursor={false} />
          )}
        </h1>
        <div style={styles.subtitle}>
          {animationsReady && (
            <TypeAnimation sequence={['Software & Data Engineer']} wrapper="p" speed={50} cursor={false} />
          )}
        </div>
        <div style={{...styles.buttonContainer, opacity: animationsReady ? 1 : 0, transition: 'opacity 0.5s 1s ease-in'}}>
          <button onClick={() => onNavigate('about')} className="button-outline button-glow" style={{...styles.button, ...styles.buttonOutline}}>
            The Developer
          </button>
          <button onClick={() => onNavigate('projects')} className="button-primary button-glow" style={{...styles.button, ...styles.buttonPrimary}}>
            Explore Projects
          </button>
        </div>
      </div>
    </main>
  );
}

export default HeroView;

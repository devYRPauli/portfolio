import React, { useState } from 'react';
import IntroView from './views/IntroView';
import HeroView from './views/HeroView';
import AboutView from './views/AboutView';
import ProjectsView from './views/ProjectsView';

function App() {
  const [currentPage, setCurrentPage] = useState('hero');
  const [introPlayed, setIntroPlayed] = useState(false);

  const handleIntroComplete = () => {
    setIntroPlayed(true);
    setCurrentPage('hero');
  };

  const navigateTo = (page) => {
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'about':
        return <AboutView onNavigate={navigateTo} />;
      case 'projects':
        return <ProjectsView onNavigate={navigateTo} />;
      case 'hero':
      default:
        return <HeroView onNavigate={navigateTo} />;
    }
  };

  if (!introPlayed) {
    return <IntroView onIntroComplete={handleIntroComplete} />;
  }

  return (
    <>
      {renderPage()}
    </>
  );
}

export default App;

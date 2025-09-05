import React, { useState } from 'react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import StarfieldAnimation from '../components/StarfieldAnimation';


const projectsData = [
  {
    id: 1,
    title: 'AI-Powered Data Visualizer',
    shortDescription: 'A web application that uses machine learning to generate interactive data visualizations.',
    longDescription: 'This project was built to simplify the process of data analysis for non-technical users. It features a clean interface where users can upload datasets, select visualization types, and get AI-driven insights. The backend is powered by Python with Flask, and the frontend is built with React and D3.js.',
    technologies: ['React', 'D3.js', 'Python', 'Flask', 'Scikit-learn'],
    imageUrl: 'https://placehold.co/600x400/0a0a0a/e2e8f0?text=Project+1',
    liveLink: '#',
    githubLink: '#',
  },
  {
    id: 2,
    title: 'Real-Time Collaborative Editor',
    shortDescription: 'A document editor that allows multiple users to collaborate in real-time, similar to Google Docs.',
    longDescription: 'Leveraging WebSockets and a CRDT-based approach, this application ensures seamless and conflict-free collaborative editing. The backend is built with Node.js and Express, managing user sessions and document states. The frontend uses React and Slate.js for a rich text editing experience.',
    technologies: ['React', 'Node.js', 'Express', 'WebSocket', 'MongoDB'],
    imageUrl: 'https://placehold.co/600x400/1a1a1a/e2e8f0?text=Project+2',
    liveLink: '#',
    githubLink: '#',
  },
];

const styles = {
  projectsPage: {
    position: 'relative',
    minHeight: '100vh',
    boxSizing: 'border-box',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '5rem 2rem 2rem',
    backgroundColor: '#0a0a0a',
    color: '#e2e8f0',
    fontFamily: 'Inter, sans-serif',
    overflowY: 'auto',
  },
  title: {
    fontSize: 'clamp(2.5rem, 8vw, 4rem)',
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: '1rem',
    zIndex: 2,
  },
  subtitle: {
    fontSize: '1.125rem',
    color: '#94a3b8',
    marginBottom: '4rem',
    zIndex: 2,
  },
  projectsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '2rem',
    width: '100%',
    maxWidth: '1200px',
    zIndex: 2,
    paddingBottom: '2rem',
  },
  card: {
    backgroundColor: 'rgba(23, 23, 23, 0.7)',
    backdropFilter: 'blur(10px)',
    border: '1px solid #334155',
    borderRadius: '0.75rem',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  },
  cardImage: {
    width: '100%',
    height: '200px',
    objectFit: 'cover',
    borderBottom: '1px solid #334155',
  },
  cardContent: {
    padding: '1.5rem',
  },
  cardTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: '0.5rem',
  },
  cardDescription: {
    fontSize: '1rem',
    color: '#94a3b8',
    marginBottom: '1rem',
  },
  cardTechContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  cardTech: {
    backgroundColor: '#334155',
    color: '#e2e8f0',
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
    fontSize: '0.875rem',
  },
  homeButton: {
    marginTop: 'auto',
    marginBottom: '2rem',
    padding: '0.75rem 2rem',
    fontSize: '1rem',
    fontWeight: '600',
    color: '#e2e8f0',
    backgroundColor: 'transparent',
    border: '1px solid #334155',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    zIndex: 2,
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(5px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    opacity: 0,
    transition: 'opacity 0.3s ease-in-out',
    pointerEvents: 'none',
  },
  modalContent: {
    backgroundColor: '#171717',
    borderRadius: '0.75rem',
    border: '1px solid #334155',
    width: '90%',
    maxWidth: '800px',
    maxHeight: '90vh',
    overflowY: 'auto',
    padding: '2rem',
    position: 'relative',
    transform: 'scale(0.95)',
    transition: 'transform 0.3s ease-in-out',
  },
  modalCloseButton: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: '1.5rem',
    cursor: 'pointer',
  },
  modalTitle: {
    fontSize: '2.5rem',
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: '1rem',
  },
  modalImage: {
    width: '100%',
    height: 'auto',
    maxHeight: '400px',
    objectFit: 'cover',
    borderRadius: '0.5rem',
    marginBottom: '1.5rem',
  },
  modalDescription: {
    fontSize: '1.125rem',
    lineHeight: '1.75',
    color: '#94a3b8',
    marginBottom: '2rem',
  },
  modalLinks: {
    display: 'flex',
    gap: '1rem',
    marginTop: '2rem',
  },
  modalLinkButton: {
    display: 'inline-block',
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    fontWeight: '600',
    borderRadius: '0.5rem',
    textDecoration: 'none',
    transition: 'all 0.3s ease',
  },
  modalLinkPrimary: {
    backgroundColor: '#4f46e5',
    color: '#ffffff',
  },
  modalLinkOutline: {
    backgroundColor: 'transparent',
    color: '#e2e8f0',
    border: '1px solid #334155',
  },
};

function ProjectsView({ onNavigate }) {
  useDocumentTitle('Projects');
  const [selectedProject, setSelectedProject] = useState(null);

  const handleCardClick = (project) => {
    setSelectedProject(project);
  };

  const handleCloseModal = () => {
    setSelectedProject(null);
  };

  return (
    <main style={styles.projectsPage}>
      <StarfieldAnimation isVisible={true} />
      <h1 style={styles.title}>My Work</h1>
      <p style={styles.subtitle}>A selection of projects I'm proud of.</p>
      
      <div style={styles.projectsGrid}>
        {projectsData.map((project) => (
          <div 
            key={project.id} 
            style={styles.card}
            onClick={() => handleCardClick(project)}
            onMouseOver={e => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(79, 70, 229, 0.2)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <img src={project.imageUrl} alt={project.title} style={styles.cardImage} />
            <div style={styles.cardContent}>
              <h3 style={styles.cardTitle}>{project.title}</h3>
              <p style={styles.cardDescription}>{project.shortDescription}</p>
              <div style={styles.cardTechContainer}>
                {project.technologies.map((tech) => (
                  <span key={tech} style={styles.cardTech}>{tech}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button 
        style={styles.homeButton} 
        onClick={() => onNavigate('hero')}
        onMouseOver={e => e.currentTarget.style.borderColor = '#4f46e5'}
        onMouseOut={e => e.currentTarget.style.borderColor = '#334155'}
      >
        Back to Home
      </button>

      <div 
        style={{
          ...styles.modalOverlay, 
          opacity: selectedProject ? 1 : 0, 
          pointerEvents: selectedProject ? 'auto' : 'none'
        }} 
        onClick={handleCloseModal}
      >
      {selectedProject && (
        <div 
          style={{
            ...styles.modalContent, 
            transform: selectedProject ? 'scale(1)' : 'scale(0.95)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button style={styles.modalCloseButton} onClick={handleCloseModal}>&times;</button>
          <img src={selectedProject.imageUrl} alt={selectedProject.title} style={styles.modalImage} />
          <h2 style={styles.modalTitle}>{selectedProject.title}</h2>
          <div style={styles.cardTechContainer}>
              {selectedProject.technologies.map((tech) => (
                  <span key={tech} style={styles.cardTech}>{tech}</span>
              ))}
          </div>
          <p style={styles.modalDescription}>{selectedProject.longDescription}</p>
          <div style={styles.modalLinks}>
            <a href={selectedProject.liveLink} target="_blank" rel="noopener noreferrer" style={{...styles.modalLinkButton, ...styles.modalLinkPrimary}}>View Live Site</a>
            <a href={selectedProject.githubLink} target="_blank" rel="noopener noreferrer" style={{...styles.modalLinkButton, ...styles.modalLinkOutline}}>View on GitHub</a>
          </div>
        </div>
      )}
      </div>
    </main>
  );
}

export default ProjectsView;

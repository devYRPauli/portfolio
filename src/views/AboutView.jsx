import React, { useEffect, useRef } from 'react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import StarfieldAnimation from '../components/StarfieldAnimation';

const timelineData = [
  {
    year: 'July 2019 - May 2023',
    title: 'Bachelor of Technology, Computer Science',
    description: 'Completed my undergraduate studies at Jaypee University of Engineering and Technology, building a strong foundation in Data Structures, Algorithms, and OOP.',
    icon: '🎓',
    isPeriod: true,
    subEvents: [
      {
        year: 'Jan 2022 - Jun 2022',
        title: 'Software Developer Intern @ Hackdev Technology',
        description: 'Gained my first professional experience, where I containerized a backend with Docker and enhanced application reliability.',
      },
      {
        year: 'Jan 2023 - May 2023',
        title: 'Semester Exchange Program @ University of Florida',
        description: 'Selected for a competitive exchange program, taking advanced coursework in Software Engineering, HCI, and Database Systems.',
      },
    ],
  },
  {
    year: 'Aug 2023 - Dec 2024',
    title: 'Master of Science, Computer Science @ University of Florida',
    description: 'Specialized in architecting scalable software, with deep expertise in Distributed Systems, Advanced Algorithms, and Information Security.',
    icon: '🎓',
    isPeriod: true,
    subEvents: [
        {
            year: 'Jul 2024 - Dec 2024',
            title: 'Software Engineer @ UF RecSports',
            description: 'Engineered an operational management system using Python and Google APIs to automate asset tracking and dynamic scheduling.',
        },
    ]
  },
  {
    year: 'Mar 2025 - Present',
    title: 'Software Engineer @ UF/IFAS',
    description: 'Currently engineering full-stack web applications with React and Python (FastAPI) to create interactive analytics dashboards for scientific research.',
    icon: '🔬',
  },
];

const styles = {
  aboutPage: {
    position: 'relative',
    minHeight: '100vh',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '5rem 2rem',
    boxSizing: 'border-box',
  },
  title: {
    fontSize: 'clamp(2.5rem, 8vw, 4rem)',
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: '4rem',
    zIndex: 2,
    textAlign: 'center',
  },
  timelineContainer: {
    position: 'relative',
    width: '100%',
    maxWidth: '1000px',
    zIndex: 2,
  },
  timelineLine: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: '4px',
    backgroundColor: '#334155',
    transform: 'translateX(-50%)',
  },
  timelineItem: {
    position: 'relative',
    width: '50%',
    padding: '1rem 2.5rem',
    boxSizing: 'border-box',
    marginBottom: '3rem',
  },
  timelineContent: {
    backgroundColor: 'rgba(23, 23, 23, 0.7)',
    backdropFilter: 'blur(10px)',
    border: '1px solid #334155',
    borderRadius: '0.75rem',
    padding: '1.5rem',
  },
  timelinePeriodContent: {
    border: '1px solid #4f46e5',
  },
  timelineYear: {
    fontWeight: 'bold',
    color: '#4f46e5',
    marginBottom: '0.5rem',
  },
  timelineTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: '0.5rem',
  },
  timelineDescription: {
    fontSize: '1rem',
    color: '#94a3b8',
    lineHeight: '1.6',
  },
  timelineIcon: {
    position: 'absolute',
    top: '1.5rem',
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    backgroundColor: '#334155',
    border: '3px solid #4f46e5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    zIndex: 3,
  },
  subEventsContainer: {
    marginTop: '1.5rem',
    paddingLeft: '1.5rem',
    borderLeft: '2px solid #334155',
  },
  subEvent: {
    marginBottom: '1rem',
  },
  subEventTitle: {
    fontSize: '1.2rem',
    fontWeight: '600',
    color: '#e2e8f0',
  },
  homeButton: {
    marginTop: '4rem',
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
};

const dynamicStyles = `
  .timeline-item {
    opacity: 0;
    transform: translateY(50px);
    transition: opacity 0.6s ease-out, transform 0.6s ease-out;
  }
  .timeline-item.left {
    left: 0;
  }
  .timeline-item.right {
    left: 50%;
  }
  .timeline-item.visible {
    opacity: 1;
    transform: translateY(0);
  }
  .timeline-icon.left {
    right: -25px;
  }
  .timeline-icon.right {
    left: -25px;
  }
  @media (max-width: 768px) {
    .timeline-line {
      left: 25px;
    }
    .timeline-item.left, .timeline-item.right {
      width: 100%;
      left: 0;
      padding-left: 70px;
      padding-right: 1rem;
    }
    .timeline-icon.left, .timeline-icon.right {
      left: 0;
    }
  }
`;

function AboutView({ onNavigate }) {
  useDocumentTitle('About Me');
  const timelineContainerRef = useRef(null);

  useEffect(() => {
    const container = timelineContainerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      {
        root: null,
        threshold: 0.1,
      }
    );

    const timelineItems = Array.from(container.querySelectorAll('.timeline-item'));
    timelineItems.forEach((item) => observer.observe(item));

    return () => {
      timelineItems.forEach((item) => observer.unobserve(item));
    };
  }, []);

  return (
    <>
      <style>{dynamicStyles}</style>
      <StarfieldAnimation />
      <main style={styles.aboutPage}>
        <h1 style={styles.title}>My Journey</h1>
        <div ref={timelineContainerRef} style={styles.timelineContainer}>
          <div style={styles.timelineLine}></div>
          {timelineData.map((item, index) => {
            const side = index % 2 === 0 ? 'left' : 'right';
            return (
              <div key={index} className={`timeline-item ${side}`} style={styles.timelineItem}>
                <div className={`timeline-icon ${side}`} style={styles.timelineIcon}>{item.icon}</div>
                <div style={{...styles.timelineContent, ...(item.isPeriod ? styles.timelinePeriodContent : {})}}>
                  <p style={styles.timelineYear}>{item.year}</p>
                  <h3 style={styles.timelineTitle}>{item.title}</h3>
                  <p style={styles.timelineDescription}>{item.description}</p>
                  {item.subEvents && (
                    <div style={styles.subEventsContainer}>
                      {item.subEvents.map((subItem, subIndex) => (
                        <div key={subIndex} style={styles.subEvent}>
                          <p style={styles.timelineYear}>{subItem.year}</p>
                          <h4 style={styles.subEventTitle}>{subItem.title}</h4>
                          <p style={styles.timelineDescription}>{subItem.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <button 
          style={styles.homeButton} 
          onClick={() => onNavigate('hero')}
          onMouseOver={e => e.currentTarget.style.borderColor = '#4f46e5'}
          onMouseOut={e => e.currentTarget.style.borderColor = '#334155'}
        >
          Back to Home
        </button>
      </main>
    </>
  );
}

export default AboutView;

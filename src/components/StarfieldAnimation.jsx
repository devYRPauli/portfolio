import React, { useEffect, useRef } from 'react';

const styles = {
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
};

const StarfieldAnimation = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let stars = [];
    const numStars = 500;
    let speed = 0.5;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    class Star {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.z = Math.random() * canvas.width;
        this.p_z = this.z;
      }

      update() {
        this.z = this.z - speed;
        if (this.z < 1) {
          this.z = canvas.width;
          this.x = Math.random() * canvas.width;
          this.y = Math.random() * canvas.height;
          this.p_z = this.z;
        }
      }

      show() {
        ctx.fillStyle = 'white';

        const sx = (this.x - canvas.width / 2) * (canvas.width / this.z) + canvas.width / 2;
        const sy = (this.y - canvas.height / 2) * (canvas.width / this.z) + canvas.height / 2;
        const radius = Math.max(0, (1 - this.z / canvas.width) * 2);

        ctx.beginPath();
        ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const setup = () => {
      resizeCanvas();
      for (let i = 0; i < numStars; i++) {
        stars[i] = new Star();
      }
    };

    const draw = () => {
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < numStars; i++) {
        stars[i].update();
        stars[i].show();
      }
      
      animationFrameId = requestAnimationFrame(draw);
    };

    setup();
    draw();

    window.addEventListener('resize', setup);

    return () => {
      window.removeEventListener('resize', setup);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} style={styles.canvas}></canvas>;
};

export default StarfieldAnimation;

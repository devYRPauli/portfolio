import React, { useEffect, useRef } from 'react';

const styles = {
  canvasContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
};

const NeuralNetworkAnimation = ({ isVisible }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particlesArray;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();

    let mouse = {
      x: null,
      y: null,
      radius: (canvas.height / 80) * (canvas.width / 80)
    };

    const handleMouseMove = (event) => {
      mouse.x = event.x;
      mouse.y = event.y;
    };
    window.addEventListener('mousemove', handleMouseMove);

    class Particle {
      constructor(x, y, directionX, directionY, size) {
        this.x = x;
        this.y = y;
        this.directionX = directionX;
        this.directionY = directionY;
        this.size = size;
        this.baseColor = 'rgba(173, 216, 230, 0.8)';
        this.pulseFactor = Math.random();
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        
        const pulse = Math.sin(this.pulseFactor * 2 * Math.PI);
        const alpha = 0.6 + (pulse * 0.2);
        ctx.fillStyle = `rgba(173, 216, 230, ${alpha})`;
        ctx.shadowColor = `rgba(173, 216, 230, 1)`;
        ctx.shadowBlur = 10;

        ctx.fill();
        this.pulseFactor += 0.01;
      }
      update() {
        if (this.x > canvas.width + this.size * 20 || this.x < 0 - this.size * 20) {
          this.directionX = -this.directionX;
        }
        if (this.y > canvas.height + this.size * 20 || this.y < 0 - this.size * 20) {
          this.directionY = -this.directionY;
        }
        
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx*dx + dy*dy);
        if (distance < mouse.radius + this.size){
            this.directionX += dx / (distance * 5);
            this.directionY += dy / (distance * 5);
        }

        this.x += this.directionX;
        this.y += this.directionY;
        
        if (Math.abs(this.directionX) > 0.05) this.directionX *= 0.99;
        if (Math.abs(this.directionY) > 0.05) this.directionY *= 0.99;

        this.draw();
      }
    }

    function init() {
      particlesArray = [];
      let numberOfParticles = Math.min(150, (canvas.height * canvas.width) / 9000);
      for (let i = 0; i < numberOfParticles; i++) {
        let size = (Math.random() * 2) + 1;
        let x = canvas.width / 2;
        let y = canvas.height / 2;
        let angle = Math.random() * Math.PI * 2;
        let speed = Math.random() * 12 + 4;
        let directionX = Math.cos(angle) * speed;
        let directionY = Math.sin(angle) * speed;
        particlesArray.push(new Particle(x, y, directionX, directionY, size));
      }
    }

    function connect() {
      let opacityValue = 1;
      ctx.shadowBlur = 0;
      for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
          let distance = ((particlesArray[a].x - particlesArray[b].x) * (particlesArray[a].x - particlesArray[b].x)) +
            ((particlesArray[a].y - particlesArray[b].y) * (particlesArray[a].y - particlesArray[b].y));
          if (distance < (canvas.width / 8) * (canvas.height / 8)) {
            opacityValue = 1 - (distance / 20000);
            ctx.strokeStyle = `rgba(173, 216, 230, ${opacityValue})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
            ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
            ctx.stroke();
          }
        }
      }
    }

    function animate() {
      animationFrameId = requestAnimationFrame(animate);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
      }
      connect();
    }

    const handleResize = () => {
      resizeCanvas();
      mouse.radius = (canvas.height / 80) * (canvas.width / 80);
      init();
    };
    window.addEventListener('resize', handleResize);
    
    const handleMouseOut = () => {
        mouse.x = undefined;
        mouse.y = undefined;
    };
    window.addEventListener('mouseout', handleMouseOut);

    if (isVisible) {
        init();
        animate();
    }

    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('mouseout', handleMouseOut);
        cancelAnimationFrame(animationFrameId);
    }

  }, [isVisible]);

  return <canvas ref={canvasRef} style={styles.canvasContainer}></canvas>;
};

export default NeuralNetworkAnimation;

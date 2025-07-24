import { useEffect, useRef, useState } from 'react';

interface Position {
  x: number;
  y: number;
}

interface Velocity {
  x: number;
  y: number;
}

const WORD_POOL = [
  'self', 'values', 'wants', 'triggers', 'desires', 'fears', 
  'motives', 'ego', 'shadows', 'memories', 'dreams', 'hopes',
  'limits', 'growth', 'truth', 'masks', 'core', 'essence'
];

const COLOR_POOL = [
  'hsl(0 0% 100%)',      // white
  'hsl(45 100% 75%)',    // warm gold
  'hsl(120 45% 70%)',    // soft green
  'hsl(300 60% 80%)',    // light purple
  'hsl(30 85% 75%)',     // coral
  'hsl(180 55% 75%)',    // cyan
  'hsl(60 80% 80%)',     // light yellow
  'hsl(320 50% 85%)'     // pink
];

const SPEED = 100; // pixels per second
const FPS = 60;

export const BouncingWord = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  
  const [currentWord, setCurrentWord] = useState('self');
  const [currentColor, setCurrentColor] = useState(COLOR_POOL[0]);
  const [position, setPosition] = useState<Position>({ x: 50, y: 50 });
  const [velocity, setVelocity] = useState<Velocity>({ x: 1, y: 1 });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0, wordWidth: 0, wordHeight: 0 });

  // Initialize random starting position and velocity
  useEffect(() => {
    if (!containerRef.current || !wordRef.current) return;

    const container = containerRef.current.getBoundingClientRect();
    const word = wordRef.current.getBoundingClientRect();
    
    const maxX = container.width - word.width;
    const maxY = container.height - word.height;
    
    setPosition({
      x: Math.random() * maxX,
      y: Math.random() * maxY
    });
    
    // Random angle between 30-60 degrees in each quadrant
    const angle = (Math.random() * 30 + 30) * Math.PI / 180;
    const dirX = Math.random() > 0.5 ? 1 : -1;
    const dirY = Math.random() > 0.5 ? 1 : -1;
    
    setVelocity({
      x: Math.cos(angle) * dirX,
      y: Math.sin(angle) * dirY
    });
  }, []);

  // Update dimensions when window resizes or word changes
  useEffect(() => {
    const updateDimensions = () => {
      if (!containerRef.current || !wordRef.current) return;
      
      const container = containerRef.current.getBoundingClientRect();
      const word = wordRef.current.getBoundingClientRect();
      
      setDimensions({
        width: container.width,
        height: container.height,
        wordWidth: word.width,
        wordHeight: word.height
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    // Small delay to ensure font is loaded
    const timeout = setTimeout(updateDimensions, 100);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
      clearTimeout(timeout);
    };
  }, [currentWord]);

  // Change word and color on collision
  const changeWordAndColor = () => {
    const availableWords = WORD_POOL.filter(word => word !== currentWord);
    const newWord = availableWords[Math.floor(Math.random() * availableWords.length)];
    setCurrentWord(newWord);
    
    const availableColors = COLOR_POOL.filter(color => color !== currentColor);
    const newColor = availableColors[Math.floor(Math.random() * availableColors.length)];
    setCurrentColor(newColor);
  };

  // Animation loop
  useEffect(() => {

    const animate = (currentTime: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = currentTime;
      }
      
      const deltaTime = (currentTime - lastTimeRef.current) / 1000; // Convert to seconds
      lastTimeRef.current = currentTime;
      
      setPosition(prevPosition => {
        let newPosition = {
          x: prevPosition.x + velocity.x * SPEED * deltaTime,
          y: prevPosition.y + velocity.y * SPEED * deltaTime
        };
        
        let collisionDetected = false;
        let newVelocity = { ...velocity };
        
        // Check horizontal boundaries
        if (newPosition.x <= 0) {
          newPosition.x = 0;
          newVelocity.x = Math.abs(newVelocity.x);
          collisionDetected = true;
        } else if (newPosition.x >= dimensions.width - dimensions.wordWidth) {
          newPosition.x = dimensions.width - dimensions.wordWidth;
          newVelocity.x = -Math.abs(newVelocity.x);
          collisionDetected = true;
        }
        
        // Check vertical boundaries
        if (newPosition.y <= 0) {
          newPosition.y = 0;
          newVelocity.y = Math.abs(newVelocity.y);
          collisionDetected = true;
        } else if (newPosition.y >= dimensions.height - dimensions.wordHeight) {
          newPosition.y = dimensions.height - dimensions.wordHeight;
          newVelocity.y = -Math.abs(newVelocity.y);
          collisionDetected = true;
        }
        
        if (collisionDetected) {
          setVelocity(newVelocity);
          changeWordAndColor();
        }
        
        return newPosition;
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    if (dimensions.width > 0 && dimensions.height > 0) {
      animationRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [dimensions]);

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div 
        ref={containerRef}
        className="bouncing-container max-w-4xl w-full"
        role="presentation"
        aria-label="Self-awareness visualization"
      >
        <div
          ref={wordRef}
          className="bouncing-word"
          style={{
            transform: `translate(${position.x}px, ${position.y}px)`,
            color: currentColor,
            textShadow: `0 0 12px ${currentColor}40, 0 0 24px ${currentColor}20`
          }}
          aria-live="polite"
          aria-label={`Current word: ${currentWord}`}
        >
          {currentWord}
        </div>
      </div>
    </div>
  );
};
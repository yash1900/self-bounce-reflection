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

const SPEED = 100; // pixels per second
const FPS = 60;

export const BouncingWord = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  
  const [currentWord, setCurrentWord] = useState('self');
  const [position, setPosition] = useState<Position>({ x: 50, y: 50 });
  const [velocity, setVelocity] = useState<Velocity>({ x: 1, y: 1 });
  const [isMotionEnabled, setIsMotionEnabled] = useState(true);
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

  // Change word on collision
  const changeWord = () => {
    const availableWords = WORD_POOL.filter(word => word !== currentWord);
    const newWord = availableWords[Math.floor(Math.random() * availableWords.length)];
    setCurrentWord(newWord);
  };

  // Animation loop
  useEffect(() => {
    if (!isMotionEnabled) return;

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
          changeWord();
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
  }, [isMotionEnabled, dimensions]);

  // Check for motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsMotionEnabled(!mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsMotionEnabled(!e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="controls-container">
        <button
          onClick={() => setIsMotionEnabled(!isMotionEnabled)}
          className={`motion-toggle ${isMotionEnabled ? 'active' : ''}`}
          aria-label={isMotionEnabled ? 'Disable motion' : 'Enable motion'}
        >
          {isMotionEnabled ? 'Motion On' : 'Motion Off'}
        </button>
        <button
          onClick={changeWord}
          className="motion-toggle"
          aria-label="Change word"
        >
          Change Word
        </button>
      </div>
      
      <div 
        ref={containerRef}
        className={`bouncing-container max-w-4xl w-full ${!isMotionEnabled ? 'motion-reduce' : ''}`}
        role="presentation"
        aria-label="Self-awareness visualization"
      >
        <div
          ref={wordRef}
          className="bouncing-word"
          style={{
            transform: isMotionEnabled 
              ? `translate(${position.x}px, ${position.y}px)` 
              : 'none'
          }}
          aria-live="polite"
          aria-label={`Current word: ${currentWord}`}
        >
          {currentWord}
        </div>
      </div>
      
      <div className="mt-8 text-center max-w-md">
        <p className="text-white/60 text-sm leading-relaxed">
          Watch as words of self-discovery bounce through the boundaries of awareness. 
          Each collision sparks a new aspect of identity to explore.
        </p>
      </div>
    </div>
  );
};
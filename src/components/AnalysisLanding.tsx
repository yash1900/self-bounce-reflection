import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface Position {
  x: number;
  y: number;
}

interface Velocity {
  x: number;
  y: number;
}

const WORD_POOL = [
  'self', 'values', 'wants', 'bonds', 'culture', 'desires', 'fears', 
  'motives', 'ego', 'shadows', 'memories', 'dreams', 'hopes',
  'limits', 'growth', 'truth', 'masks', 'core', 'essence'
];

const SPEED = 80; // pixels per second

const BouncingAnimation = () => {
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
  }, [isMotionEnabled, dimensions, velocity]);

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
    <div 
      ref={containerRef}
      className="bouncing-container w-full h-48 relative"
      role="presentation"
      aria-label="Self-awareness visualization"
    >
      <div
        ref={wordRef}
        className="bouncing-word"
        style={{
          transform: isMotionEnabled 
            ? `translate(${position.x}px, ${position.y}px)` 
            : 'translate(50%, 50%)',
          position: 'absolute',
          top: isMotionEnabled ? 0 : '50%',
          left: isMotionEnabled ? 0 : '50%',
        }}
        aria-live="polite"
        aria-label={`Current word: ${currentWord}`}
      >
        {currentWord}
      </div>
    </div>
  );
};

export const AnalysisLanding = () => {
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 max-w-sm mx-auto">
      {/* Animation Container */}
      <div className="w-full mb-8">
        <BouncingAnimation />
      </div>
      
      {/* Main Content */}
      <div className="text-center space-y-6 flex-1 flex flex-col justify-center">
        <div>
          <h1 className="text-3xl font-light text-white mb-2">
            Let's get you
          </h1>
          <h2 className="text-4xl font-bold text-white mb-6">
            Analysed.
          </h2>
        </div>
        
        <p className="text-white/80 text-sm leading-relaxed max-w-xs mx-auto">
          I am designed to deeply understand your personality through simple, yet thought provoking questions.
        </p>
        
        {/* Terms and Conditions */}
        <div className="flex items-start space-x-3 text-left">
          <Checkbox 
            id="terms"
            checked={agreedToTerms}
            onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
            className="mt-0.5 border-white/40 data-[state=checked]:bg-white data-[state=checked]:border-white"
          />
          <label htmlFor="terms" className="text-white/80 text-xs leading-relaxed cursor-pointer">
            I agree to the{' '}
            <span className="underline cursor-pointer">Terms & Conditions</span>
            {' '}and{' '}
            <span className="underline cursor-pointer">Privacy Policy</span>
          </label>
        </div>
        
        {/* Get Started Button */}
        <Button 
          variant="outline"
          className="w-full bg-transparent border-white/40 text-white hover:bg-white/10 hover:border-white/60 transition-all duration-200 py-6 text-lg font-medium rounded-full"
          disabled={!agreedToTerms}
        >
          Get Started
          <span className="ml-2">›</span>
        </Button>
      </div>
    </div>
  );
};
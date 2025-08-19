'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import presentationData from '../data/presentation.json';

// Dynamically import slide components
const slideComponents = presentationData.slides.map((slide: any) => 
  dynamic(() => import(`../components/slides/Slide_${slide.id}.tsx`))
);

export default function Presentation() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSpeakerNotes, setShowSpeakerNotes] = useState(false);
  const [showNarration, setShowNarration] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Play audio when slide changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = `/audio/slide-${presentationData.slides[currentSlide].id}.mp3`;
      
      // Check if audio file exists and play if it does
      audioRef.current.load();
      audioRef.current.play().catch(err => {
        // Audio file might not exist or be empty
        console.log('No audio for this slide');
      });
    }
  }, [currentSlide]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && currentSlide < slideComponents.length - 1) {
        setCurrentSlide(currentSlide + 1);
      } else if (e.key === 'ArrowLeft' && currentSlide > 0) {
        setCurrentSlide(currentSlide - 1);
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(!isPlaying);
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setShowSpeakerNotes(!showSpeakerNotes);
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setShowNarration(!showNarration);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide, isPlaying, showSpeakerNotes, showNarration]);
  
  // Auto-advance slides when playing or when audio ends
  useEffect(() => {
    if (audioRef.current) {
      const handleAudioEnd = () => {
        if (currentSlide < slideComponents.length - 1) {
          setCurrentSlide(currentSlide + 1);
        } else {
          setIsPlaying(false);
        }
      };
      
      audioRef.current.addEventListener('ended', handleAudioEnd);
      return () => {
        audioRef.current?.removeEventListener('ended', handleAudioEnd);
      };
    }
  }, [currentSlide]);
  
  useEffect(() => {
    if (isPlaying && currentSlide < slideComponents.length - 1) {
      // Use audio duration if available, otherwise use slide duration
      const timer = setTimeout(() => {
        if (!audioRef.current || audioRef.current.paused || audioRef.current.ended) {
          setCurrentSlide(currentSlide + 1);
        }
      }, presentationData.slides[currentSlide].duration * 1000);
      
      return () => clearTimeout(timer);
    } else if (isPlaying && currentSlide === slideComponents.length - 1) {
      setIsPlaying(false);
    }
  }, [isPlaying, currentSlide]);
  
  const CurrentSlideComponent = slideComponents[currentSlide];
  
  return (
    <>
      <audio ref={audioRef} />
      <CurrentSlideComponent />
      
      {/* Speaker Notes and Narration Panel */}
      {(showSpeakerNotes || showNarration) && (
        <div style={{
          position: 'fixed',
          bottom: '120px',
          left: '20px',
          right: '20px',
          maxHeight: '200px',
          overflowY: 'auto',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '20px',
          borderRadius: '10px',
          fontSize: '14px',
        }}>
          {showSpeakerNotes && presentationData.slides[currentSlide].speakerNotes && (
            <div style={{ marginBottom: '10px' }}>
              <strong>Speaker Notes:</strong>
              <div style={{ opacity: 0.9, marginTop: '5px' }}>
                {presentationData.slides[currentSlide].speakerNotes}
              </div>
            </div>
          )}
          {showNarration && presentationData.slides[currentSlide].narration && (
            <div>
              <strong>Narration Script:</strong>
              <div style={{ opacity: 0.9, marginTop: '5px' }}>
                {presentationData.slides[currentSlide].narration}
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="navigation">
        <button 
          onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
          disabled={currentSlide === 0}
        >
          Previous
        </button>
        <span>{currentSlide + 1} / {slideComponents.length}</span>
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button 
          onClick={() => setCurrentSlide(Math.min(slideComponents.length - 1, currentSlide + 1))}
          disabled={currentSlide === slideComponents.length - 1}
        >
          Next
        </button>
        <button 
          onClick={() => setShowSpeakerNotes(!showSpeakerNotes)}
          style={{ marginLeft: '20px' }}
        >
          {showSpeakerNotes ? 'Hide' : 'Show'} Notes
        </button>
        <button 
          onClick={() => setShowNarration(!showNarration)}
        >
          {showNarration ? 'Hide' : 'Show'} Script
        </button>
      </div>
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        fontSize: '14px',
        opacity: 0.7,
      }}>
        Use arrow keys to navigate • Space to play/pause • N for notes • S for script
      </div>
    </>
  );
}
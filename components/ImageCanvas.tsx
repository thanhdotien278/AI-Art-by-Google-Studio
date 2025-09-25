
import React, { useState, useEffect } from 'react';
import { GeneratedImageData, GeneratedVideoData } from '../types';
import { Spinner } from './Spinner';
import { useLanguage } from '../context/LanguageContext';

interface ImageCanvasProps {
  generatedImage: GeneratedImageData | null;
  generatedVideo: GeneratedVideoData | null;
  generatedPrompt: string | null;
  editablePrompt: string | null;
  setEditablePrompt: (prompt: string) => void;
  generatedVideoPrompt: string | null;
  isGeneratingImage: boolean;
  isGeneratingVideo: boolean;
  isGeneratingPrompt: boolean;
  isGeneratingVideoPrompt: boolean;
  error: string | null;
  onGenerateFromPrompt: (prompt: string) => void;
}

interface PromptDisplayProps {
  title?: string;
  isImagePrompt: boolean;
  isGeneratingImage: boolean;
  editablePrompt: string;
  setEditablePrompt: (p: string) => void;
  onGenerateFromPrompt: (prompt: string) => void;
}

const PromptDisplay: React.FC<PromptDisplayProps> = ({ title, isImagePrompt, isGeneratingImage, editablePrompt, setEditablePrompt, onGenerateFromPrompt }) => {
    const [copied, setCopied] = useState(false);
    const { t } = useLanguage();
    
    const copyToClipboard = () => {
        navigator.clipboard.writeText(editablePrompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="w-full max-w-3xl text-left flex flex-col items-center">
            <div className="w-full bg-stone-900/80 rounded-xl border border-stone-800 shadow-2xl overflow-hidden">
                <div className="flex justify-between items-center p-3 bg-stone-800/50 border-b border-stone-700">
                    <h3 className="text-sm font-semibold text-cyan-400">{title || t('promptResultTitle')}</h3>
                    <div className="flex items-center space-x-2">
                        <button 
                            onClick={copyToClipboard} 
                            className="inline-flex items-center justify-center bg-purple-600 hover:bg-purple-500 text-white font-bold py-1.5 px-3 rounded-md shadow-lg transition-all text-xs btn-hover-lift disabled:bg-stone-600 btn-glow-purple"
                            disabled={copied}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            {copied ? t('copiedButton') : t('copyButton')}
                        </button>
                        {isImagePrompt && (
                             <button 
                                onClick={() => onGenerateFromPrompt(editablePrompt)} 
                                className="inline-flex items-center justify-center bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-1.5 px-3 rounded-md shadow-lg transition-all text-xs btn-hover-lift disabled:from-stone-600 disabled:to-stone-700 disabled:shadow-none disabled:cursor-not-allowed btn-glow-cyan"
                                disabled={isGeneratingImage}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /><path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.18l1.13-1.954a1.65 1.65 0 011.625-.87c.563 0 1.08.32 1.373.812l1.026 1.777a1.65 1.65 0 002.398 0l1.026-1.777a1.65 1.65 0 011.373-.812c.563 0 1.08.32 1.625.87l1.13 1.954a1.651 1.651 0 010 1.18l-1.13 1.954a1.65 1.65 0 01-1.625.87c-.563 0-1.08-.32-1.373-.812l-1.026-1.777a1.65 1.65 0 00-2.398 0l-1.026 1.777a1.65 1.65 0 01-1.373-.812c-.563 0-1.08-.32-1.625-.87l-1.13-1.954z" clipRule="evenodd" /></svg>
                                {t('generateFromPromptButton')}
                            </button>
                        )}
                    </div>
                </div>
                <div className="p-4 max-h-[60vh] overflow-y-auto">
                    <textarea
                        value={editablePrompt}
                        onChange={(e) => setEditablePrompt(e.target.value)}
                        className="w-full bg-stone-950/70 border border-stone-700 rounded-lg p-3 text-stone-300 whitespace-pre-wrap font-mono text-sm leading-relaxed focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/80 transition min-h-[250px] sm:min-h-[350px]"
                        aria-label="Editable prompt text"
                    />
                </div>
            </div>
        </div>
    );
};

export const ImageCanvas: React.FC<ImageCanvasProps> = ({ 
    generatedImage, 
    generatedVideo, 
    generatedPrompt, 
    editablePrompt,
    setEditablePrompt,
    generatedVideoPrompt,
    isGeneratingImage, 
    isGeneratingVideo,
    isGeneratingPrompt, 
    isGeneratingVideoPrompt,
    error,
    onGenerateFromPrompt
}) => {
  const { t } = useLanguage();
  const isLoading = isGeneratingImage || isGeneratingPrompt || isGeneratingVideo || isGeneratingVideoPrompt;
  const [videoLoadingMessage, setVideoLoadingMessage] = useState(t('videoLoadingMessage1'));

  const videoMessages = React.useMemo(() => [
      t('videoLoadingMessage1'),
      t('videoLoadingMessage2'),
      t('videoLoadingMessage3'),
      t('videoLoadingMessage4')
  ], [t]);
  
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isGeneratingVideo) {
      let messageIndex = 0;
      interval = setInterval(() => {
        messageIndex = (messageIndex + 1) % videoMessages.length;
        setVideoLoadingMessage(videoMessages[messageIndex]);
      }, 4000); // Change message every 4 seconds
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isGeneratingVideo, videoMessages]);
  
  const getLoadingMessage = () => {
      if (isGeneratingVideo) return videoLoadingMessage;
      if (isGeneratingImage) return t('loadingMessage');
      if (isGeneratingVideoPrompt) return t('loadingVideoPromptMessage');
      return t('loadingPromptMessage');
  }

  if (isLoading) {
    return (
        <div className="text-center">
            <Spinner />
            <p className="mt-4 text-lg text-cyan-300 animate-pulse max-w-md mx-auto transition-all duration-500">
                {getLoadingMessage()}
            </p>
        </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-400 bg-red-900/50 p-6 rounded-lg border border-red-800">{error}</div>;
  }
  
  if (generatedVideo) {
    return (
      <div className="w-full flex flex-col items-center fade-in">
        <video
          src={generatedVideo.videoUrl}
          controls
          autoPlay
          loop
          className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl mb-4 border-2 border-stone-700"
        />
        <div className="text-center space-y-3 mt-2">
            <p className="text-xs text-stone-400 bg-stone-800/50 px-3 py-1 rounded-full">
              {generatedVideo.techDetails}
            </p>
            <a
                href={generatedVideo.videoUrl}
                download={`ai_video_${Date.now()}.mp4`}
                className="inline-flex btn-hover-lift btn-glow-cyan items-center justify-center bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-5 rounded-lg shadow-lg transition-all"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                {t('downloadButton')}
            </a>
        </div>
      </div>
    );
  }
  
  if (generatedVideoPrompt) {
    return <div className="fade-in w-full"><PromptDisplay editablePrompt={generatedVideoPrompt} setEditablePrompt={() => {}} title={t('videoPromptResultTitle')} onGenerateFromPrompt={() => {}} isImagePrompt={false} isGeneratingImage={false} /></div>;
  }
  
  if (generatedPrompt) {
    return <div className="fade-in w-full"><PromptDisplay editablePrompt={editablePrompt ?? ''} setEditablePrompt={setEditablePrompt} onGenerateFromPrompt={onGenerateFromPrompt} isImagePrompt={true} isGeneratingImage={isGeneratingImage} /></div>;
  }

  if (generatedImage) {
    return (
      <div className="w-full flex flex-col items-center fade-in">
        <img
          src={generatedImage.imageUrl}
          alt="Generated Art"
          className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl mb-4 border-2 border-stone-700"
        />
        <div className="text-center space-y-3 mt-2">
            <p className="text-xs text-stone-400 bg-stone-800/50 px-3 py-1 rounded-full">
              {generatedImage.techDetails}
            </p>
            <a
                href={generatedImage.imageUrl}
                download={`ai_hinh_anh_${Date.now()}.png`}
                className="inline-flex btn-hover-lift btn-glow-cyan items-center justify-center bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-5 rounded-lg shadow-lg transition-all"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                {t('downloadButton')}
            </a>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center text-stone-500">
       <div className="relative w-48 h-48 mx-auto text-stone-700">
        <svg className="absolute inset-0 w-full h-full animate-[spin_20s_linear_infinite]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="1" strokeDasharray="4 8" />
        </svg>
         <svg className="absolute inset-0 w-full h-full animate-[spin_30s_linear_infinite_reverse]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
        </svg>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14.28 2.68001L19.49 5.09001C21.32 5.99001 22 7.82001 22 9.87001V14.18C22 16.23 21.32 18.06 19.49 18.96L14.28 21.37C12.98 21.98 11.02 21.98 9.72 21.37L4.51 18.96C2.68 18.06 2 16.23 2 14.18V9.87001C2 7.82001 2.68 5.99001 4.51 5.09001L9.72 2.68001C11.02 2.02001 12.98 2.02001 14.28 2.68001Z" stroke="currentColor" strokeWidth="1" />
            <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="1" />
            <path d="M8.5 2.5L12 12L15.5 2.5" stroke="currentColor" strokeWidth="1" />
            <path d="M2.5 7.5L12 12L2.5 16.5" stroke="currentColor" strokeWidth="1" />
            <path d="M21.5 7.5L12 12L21.5 16.5" stroke="currentColor" strokeWidth="1" />
            <path d="M8.5 21.5L12 12L15.5 21.5" stroke="currentColor" strokeWidth="1" />
        </svg>
       </div>
      <h3 className="mt-4 text-lg font-medium text-stone-300">{t('creativeSpace')}</h3>
      <p className="mt-1 text-sm text-stone-500 max-w-xs mx-auto">{t('creativeSpaceDesc')}</p>
    </div>
  );
};
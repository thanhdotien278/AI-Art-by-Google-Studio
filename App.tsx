import React, { useState, useCallback, useEffect } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { ImageCanvas } from './components/ImageCanvas';
import { FormData, GeneratedImageData, GeneratedVideoData, ImageFile, ActiveTab, Gender, UsageStats } from './types';
import { generateCompositedImage, generateEnhancedPrompt, processVideoRequest, generateVideoFromPrompt } from './services/geminiService';
import { getUsageStats } from './services/loggingService';
import { useLanguage } from './context/LanguageContext';
import { ContextAnalyzer } from './components/ContextAnalyzer';
import { VideoCreator } from './components/VideoCreator';


const App: React.FC = () => {
  // Image generation state
  const [formData, setFormData] = useState<FormData>({
    gender: 'Nam',
    framing: 'Bán thân',
    background: 'Tập trung nhân vật',
    theme: '',
    context: '',
    location: '',
    hairstyle: 'Mặc định',
    bodyShape: 'Mặc định',
    action: '',
    emotion: '',
    style: '',
  });
  const [imageFile, setImageFile] = useState<ImageFile | null>(null);
  const [referenceImageFile, setReferenceImageFile] = useState<ImageFile | null>(null);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImageData | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [editablePrompt, setEditablePrompt] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState<boolean>(false);
  
  // Video generation state
  const [videoFaceImage, setVideoFaceImage] = useState<ImageFile | null>(null);
  const [sceneSuggestions, setSceneSuggestions] = useState<string[] | null>(null);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState<boolean>(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState<boolean>(false);
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideoData | null>(null);
  const [generatedVideoPrompt, setGeneratedVideoPrompt] = useState<string | null>(null);
  const [isGeneratingVideoPrompt, setIsGeneratingVideoPrompt] = useState<boolean>(false);

  // Common state
  const [error, setError] = useState<string | null>(null);
  const [layout, setLayout] = useState<'split' | 'tabs'>('split');
  const [activeControlTab, setActiveControlTab] = useState<ActiveTab>('create');
  const [activeMobileTab, setActiveMobileTab] = useState<ActiveTab | 'canvas'>('create');
  const [notification, setNotification] = useState<string | null>(null);
  const { t, language } = useLanguage();
  const [usageStats, setUsageStats] = useState<{ data: UsageStats | null; error: boolean }>({ data: null, error: false });
  
  const fetchStats = useCallback(() => {
    getUsageStats().then(data => {
      if (data) {
        setUsageStats({ data, error: false });
      } else {
        setUsageStats(prev => ({ data: prev.data, error: true })); // Keep old data if exists, but show error
      }
    });
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const resetGenerationStates = () => {
      setError(null);
      setGeneratedImage(null);
      setGeneratedPrompt(null);
      setEditablePrompt(null);
      setGeneratedVideo(null);
      setSceneSuggestions(null);
      setGeneratedVideoPrompt(null);
  };

  const handleGenerateImageClick = useCallback(async () => {
    if (!imageFile) {
      setError(t('errorNoFaceImage'));
      return;
    }

    const finalPrompt = editablePrompt;

    setIsGeneratingImage(true);
    setError(null);
    setGeneratedImage(null);
    if(layout === 'tabs') setActiveMobileTab('canvas');

    if (finalPrompt) {
      setGeneratedPrompt(finalPrompt);
    }

    try {
      const result = await generateCompositedImage(formData, imageFile, referenceImageFile, language, finalPrompt);
      setGeneratedImage(result);
      fetchStats(); // Refresh stats
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message === 'GATEKEEPER_UNAUTHORIZED') {
            setError(t('gatekeeperUnauthorized'));
        } else if (err.message.includes("model does not support")) {
            setError(t('errorNoImageReturned'));
        } else {
            setError(t('errorWithMessage', { message: err.message }));
        }
      } else {
        setError(t('errorGeneric'));
      }
      console.error(err);
    } finally {
      setIsGeneratingImage(false);
    }
  }, [formData, imageFile, referenceImageFile, t, layout, language, editablePrompt, fetchStats]);

  const handleGenerateImageFromPrompt = useCallback(async (editedPrompt: string) => {
    if (!imageFile) {
        setError(t('errorNoFaceImage'));
        return;
    }

    setIsGeneratingImage(true);
    setError(null);
    setGeneratedImage(null);
    setGeneratedPrompt(editedPrompt);
    setEditablePrompt(editedPrompt);
    if(layout === 'tabs') setActiveMobileTab('canvas');

    try {
        const result = await generateCompositedImage(formData, imageFile, referenceImageFile, language, editedPrompt);
        setGeneratedImage(result);
        fetchStats();
    } catch (err: unknown) {
        if (err instanceof Error) {
            if (err.message === 'GATEKEEPER_UNAUTHORIZED') {
                setError(t('gatekeeperUnauthorized'));
            } else if (err.message.includes("model does not support")) {
                setError(t('errorNoImageReturned'));
            } else {
                setError(t('errorWithMessage', { message: err.message }));
            }
        } else {
            setError(t('errorGeneric'));
        }
        console.error(err);
    } finally {
        setIsGeneratingImage(false);
    }
  }, [formData, imageFile, referenceImageFile, language, t, layout, fetchStats]);
  
  const handleGeneratePromptClick = useCallback(async () => {
    setIsGeneratingPrompt(true);
    setError(null);
    setGeneratedImage(null);
    setGeneratedVideo(null);
    setSceneSuggestions(null);
    setGeneratedVideoPrompt(null);
    if(layout === 'tabs') setActiveMobileTab('canvas');

    try {
      const prompt = await generateEnhancedPrompt(formData, language);
      setGeneratedPrompt(prompt);
      setEditablePrompt(prompt);
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message === 'GATEKEEPER_UNAUTHORIZED') {
            setError(t('gatekeeperUnauthorized'));
        } else {
            setError(t('errorWithMessage', { message: err.message }));
        }
      } else {
        setError(t('errorGeneric'));
      }
      console.error(err);
    } finally {
      setIsGeneratingPrompt(false);
    }
  }, [formData, t, layout, language]);

  const handleVideoRequest = useCallback(async (
    mode: 'suggestions' | 'prompt' | 'video',
    requestText: string,
    gender: Gender,
    faceImage: ImageFile
  ) => {
    resetGenerationStates();
    if (layout === 'tabs' && mode !== 'suggestions') {
        setActiveMobileTab('canvas');
    }

    try {
        if (mode === 'suggestions') {
            setIsGeneratingSuggestions(true);
            const result = await processVideoRequest(requestText, gender, faceImage);
            if (result.suggestions) setSceneSuggestions(result.suggestions);
        } else if (mode === 'prompt') {
            setIsGeneratingVideoPrompt(true);
            const result = await processVideoRequest(requestText, gender, faceImage);
            if (result.prompt) setGeneratedVideoPrompt(result.prompt);
            else if (result.suggestions) setSceneSuggestions(result.suggestions);
        } else if (mode === 'video') {
            setIsGeneratingVideo(true);
            const result = await processVideoRequest(requestText, gender, faceImage);
            if (result.prompt && result.techDetails) {
                const videoResult = await generateVideoFromPrompt(result.prompt, faceImage, gender, requestText);
                setGeneratedVideo({ ...videoResult, techDetails: result.techDetails });
                fetchStats(); // Refresh stats
            } else if (result.suggestions) {
                setSceneSuggestions(result.suggestions);
            }
        }
    } catch (err: unknown) {
        if (err instanceof Error) {
            if (err.message === 'GATEKEEPER_UNAUTHORIZED') {
                setError(t('gatekeeperUnauthorized'));
            } else if (err.message.startsWith('SAFETY_VIOLATION:')) {
                setError(t('videoSafetyError'));
            } else {
                setError(t('videoError', { message: err.message }));
            }
        } else {
            setError(t('errorGeneric'));
        }
        console.error(err);
    } finally {
        setIsGeneratingSuggestions(false);
        setIsGeneratingVideoPrompt(false);
        setIsGeneratingVideo(false);
    }
  }, [t, layout, fetchStats]);

  const handleLoadContext = useCallback((context: Partial<FormData>) => {
    setFormData(prev => ({
        ...prev,
        ...context
    }));
    setActiveControlTab('create');
    setActiveMobileTab('create');
    setNotification(t('contextLoadedSuccess'));
    setTimeout(() => setNotification(null), 3000);
  }, [t]);

  const handleMobileTabClick = (tab: ActiveTab | 'canvas') => {
    setActiveMobileTab(tab);
    if (tab !== 'canvas') {
        setActiveControlTab(tab);
    }
  };
  
  const handleControlTabClick = (tab: ActiveTab) => {
      setActiveControlTab(tab);
      resetGenerationStates();
  };

  const creatorPanel = (
     <ControlPanel
        formData={formData}
        setFormData={setFormData}
        imageFile={imageFile}
        setImageFile={setImageFile}
        referenceImageFile={referenceImageFile}
        setReferenceImageFile={setReferenceImageFile}
        onGenerateImage={handleGenerateImageClick}
        onGeneratePrompt={handleGeneratePromptClick}
        isGeneratingImage={isGeneratingImage}
        isGeneratingPrompt={isGeneratingPrompt}
        layout={layout}
        setLayout={setLayout}
      />
  );

  const analyzerPanel = <ContextAnalyzer onLoadContext={handleLoadContext} />;

  const videoPanel = (
    <VideoCreator 
      faceImage={videoFaceImage}
      setFaceImage={setVideoFaceImage}
      onGenerate={handleVideoRequest}
      isGeneratingSuggestions={isGeneratingSuggestions}
      isGeneratingVideoPrompt={isGeneratingVideoPrompt}
      isGeneratingVideo={isGeneratingVideo}
      suggestions={sceneSuggestions}
    />
  );
  
  const renderActiveControlPanel = () => {
      switch(activeControlTab) {
          case 'create': return <div className="fade-in">{creatorPanel}</div>;
          case 'analyze': return <div className="fade-in">{analyzerPanel}</div>;
          case 'video': return <div className="fade-in">{videoPanel}</div>;
          default: return null;
      }
  }
  
  const UsageStatsPanel = () => {
    if (usageStats.error) {
       return (
         <div className="bg-stone-900/60 p-4 rounded-xl shadow-lg backdrop-blur-sm border border-stone-800 text-xs">
            <h4 className="font-bold text-stone-300 mb-2 border-b border-stone-700 pb-2 text-sm">{t('usageStatsTitle')}</h4>
            <p className="text-yellow-400">{t('statsError')}</p>
         </div>
       );
    }

    if (!usageStats.data) return null;

    return (
      <div className="bg-stone-900/60 p-4 rounded-xl shadow-lg backdrop-blur-sm border border-stone-800 text-xs">
        <h4 className="font-bold text-stone-300 mb-3 border-b border-stone-700 pb-2 text-sm">{t('usageStatsTitle')}</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-stone-400 font-semibold mb-1">{t('usageToday')}</div>
            <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cyan-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>
                <span className="text-stone-200 font-mono">{usageStats.data.today.images}</span>
            </div>
             <div className="flex items-center gap-2 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-400" viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 001.553.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>
                 <span className="text-stone-200 font-mono">{usageStats.data.today.videos}</span>
            </div>
          </div>
          <div>
            <div className="text-stone-400 font-semibold mb-1">{t('usageThisMonth')}</div>
            <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cyan-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>
                <span className="text-stone-200 font-mono">{usageStats.data.month.images}</span>
            </div>
             <div className="flex items-center gap-2 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-400" viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 001.553.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>
                 <span className="text-stone-200 font-mono">{usageStats.data.month.videos}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const canvasSection = (
    <div className="flex flex-col gap-6">
       <div className="relative flex-grow bg-stone-900/60 p-4 sm:p-6 rounded-2xl shadow-lg backdrop-blur-sm border border-stone-800 min-h-[60vh] lg:min-h-[80vh] flex items-center justify-center">
        <div className="absolute top-4 right-4 z-10 hidden lg:block"><UsageStatsPanel /></div>
        <ImageCanvas
          generatedImage={generatedImage}
          generatedVideo={generatedVideo}
          generatedPrompt={generatedPrompt}
          editablePrompt={editablePrompt}
          setEditablePrompt={setEditablePrompt}
          generatedVideoPrompt={generatedVideoPrompt}
          isGeneratingImage={isGeneratingImage}
          isGeneratingVideo={isGeneratingVideo}
          isGeneratingPrompt={isGeneratingPrompt}
          isGeneratingVideoPrompt={isGeneratingVideoPrompt}
          error={error}
          onGenerateFromPrompt={handleGenerateImageFromPrompt}
        />
      </div>
      <div className="lg:hidden"><UsageStatsPanel /></div>
      {activeControlTab === 'video' ? (
        <div className="bg-yellow-900/30 border border-yellow-700 text-yellow-200 px-4 py-3 rounded-xl text-sm" role="alert">
            <p>
            <strong className="font-bold">{t('noteLabel')} </strong>
            {t('videoQuotaNoteText')}{' '}
            <a href="https://aistudio.google.com/prompts/new_video" target="_blank" rel="noopener noreferrer" className="font-medium underline hover:text-yellow-100">
                Google AI Studio
            </a>
            </p>
        </div>
      ) : (
        <div className="bg-yellow-900/30 border border-yellow-700 text-yellow-200 px-4 py-3 rounded-xl text-sm" role="alert">
            <p>
            <strong className="font-bold">{t('noteLabel')} </strong>
            {t('imageQuotaNoteText')}{' '}
            <a href="https://aistudio.google.com/prompts/new_chat" target="_blank" rel="noopener noreferrer" className="font-medium underline hover:text-yellow-100">
                Google AI Studio
            </a>
            </p>
        </div>
      )}
    </div>
  );

  const AppTitle = () => (
    <div className="text-center mb-6">
      <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400 tracking-tight sm:text-5xl">
        AI Họa Sĩ Siêu Thực
      </h1>
      <p className="mt-2 text-sm text-stone-400 font-medium tracking-wide">
        Cung cấp bởi anhtuanpsu@gmail.com. {' '}
        {t('contactForFeedback')}{' '}
        <a href="https://www.facebook.com/bi.endy.9" target="_blank" rel="noopener noreferrer" className="font-semibold text-cyan-400 hover:text-cyan-300 hover:underline">
          Facebook
        </a>
      </p>
    </div>
  );

  const TabButton = ({ label, active, onClick, colorClass, icon }: { label: string, active: boolean, onClick: () => void, colorClass: string, icon: React.ReactNode }) => {
    const activeClasses = `text-white`;
    const inactiveClasses = 'text-stone-400 hover:text-white';
    return (
        <button onClick={onClick} className={`relative flex-1 group py-3 text-sm font-semibold transition ${active ? activeClasses : inactiveClasses}`}>
            <div className="flex items-center justify-center gap-2">
              {icon}
              <span className="relative z-10">{label}</span>
            </div>
            <span className={`absolute bottom-0 left-0 right-0 h-0.5 ${active ? colorClass : 'bg-transparent'} rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ${active ? 'scale-x-100' : ''}`}></span>
        </button>
    );
  };
  
  const MobileTabButton = ({ label, active, onClick, colorClass, icon }: { label: string, active: boolean, onClick: () => void, colorClass: string, icon: React.ReactNode }) => (
    <button onClick={onClick} className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 text-xs font-semibold rounded-lg transition ${active ? `${colorClass} text-white` : 'text-gray-400 hover:bg-stone-700/50'}`}>
        {icon}
        <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen text-gray-200">
      <main className="container mx-auto p-2 sm:p-4 md:p-6 lg:p-8">
        {layout === 'split' ? (
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4 bg-stone-900/60 p-4 sm:p-6 rounded-2xl shadow-2xl backdrop-blur-sm border border-stone-800 lg:sticky top-8">
              <div className="flex justify-center border-b border-stone-800 mb-6">
                 <TabButton label={t('controlsTab')} active={activeControlTab === 'create'} onClick={() => handleControlTabClick('create')} colorClass="bg-cyan-500" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 3.293A1 1 0 0118 4v12a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1h14.293zM4 6h12V5H4v1zm0 2h12v1H4V8zm0 2h12v1H4v-1zm0 2h12v1H4v-1z" /></svg>} />
                 <TabButton label={t('analyzeTab')} active={activeControlTab === 'analyze'} onClick={() => handleControlTabClick('analyze')} colorClass="bg-purple-500" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3.5a1.5 1.5 0 01.956 2.82l-2.68 2.396a3.5 3.5 0 10-2.34 5.923l-3.35 2.991A1.5 1.5 0 013 16.5a1.5 1.5 0 111.956-2.82l3.35-2.991a3.5 3.5 0 102.34-5.923l2.68-2.396A1.5 1.5 0 0110 3.5z"/></svg>} />
                 <TabButton label={t('videoTab')} active={activeControlTab === 'video'} onClick={() => handleControlTabClick('video')} colorClass="bg-red-500" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm14.25 1.5H15a.75.75 0 000 1.5h1.25a.75.75 0 000-1.5zM4 8a.75.75 0 00-.75.75v.5a.75.75 0 00.75.75h4a.75.75 0 000-1.5H4z" /></svg>} />
              </div>
              {renderActiveControlPanel()}
            </div>
            <div className="lg:col-span-8 flex flex-col gap-6">
              <AppTitle />
              {canvasSection}
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            <AppTitle />
            <div className="lg:hidden grid grid-cols-4 gap-1 p-1 bg-stone-900 rounded-xl my-4 border border-stone-800">
              <MobileTabButton label={t('controlsTab')} active={activeMobileTab === 'create'} onClick={() => handleMobileTabClick('create')} colorClass="bg-cyan-600" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 3.293A1 1 0 0118 4v12a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1h14.293zM4 6h12V5H4v1zm0 2h12v1H4V8zm0 2h12v1H4v-1zm0 2h12v1H4v-1z" /></svg>} />
              <MobileTabButton label={t('analyzeTab')} active={activeMobileTab === 'analyze'} onClick={() => handleMobileTabClick('analyze')} colorClass="bg-purple-600" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3.5a1.5 1.5 0 01.956 2.82l-2.68 2.396a3.5 3.5 0 10-2.34 5.923l-3.35 2.991A1.5 1.5 0 013 16.5a1.5 1.5 0 111.956-2.82l3.35-2.991a3.5 3.5 0 102.34-5.923l2.68-2.396A1.5 1.5 0 0110 3.5z"/></svg>} />
              <MobileTabButton label={t('videoTab')} active={activeMobileTab === 'video'} onClick={() => handleMobileTabClick('video')} colorClass="bg-red-600" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm14.25 1.5H15a.75.75 0 000 1.5h1.25a.75.75 0 000-1.5zM4 8a.75.75 0 00-.75.75v.5a.75.75 0 00.75.75h4a.75.75 0 000-1.5H4z" /></svg>} />
              <MobileTabButton label={t('canvasTab')} active={activeMobileTab === 'canvas'} onClick={() => handleMobileTabClick('canvas')} colorClass="bg-blue-600" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>} />
            </div>

            <div className={`bg-stone-900/60 p-4 sm:p-6 rounded-2xl shadow-lg backdrop-blur-sm border border-stone-800 ${activeMobileTab !== 'canvas' ? 'block' : 'hidden'}`}>
                {renderActiveControlPanel()}
            </div>

            <div className={`mt-6 ${activeMobileTab === 'canvas' ? 'flex flex-col gap-6' : 'hidden'}`}>
                {canvasSection}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
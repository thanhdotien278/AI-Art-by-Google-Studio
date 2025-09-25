import React, { useState } from 'react';
import { FormData, ImageFile, Gender } from '../types';
import { ImageUpload } from './ImageUpload';
import { analyzeImageAndExtractDetails, rewriteContextForGender } from '../services/geminiService';
import { useLanguage } from '../context/LanguageContext';

interface ContextAnalyzerProps {
  onLoadContext: (context: Partial<FormData>) => void;
}

export const ContextAnalyzer: React.FC<ContextAnalyzerProps> = ({ onLoadContext }) => {
  const [imageFile, setImageFile] = useState<ImageFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSwappingGender, setIsSwappingGender] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Partial<FormData> | null>(null);
  const { t, language } = useLanguage();

  const handleAnalyze = async () => {
    if (!imageFile) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const analysisResult = await analyzeImageAndExtractDetails(imageFile, language);
      setResult(analysisResult);
    } catch (err) {
      console.error("Analysis failed:", err);
      if (err instanceof Error && err.message === 'GATEKEEPER_UNAUTHORIZED') {
          setError(t('gatekeeperUnauthorized'));
      } else {
          setError(t('analysisError'));
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGenderSwap = async () => {
    if (!result || !result.gender) return;

    setIsSwappingGender(true);
    setError(null);
    try {
        const targetGender = result.gender === 'Nam' ? 'Nữ' : 'Nam';
        const rewrittenResult = await rewriteContextForGender(result, targetGender, language);
        setResult(rewrittenResult);
    } catch (err) {
        console.error("Gender swap failed:", err);
        if (err instanceof Error && err.message === 'GATEKEEPER_UNAUTHORIZED') {
            setError(t('gatekeeperUnauthorized'));
        } else {
            setError(t('genderSwapError'));
        }
    } finally {
        setIsSwappingGender(false);
    }
  };

  const handleLoadContext = () => {
    if(result) {
        onLoadContext(result);
    }
  }
  
  const displayKey = (key: string) => {
      const keyMap: { [key: string]: string } = {
          gender: 'genderLabel',
          theme: 'themeLabel',
          context: 'contextLabel',
          location: 'locationLabel',
          action: 'actionLabel',
          emotion: 'emotionLabel',
          style: 'styleLabel'
      };
      return t(keyMap[key] || key);
  }

  return (
    <div className="space-y-6">
      <div className="p-3 bg-stone-800/50 border border-stone-700 rounded-lg text-xs space-y-1 text-stone-400">
        <h4 className="font-semibold text-stone-300 mb-1">{t('guideTitle')}</h4>
        <ul className="list-decimal list-inside space-y-1">
            <li>{t('analyzeGuideStep1')}</li>
            <li>{t('analyzeGuideStep2')}</li>
            <li>{t('analyzeGuideStep3')}</li>
        </ul>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-300 mb-1">
          {t('analyzeImagePrompt')}
        </label>
        <ImageUpload imageFile={imageFile} setImageFile={setImageFile} />
      </div>
      
      <button
        onClick={handleAnalyze}
        disabled={isLoading || !imageFile}
        className="w-full btn-hover-lift btn-glow-purple flex justify-center items-center bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-all disabled:from-stone-600 disabled:to-stone-700 disabled:shadow-none disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {t('analyzingButton')}
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3.5a1.5 1.5 0 01.956 2.82l-2.68 2.396a3.5 3.5 0 10-2.34 5.923l-3.35 2.991A1.5 1.5 0 013 16.5a1.5 1.5 0 111.956-2.82l3.35-2.991a3.5 3.5 0 102.34-5.923l2.68-2.396A1.5 1.5 0 0110 3.5z" /></svg>
            {t('analyzeButton')}
          </>
        )}
      </button>

      {error && <p className="text-center text-red-400 bg-red-900/50 p-3 rounded-lg border border-red-800">{error}</p>}
      
      {isLoading && (
         <div className="text-center text-stone-400 pt-4 border-t border-stone-800">
            <svg className="animate-spin mx-auto h-8 w-8 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-2">{t('analyzingButton')}</p>
        </div>
      )}

      {result && (
        <div className="space-y-4 pt-4 border-t border-stone-800 fade-in">
            <h3 className="text-lg font-semibold text-stone-200">{t('analysisResultsTitle')}</h3>
            <div className="bg-stone-900/50 p-4 rounded-lg border border-stone-700 space-y-3">
              {Object.entries(result).map(([key, value]) => {
                 if (key === 'gender') {
                    const targetGender = value === 'Nam' ? 'Nữ' : 'Nam';
                    const buttonText = targetGender === 'Nam' ? t('swapGenderToMale') : t('swapGenderToFemale');
                    return (
                        <div key={key} className="grid grid-cols-3 gap-2 text-sm items-center">
                            <dt className="font-semibold text-stone-400 capitalize col-span-1">{displayKey(key)}</dt>
                            <dd className="text-stone-200 col-span-2 flex items-center gap-3">
                                <span>{value as string || t('notDetected')}</span>
                                <button
                                    onClick={handleGenderSwap}
                                    disabled={isSwappingGender || isLoading}
                                    className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 disabled:text-stone-500 disabled:cursor-wait transition flex items-center"
                                >
                                    {isSwappingGender ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            {t('swappingGender')}
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                                            {buttonText}
                                        </>
                                    )}
                                </button>
                            </dd>
                        </div>
                    );
                }
                return (
                    <div key={key} className="grid grid-cols-3 gap-2 text-sm">
                    <dt className="font-semibold text-stone-400 capitalize col-span-1">{displayKey(key)}</dt>
                    <dd className="text-stone-200 col-span-2">{value as string || t('notDetected')}</dd>
                    </div>
                );
              })}
            </div>
             <button
                onClick={handleLoadContext}
                className="w-full btn-hover-lift btn-glow-cyan flex justify-center items-center bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>
                {t('loadContextButton')}
            </button>
        </div>
      )}

      {!result && !isLoading && !error && (
        <div className="text-center text-stone-500 pt-4 border-t border-stone-800">
          <p>{t('analysisPlaceholder')}</p>
        </div>
      )}
    </div>
  );
};
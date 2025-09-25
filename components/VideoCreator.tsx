
import React, { useState } from 'react';
import { Gender, ImageFile } from '../types';
import { ImageUpload } from './ImageUpload';
import { useLanguage } from '../context/LanguageContext';

interface VideoCreatorProps {
    faceImage: ImageFile | null;
    setFaceImage: (file: ImageFile | null) => void;
    onGenerate: (mode: 'suggestions' | 'prompt' | 'video', requestText: string, gender: Gender, faceImage: ImageFile) => void;
    isGeneratingSuggestions: boolean;
    isGeneratingVideoPrompt: boolean;
    isGeneratingVideo: boolean;
    suggestions: string[] | null;
}

const SelectField: React.FC<{
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  required?: boolean;
}> = ({ label, name, value, onChange, options, required }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-stone-300 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      className="w-full bg-stone-800/50 border border-stone-700 rounded-lg shadow-sm py-2.5 px-3 text-white transition appearance-none form-input-glow-red"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
        backgroundPosition: 'right 0.5rem center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '1.5em 1.5em',
      }}
    >
      {options.map(option => (
        <option className="bg-stone-800" key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  </div>
);


export const VideoCreator: React.FC<VideoCreatorProps> = ({
    faceImage,
    setFaceImage,
    onGenerate,
    isGeneratingSuggestions,
    isGeneratingVideoPrompt,
    isGeneratingVideo,
    suggestions
}) => {
    const [requestText, setRequestText] = useState('');
    const [gender, setGender] = useState<Gender>('Nam');
    const { t } = useLanguage();

    const isLoading = isGeneratingSuggestions || isGeneratingVideo || isGeneratingVideoPrompt;

    const handleAction = (mode: 'prompt' | 'video') => {
        if (faceImage && requestText) {
            onGenerate(mode, requestText, gender, faceImage);
        }
    };
    
    const handleGetSuggestions = () => {
         if (faceImage) {
            const suggestionPrompt = requestText.trim() || 'suggest video scenes';
            onGenerate('suggestions', suggestionPrompt, gender, faceImage);
        }
    }

    const genderOptions = [
        { value: 'Nam', label: t('genderMale') },
        { value: 'Nữ', label: t('genderFemale') },
    ];

    return (
        <div className="space-y-6">
            <div className="p-3 bg-stone-800/50 border border-stone-700 rounded-lg text-xs space-y-1 text-stone-400">
                <h4 className="font-semibold text-stone-300 mb-1">{t('guideTitle')}</h4>
                <ul className="list-decimal list-inside space-y-1">
                    <li>{t('videoGuideStep1')}</li>
                    <li>{t('videoGuideStep2')}</li>
                    <li>{t('videoGuideStep3')}</li>
                    <li>{t('videoGuideStep4')}</li>
                </ul>
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-stone-300 mb-1">
                        {t('videoFaceImageLabel')} <span className="text-red-500">*</span>
                    </label>
                    <ImageUpload imageFile={faceImage} setImageFile={setFaceImage} />
                </div>
                
                <SelectField
                    label={t('genderLabel')}
                    name="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                    options={genderOptions}
                    required
                />
            </div>
            
            <div className="space-y-2">
                <div>
                    <label htmlFor="video-request" className="block text-sm font-medium text-stone-300 mb-1">
                        {t('videoRequestLabel')}
                    </label>
                    <textarea
                        id="video-request"
                        name="video-request"
                        rows={4}
                        value={requestText}
                        onChange={(e) => setRequestText(e.target.value)}
                        placeholder={t('videoRequestPlaceholder')}
                        className="w-full bg-stone-800/50 border border-stone-700 rounded-lg shadow-sm py-2 px-3 text-white placeholder-stone-500 transition form-input-glow-red"
                    />
                </div>
                 <button
                    onClick={handleGetSuggestions}
                    disabled={isLoading || !faceImage}
                    className="w-full btn-hover-lift btn-glow-yellow flex justify-center items-center bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2.5 px-4 rounded-lg shadow-lg transition-all disabled:bg-stone-700 disabled:shadow-none disabled:cursor-not-allowed"
                >
                     {isGeneratingSuggestions ? (
                        <>
                         <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                         {t('generatingSuggestionsButton')}
                        </>
                     ) : (
                        <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                           <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 14.464A1 1 0 106.465 13.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zm.707-12.021a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414L5.757 3.85a1 1 0 010-1.414zM4 11a1 1 0 100-2H3a1 1 0 100 2h1z" />
                        </svg>
                        {t('getSuggestionsButton')}
                        </>
                     )}
                </button>
            </div>
            
            
            {suggestions && (
                <div className="space-y-3 pt-4 border-t border-stone-800 fade-in">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-stone-200">{t('sceneSuggestionsTitle')}</h3>
                         <button onClick={handleGetSuggestions} disabled={isLoading || !faceImage} className="flex items-center text-sm text-cyan-400 hover:text-cyan-300 disabled:text-stone-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                            </svg>
                            {t('reloadSuggestionsButton')}
                        </button>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                        {suggestions.map((suggestion, index) => (
                            <button
                                key={index}
                                onClick={() => setRequestText(suggestion)}
                                className="w-full text-left p-3 bg-stone-800/80 hover:bg-gradient-to-r hover:from-red-600/30 hover:to-orange-500/30 rounded-lg transition text-sm text-stone-300 border border-stone-700 hover:border-red-500/50"
                            >
                                <span className="font-semibold text-orange-400/80 mr-2">{index + 1}.</span>{suggestion}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t border-stone-800">
                <button
                onClick={() => handleAction('prompt')}
                disabled={isLoading || !faceImage || !requestText}
                className="w-full btn-hover-lift btn-glow-purple flex justify-center items-center bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-all disabled:bg-stone-700 disabled:shadow-none disabled:cursor-not-allowed"
                >
                {isGeneratingVideoPrompt ? (
                    <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    {t('generatingVideoPromptButton')}
                    </>
                ) : (
                    <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5a.75.75 0 00.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clipRule="evenodd" /><path fillRule="evenodd" d="M6.194 12.753a.75.75 0 001.06 0l6.25-6.25a.75.75 0 00-1.06-1.06L7.25 11.694 6.194 12.753z" clipRule="evenodd" /></svg>
                    {t('generateVideoPromptButton')}
                    </>
                )}
                </button>
                <button
                onClick={() => handleAction('video')}
                disabled={isLoading || !faceImage || !requestText}
                className="w-full btn-hover-lift btn-glow-red flex justify-center items-center bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-all disabled:from-stone-600 disabled:to-stone-700 disabled:shadow-none disabled:cursor-not-allowed"
                >
                {isGeneratingVideo ? (
                    <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    {t('generatingVideoButton')}
                    </>
                ) : (
                   <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 001.553.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>
                    {t('generateVideoButton')}
                   </>
                )}
                </button>
            </div>
        </div>
    );
};

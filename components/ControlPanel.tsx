import React from 'react';
import { FormData, ImageFile } from '../types';
import { ImageUpload } from './ImageUpload';
import { useLanguage } from '../context/LanguageContext';

type Layout = 'split' | 'tabs';

interface ControlPanelProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  imageFile: ImageFile | null;
  setImageFile: React.Dispatch<React.SetStateAction<ImageFile | null>>;
  referenceImageFile: ImageFile | null;
  setReferenceImageFile: React.Dispatch<React.SetStateAction<ImageFile | null>>;
  onGenerateImage: () => void;
  onGeneratePrompt: () => void;
  isGeneratingImage: boolean;
  isGeneratingPrompt: boolean;
  layout: Layout;
  setLayout: React.Dispatch<React.SetStateAction<Layout>>;
}

const FormSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="space-y-4">
        <h3 className="text-sm font-semibold text-stone-400 border-b border-stone-700/80 pb-2 mb-4">{title}</h3>
        {children}
    </div>
);


const InputField: React.FC<{
  label: string;
  name: keyof FormData;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  icon?: React.ReactElement;
  className?: string;
}> = ({ label, name, value, onChange, placeholder, icon, className }) => (
  <div className={className}>
    <label htmlFor={name} className="block text-sm font-medium text-stone-300 mb-1">
      {label}
    </label>
    <div className="relative">
       {icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">{icon}</div>}
       <input
        type="text"
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full bg-stone-800/50 border border-stone-700 rounded-lg shadow-sm py-2.5 ${icon ? 'pl-10' : 'px-3'} text-white placeholder-stone-500 transition form-input-glow`}
      />
    </div>
  </div>
);

const SelectField: React.FC<{
  label: string;
  name: keyof FormData;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  className?: string;
}> = ({ label, name, value, onChange, options, required, className }) => (
  <div className={className}>
    <label htmlFor={name} className="block text-sm font-medium text-stone-300 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      className="w-full bg-stone-800/50 border border-stone-700 rounded-lg shadow-sm py-2.5 px-3 text-white transition appearance-none form-input-glow"
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

const LanguageSwitcher: React.FC = () => {
    const { language, setLanguage } = useLanguage();
    const activeClass = "bg-cyan-600 text-white";
    const inactiveClass = "bg-stone-700 hover:bg-stone-600 text-stone-300";

    return (
        <div className="flex p-0.5 bg-stone-800 rounded-lg">
            <button onClick={() => setLanguage('vi')} className={`px-3 py-1 text-xs font-semibold rounded-md transition ${language === 'vi' ? activeClass : inactiveClass}`}>
                VI
            </button>
            <button onClick={() => setLanguage('en')} className={`px-3 py-1 text-xs font-semibold rounded-md transition ${language === 'en' ? activeClass : inactiveClass}`}>
                EN
            </button>
        </div>
    );
};

const LayoutSwitcher: React.FC<{ layout: Layout, setLayout: (layout: Layout) => void }> = ({ layout, setLayout }) => {
    const { t } = useLanguage();
    const activeClass = "bg-cyan-600 text-white";
    const inactiveClass = "bg-stone-700 hover:bg-stone-600 text-stone-300";

    return (
        <div className="flex p-0.5 bg-stone-800 rounded-lg">
            <button onClick={() => setLayout('split')} className={`p-1.5 rounded-md transition ${layout === 'split' ? activeClass : inactiveClass}`} title={t('layoutSplitTooltip')} aria-label={t('layoutSplitTooltip')}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3 19V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2-2H5a2 2 0 0 1-2-2Zm2-14v14h8V5H5Z"/></svg>
            </button>
            <button onClick={() => setLayout('tabs')} className={`p-1.5 rounded-md transition ${layout === 'tabs' ? activeClass : inactiveClass}`} title={t('layoutTabsTooltip')} aria-label={t('layoutTabsTooltip')}>
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M6 21a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2-2H6Zm2-2h8V5H8v14Z"/></svg>
            </button>
        </div>
    );
};

export const ControlPanel: React.FC<ControlPanelProps> = ({
  formData,
  setFormData,
  imageFile,
  setImageFile,
  referenceImageFile,
  setReferenceImageFile,
  onGenerateImage,
  onGeneratePrompt,
  isGeneratingImage,
  isGeneratingPrompt,
  layout,
  setLayout
}) => {
  const { t } = useLanguage();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value as any }));
  };
  
  const iconProps = "h-5 w-5 text-stone-500";

  const genderOptions = [ { value: 'Nam', label: t('genderMale') }, { value: 'Nữ', label: t('genderFemale') }];
  const framingOptions = [ { value: 'Chân dung', label: t('framingPortrait') }, { value: 'Bán thân', label: t('framingHalfBody') }, { value: 'Toàn thân', label: t('framingFullBody') }];
  const backgroundOptions = [ { value: 'Tập trung nhân vật', label: t('backgroundFocusCharacter')}, { value: 'Bối cảnh rộng và chi tiết', label: t('backgroundFocusDetailed')}];
  
  const hairstyleOptions = formData.gender === 'Nam' ? [
    { value: 'Mặc định', label: t('hairstyleDefault') },
    { value: 'Tóc ngắn gọn gàng', label: t('hairstyleMale1') },
    { value: 'Tóc vuốt ngược', label: t('hairstyleMale2') },
    { value: 'Tóc xoăn nhẹ', label: t('hairstyleMale3') },
  ] : [
    { value: 'Mặc định', label: t('hairstyleDefault') },
    { value: 'Tóc dài thẳng', label: t('hairstyleFemale1') },
    { value: 'Tóc gợn sóng', label: t('hairstyleFemale2') },
    { value: 'Tóc búi cao', label: t('hairstyleFemale3') },
  ];
  
  const bodyShapeOptions = formData.gender === 'Nam' ? [
     { value: 'Mặc định', label: t('bodyShapeDefault') },
     { value: 'Thon gọn', label: t('bodyShapeMale1') },
     { value: 'Cơ bắp', label: t('bodyShapeMale2') },
     { value: 'Vạm vỡ', label: t('bodyShapeMale3') },
  ] : [
     { value: 'Mặc định', label: t('bodyShapeDefault') },
     { value: 'Thon gọn', label: t('bodyShapeFemale1') },
     { value: 'Nở nang (đồng hồ cát)', label: t('bodyShapeFemale2') },
     { value: 'Cân đối', label: t('bodyShapeFemale3') },
  ];


  const isLoading = isGeneratingImage || isGeneratingPrompt;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-cyan-400">{t('controlPanelTitle')}</h2>
        <div className="flex items-center space-x-2">
          <LanguageSwitcher />
          <LayoutSwitcher layout={layout} setLayout={setLayout} />
        </div>
      </div>

      <div className="p-3 bg-stone-800/50 border border-stone-700 rounded-lg text-xs space-y-1 text-stone-400">
        <h4 className="font-semibold text-stone-300 mb-1">{t('guideTitle')}</h4>
        <ul className="list-decimal list-inside space-y-1">
            <li>{t('createGuideStep1')}</li>
            <li>{t('createGuideStep2')}</li>
            <li>{t('createGuideStep3')}</li>
            <li>{t('createGuideStep4')}</li>
        </ul>
      </div>
      
      <FormSection title={t('sectionTitleUpload')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
            <label className="block text-sm font-medium text-stone-300 mb-1">
                {t('faceImageLabel')} <span className="text-red-500">*</span>
            </label>
            <ImageUpload imageFile={imageFile} setImageFile={setImageFile} />
            </div>
            <div>
            <label className="block text-sm font-medium text-stone-300 mb-1">
                {t('referenceImageLabel')}
            </label>
            <ImageUpload imageFile={referenceImageFile} setImageFile={setReferenceImageFile} />
            </div>
        </div>
      </FormSection>

      <FormSection title={t('sectionTitleBasic')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField label={t('genderLabel')} name="gender" value={formData.gender} onChange={handleInputChange} options={genderOptions} required />
            <SelectField label={t('framingLabel')} name="framing" value={formData.framing} onChange={handleInputChange} options={framingOptions} required />
            <SelectField className="sm:col-span-2" label={t('backgroundFocusLabel')} name="background" value={formData.background} onChange={handleInputChange} options={backgroundOptions} required />
            <SelectField label={t('hairstyleLabel')} name="hairstyle" value={formData.hairstyle} onChange={handleInputChange} options={hairstyleOptions} />
            <SelectField label={t('bodyShapeLabel')} name="bodyShape" value={formData.bodyShape} onChange={handleInputChange} options={bodyShapeOptions} />
        </div>
      </FormSection>
      
      <FormSection title={t('sectionTitleDetails')}>
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField className="sm:col-span-2" label={t('themeLabel')} name="theme" value={formData.theme} onChange={handleInputChange} placeholder={t('themePlaceholder')} icon={<svg xmlns="http://www.w3.org/2000/svg" className={iconProps} viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>} />
            <InputField className="sm:col-span-2" label={t('contextLabel')} name="context" value={formData.context} onChange={handleInputChange} placeholder={t('contextPlaceholder')} icon={<svg xmlns="http://www.w3.org/2000/svg" className={iconProps} viewBox="0 0 20 20" fill="currentColor"><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /><path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.18l1.13-1.954a1.65 1.65 0 011.625-.87c.563 0 1.08.32 1.373.812l1.026 1.777a1.65 1.65 0 002.398 0l1.026-1.777a1.65 1.65 0 011.373-.812c.563 0 1.08.32 1.625.87l1.13 1.954a1.651 1.651 0 010 1.18l-1.13 1.954a1.65 1.65 0 01-1.625.87c-.563 0-1.08-.32-1.373-.812l-1.026-1.777a1.65 1.65 0 00-2.398 0l-1.026 1.777a1.65 1.65 0 01-1.373-.812c-.563 0-1.08-.32-1.625-.87l-1.13-1.954z" clipRule="evenodd" /></svg>} />
            <InputField className="sm:col-span-2" label={t('locationLabel')} name="location" value={formData.location} onChange={handleInputChange} placeholder={t('locationPlaceholder')} icon={<svg xmlns="http://www.w3.org/2000/svg" className={iconProps} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>} />
            <InputField className="sm:col-span-2" label={t('actionLabel')} name="action" value={formData.action} onChange={handleInputChange} placeholder={t('actionPlaceholder')} icon={<svg xmlns="http://www.w3.org/2000/svg" className={iconProps} viewBox="0 0 20 20" fill="currentColor"><path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.095a1.23 1.23 0 00.41-1.412A9.99 9.99 0 0010 12c-2.31 0-4.438.784-6.131 2.095z" /></svg>} />
            <InputField label={t('emotionLabel')} name="emotion" value={formData.emotion} onChange={handleInputChange} placeholder={t('emotionPlaceholder')} icon={<svg xmlns="http://www.w3.org/2000/svg" className={iconProps} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-7.536 5.879a.75.75 0 001.072 0l1.464-1.465a.25.25 0 01.354 0l1.464 1.465a.75.75 0 001.072 0l3.182-3.182a.75.75 0 10-1.06-1.061L12 12.939l-1.464-1.464a.25.25 0 00-.354 0L8.717 12.94l-1.465-1.464a.75.75 0 00-1.06 1.06l2.343 2.343z" clipRule="evenodd" /></svg>} />
            <InputField label={t('styleLabel')} name="style" value={formData.style} onChange={handleInputChange} placeholder={t('stylePlaceholder')} icon={<svg xmlns="http://www.w3.org/2000/svg" className={iconProps} viewBox="0 0 20 20" fill="currentColor"><path d="M4 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H4zM3 3a3 3 0 013-3h8a3 3 0 013 3v.5a.5.5 0 01-1 0V3a2 2 0 00-2-2H6a2 2 0 00-2 2v.5a.5.5 0 01-1 0V3z" /><path d="M6.5 7a.5.5 0 000 1h7a.5.5 0 000-1h-7zM6.5 11a.5.5 0 000 1h3a.5.5 0 000-1h-3z" /></svg>} />
         </div>
      </FormSection>

      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t border-stone-700/80">
        <button
          onClick={onGeneratePrompt}
          disabled={isLoading}
          className="w-full btn-hover-lift btn-glow-purple flex justify-center items-center bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-all disabled:bg-stone-700 disabled:shadow-none disabled:cursor-not-allowed"
        >
          {isGeneratingPrompt ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t('generatingPromptButton')}
            </>
          ) : (
             <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5a.75.75 0 00.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clipRule="evenodd" /><path fillRule="evenodd" d="M6.194 12.753a.75.75 0 001.06 0l6.25-6.25a.75.75 0 00-1.06-1.06L7.25 11.694 6.194 12.753z" clipRule="evenodd" /></svg>
                {t('generatePromptButton')}
             </>
          )}
        </button>
        <button
          onClick={onGenerateImage}
          disabled={isLoading || !imageFile}
          className="w-full btn-hover-lift btn-glow-cyan flex justify-center items-center bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-all disabled:from-stone-600 disabled:to-stone-700 disabled:shadow-none disabled:cursor-not-allowed"
        >
          {isGeneratingImage ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t('generatingImageButton')}
            </>
          ) : (
            <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /><path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.18l1.13-1.954a1.65 1.65 0 011.625-.87c.563 0 1.08.32 1.373.812l1.026 1.777a1.65 1.65 0 002.398 0l1.026-1.777a1.65 1.65 0 011.373-.812c.563 0 1.08.32 1.625.87l1.13 1.954a1.651 1.651 0 010 1.18l-1.13 1.954a1.65 1.65 0 01-1.625.87c-.563 0-1.08-.32-1.373-.812l-1.026-1.777a1.65 1.65 0 00-2.398 0l-1.026 1.777a1.65 1.65 0 01-1.373-.812c-.563 0-1.08-.32-1.625-.87l-1.13-1.954z" clipRule="evenodd" /></svg>
                {t('generateImageButton')}
            </>
          )}
        </button>
      </div>
    </div>
  );
};
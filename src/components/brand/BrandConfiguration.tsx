import React, { useState, useEffect } from 'react';
import { useApp } from '@/store/AppContext';
import { api } from '@/services/api';
import { ColorPalette } from './ColorPalette';
import { FileUpload } from './FileUpload';
import type { BrandColor, FileData } from '@/types';

export function BrandConfiguration() {
  const { currentSession, updateSession } = useApp();
  
  const [brandColors, setBrandColors] = useState<BrandColor[]>([]);
  const [textGuidelines, setTextGuidelines] = useState('');
  const [labelDescription, setLabelDescription] = useState('');
  const [visualAnalysis, setVisualAnalysis] = useState('');
  const [designSystemPdf, setDesignSystemPdf] = useState<FileData[]>([]);
  const [fewShotImages, setFewShotImages] = useState<FileData[]>([]);
  const [correctLabelImages, setCorrectLabelImages] = useState<FileData[]>([]);
  const [incorrectLabelImages, setIncorrectLabelImages] = useState<FileData[]>([]);
  const [distilling, setDistilling] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');

  // Load session data when selected
  useEffect(() => {
    if (currentSession) {
      setBrandColors(currentSession.brandColors || []);
      setTextGuidelines(currentSession.textGuidelines || '');
      setLabelDescription(currentSession.labelDescription || '');
      setVisualAnalysis(currentSession.visualAnalysis || '');
      setDesignSystemPdf(currentSession.designSystemPdf || []);
      setFewShotImages(currentSession.fewShotImages || []);
      setCorrectLabelImages(currentSession.correctLabelImages || []);
      setIncorrectLabelImages(currentSession.incorrectLabelImages || []);
    }
  }, [currentSession]);

  // Auto-save on changes
  const saveSession = async () => {
    if (!currentSession) return;
    
    setSaveStatus('saving');
    try {
      await updateSession(currentSession.id, {
        brandColors,
        textGuidelines,
        labelDescription,
        visualAnalysis,
        designSystemPdf,
        fewShotImages,
        correctLabelImages,
        incorrectLabelImages,
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('idle');
    }
  };

  // Debounced save - only trigger when values actually change
  useEffect(() => {
    if (!currentSession) return;
    
    // Check if any values have actually changed from current session
    const hasChanges = 
      JSON.stringify(brandColors) !== JSON.stringify(currentSession.brandColors) ||
      textGuidelines !== currentSession.textGuidelines ||
      labelDescription !== currentSession.labelDescription ||
      visualAnalysis !== currentSession.visualAnalysis ||
      JSON.stringify(designSystemPdf) !== JSON.stringify(currentSession.designSystemPdf) ||
      JSON.stringify(fewShotImages) !== JSON.stringify(currentSession.fewShotImages) ||
      JSON.stringify(correctLabelImages) !== JSON.stringify(currentSession.correctLabelImages) ||
      JSON.stringify(incorrectLabelImages) !== JSON.stringify(currentSession.incorrectLabelImages);
    
    if (!hasChanges) return; // Don't save if nothing changed
    
    const timer = setTimeout(saveSession, 2000); // Increased to 2 seconds
    return () => clearTimeout(timer);
  }, [brandColors, textGuidelines, labelDescription, visualAnalysis, designSystemPdf, fewShotImages, correctLabelImages, incorrectLabelImages, currentSession]);

  const handleDistill = async () => {
    if (!currentSession) return;

    const contextImages = [
      ...designSystemPdf,
      ...fewShotImages,
      ...correctLabelImages,
      ...incorrectLabelImages,
    ];

    if (contextImages.length === 0) {
      setStatusMessage('Please upload images in sections 1.2 and 1.3 before distilling.');
      return;
    }

    setDistilling(true);
    setStatusMessage('Analyzing visual context...');

    try {
      const response = await api.distill(currentSession.provider, {
        labelDescription,
        images: contextImages,
      });

      if (response.ok && response.data) {
        setVisualAnalysis(response.data.text);
        setStatusMessage('Distillation completed successfully!');
      } else {
        setStatusMessage(`Error: ${response.error}`);
      }
    } catch (error) {
      setStatusMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDistilling(false);
    }
  };

  if (!currentSession) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">No Session Selected</h3>
          <p className="text-gray-500 dark:text-gray-400">Select a brand session from the sidebar or create a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="card">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-brand-700 mb-2">
                {currentSession.name}
              </h2>
              {currentSession.description && (
                <p className="text-gray-600">{currentSession.description}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">AI Provider</label>
                <select
                  value={currentSession.provider}
                  onChange={async (e) => {
                    await updateSession(currentSession.id, { provider: e.target.value as any });
                  }}
                  className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="gemini">Gemini (PDF support)</option>
                  <option value="openai">OpenAI</option>
                  <option value="grok">Grok</option>
                </select>
              </div>
              <div className="text-sm text-right">
                {saveStatus === 'saving' && (
                  <span className="text-blue-600 flex items-center gap-1">
                    <span className="animate-spin">⏳</span> Saving...
                  </span>
                )}
                {saveStatus === 'saved' && (
                  <span className="text-green-600 flex items-center gap-1">
                    ✓ Saved
                  </span>
                )}
                {saveStatus === 'idle' && (
                  <span className="text-gray-400 text-xs">Auto-save enabled</span>
                )}
              </div>
            </div>
          </div>
          {statusMessage && (
            <div className={`mt-3 p-3 text-sm rounded-lg ${
              statusMessage.includes('Error') 
                ? 'bg-red-50 text-red-700 border border-red-200' 
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {statusMessage}
            </div>
          )}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-300">
            <p className="font-semibold mb-1">📚 Configuration Guide</p>
            <p>Follow the steps below to set up your brand guidelines. All changes save automatically.</p>
          </div>
        </div>

        {/* Color Palette */}
        <ColorPalette colors={brandColors} onChange={setBrandColors} />

        {/* Text Guidelines */}
        <div className="card">
          <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
            📝 Step 2: Written Guidelines
          </label>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Define your brand's typography, tone of voice, and legal requirements (e.g., required disclaimers)
          </p>
          <textarea
            value={textGuidelines}
            onChange={(e) => setTextGuidelines(e.target.value)}
            rows={12}
            className="w-full input-field font-mono text-sm"
            placeholder="# BRAND MANUAL - [Brand Name]&#10;&#10;## Typography&#10;- Headlines: Font name, min size&#10;- Body text: Font name, min size&#10;&#10;## Tone of Voice&#10;- Professional, inspiring, direct&#10;&#10;## Legal Requirements&#10;- Required disclaimers for claims"
          />
        </div>

        {/* Visual Assets */}
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">🖼️ Step 3: Visual Assets</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Upload your design system and examples of approved brand usage
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FileUpload
              label="1.2.1 Design System / Manual (PDF)"
              accept=".pdf"
              files={designSystemPdf}
              onChange={setDesignSystemPdf}
              placeholder="Upload PDF design system"
            />
            <FileUpload
              label="1.2.2 Approved Examples (5 Images)"
              accept="image/*"
              multiple
              files={fewShotImages}
              onChange={setFewShotImages}
              placeholder="Upload approved brand examples"
            />
          </div>
        </div>

        {/* Product Labels */}
        <div className="card bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800">
          <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
            🏷️ Step 4: Product Labels (Optional)
          </label>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            If your brand includes product labels, upload examples of correct and incorrect versions
          </p>
          <textarea
            value={labelDescription}
            onChange={(e) => setLabelDescription(e.target.value)}
            rows={3}
            className="w-full input-field text-sm mb-4"
            placeholder="Describe correct vs. incorrect product labels..."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FileUpload
              label="✅ Correct Labels"
              accept="image/*"
              multiple
              files={correctLabelImages}
              onChange={setCorrectLabelImages}
              placeholder="Upload correct label examples"
            />
            <FileUpload
              label="❌ Incorrect Labels"
              accept="image/*"
              multiple
              files={incorrectLabelImages}
              onChange={setIncorrectLabelImages}
              placeholder="Upload incorrect label examples"
            />
          </div>
        </div>

        {/* Distill Button */}
        <div className="card bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">🤖 Step 5: Generate Visual Rules</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            AI will analyze your uploaded images and create detailed visual compliance rules. This usually takes 20-30 seconds.
          </p>
          <button
            onClick={handleDistill}
            disabled={distilling}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {distilling ? '🔄 Analyzing Visual Context...' : '▶️ Distill Visual Rules'}
          </button>
        </div>

        {/* Visual Analysis Output */}
        <div className="card">
          <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
            📋 Generated Visual Rules
          </label>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            AI-generated rules based on your visual assets. You can edit these if needed.
          </p>
          <textarea
            value={visualAnalysis}
            onChange={(e) => setVisualAnalysis(e.target.value)}
            rows={10}
            readOnly={distilling}
            className="w-full input-field bg-gray-50 text-sm font-mono"
            placeholder="[Visual rules will be generated here]"
          />
        </div>
      </div>
    </div>
  );
}


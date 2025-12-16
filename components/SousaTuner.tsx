

import React, { useState, useEffect } from 'react';
import { SousaSettings, SousaGroups, FontState } from '../types';
import { generateAdhesionText } from '../services/fontService';
import { Settings2, Play, ChevronDown, ChevronUp } from 'lucide-react';
import { GlyphVisualizer } from './GlyphVisualizer';

interface SousaTunerProps {
  settings: SousaSettings;
  onSettingsChange: (newSettings: SousaSettings) => void;
  fontFamily: string;
  font: FontState | null;
}

type WizardStep = 'GROUPS' | 'MASTERS' | 'SEQUENTIAL';

export const SousaTuner: React.FC<SousaTunerProps> = ({ settings, onSettingsChange, fontFamily, font }) => {
  const [step, setStep] = useState<WizardStep>('GROUPS');
  const [showUpperGroups, setShowUpperGroups] = useState(false);
  
  // Local state for sequential tuning
  const [targetChar, setTargetChar] = useState<string>('a');
  const [testWord, setTestWord] = useState<string>('');
  
  useEffect(() => {
    if (step === 'SEQUENTIAL') {
        // Determine context based on case of targetChar
        const isUpper = targetChar === targetChar.toUpperCase() && targetChar !== targetChar.toLowerCase();
        const context = isUpper ? settings.groups.upperGroup1 : settings.groups.group1;
        setTestWord(generateAdhesionText(targetChar, context));
    }
  }, [step, targetChar, settings.groups]);

  const handleGroupChange = (groupKey: keyof SousaGroups, value: string) => {
    const chars = value.split('').filter(c => c.trim() !== '');
    const uniqueChars = Array.from(new Set(chars));
    onSettingsChange({
        ...settings,
        groups: {
            ...settings.groups,
            [groupKey]: uniqueChars
        }
    });
  };

  const handleMasterChange = (char: 'n'|'o'|'H'|'O', side: 'lsb'|'rsb', val: number) => {
      onSettingsChange({
          ...settings,
          [char]: { ...settings[char], [side]: val }
      });
  };

  const handleOverrideChange = (side: 'lsb'|'rsb', val: number) => {
      const currentOverride = settings.overrides[targetChar] || { lsb: null, rsb: null };
      onSettingsChange({
          ...settings,
          overrides: {
              ...settings.overrides,
              [targetChar]: { ...currentOverride, [side]: val }
          }
      });
  };

  // Helper to get current value for slider (either override or derived)
  // Since we don't have easy access to derived value without querying the font,
  // we can assume 0 or last known if not overridden, or better: try to read from font object if available.
  // Ideally, we read the ACTUAL current metric from the font state to show in the input.
  const getCurrentMetric = (side: 'lsb' | 'rsb') => {
     // If explicit override exists, use it
     if (settings.overrides[targetChar] && settings.overrides[targetChar][side] !== undefined) {
         return settings.overrides[targetChar][side];
     }
     
     // Fallback: Read from font object if processed
     if (font && font.fontObj) {
         const glyph = font.fontObj.charToGlyph(targetChar);
         if (glyph) {
             const box = glyph.getBoundingBox();
             if (side === 'lsb') return Math.round(box.x1);
             if (side === 'rsb') return Math.round(glyph.advanceWidth - box.x2);
         }
     }
     return 0;
  };

  const currentLsb = getCurrentMetric('lsb');
  const currentRsb = getCurrentMetric('rsb');

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 h-full flex flex-col overflow-hidden">
      
      {/* Wizard Header */}
      <div className="bg-gray-900 p-4 border-b border-gray-700 flex flex-col sm:flex-row justify-between items-center shrink-0 gap-3">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-green-400" />
            Sousa Method
        </h2>
        <div className="flex bg-gray-700 rounded p-1">
             <button onClick={() => setStep('GROUPS')} className={`px-3 py-1 rounded text-xs transition-colors ${step === 'GROUPS' ? 'bg-green-600 text-white' : 'text-gray-300 hover:text-white'}`}>1. Groups</button>
             <button onClick={() => setStep('MASTERS')} className={`px-3 py-1 rounded text-xs transition-colors ${step === 'MASTERS' ? 'bg-green-600 text-white' : 'text-gray-300 hover:text-white'}`}>2. Masters</button>
             <button onClick={() => setStep('SEQUENTIAL')} className={`px-3 py-1 rounded text-xs transition-colors ${step === 'SEQUENTIAL' ? 'bg-green-600 text-white' : 'text-gray-300 hover:text-white'}`}>3. Tuning</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
        
        {step === 'GROUPS' && (
            <div className="space-y-6">
                <div className="bg-blue-900/20 p-4 rounded border border-blue-800 text-sm text-blue-200">
                    Define glyph groups. Characters in Group 1/2 receive automatic spacing based on topology. Any character can be manually tuned later.
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Lowercase</h3>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Group 1 (Relational)</label>
                        <textarea 
                            className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white font-mono text-sm"
                            value={settings.groups.group1.join('')}
                            onChange={(e) => handleGroupChange('group1', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Group 2 (Semi-Relational)</label>
                        <textarea 
                            className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white font-mono text-sm"
                            value={settings.groups.group2.join('')}
                            onChange={(e) => handleGroupChange('group2', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Group 3 (Visual)</label>
                        <textarea 
                            className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white font-mono text-sm"
                            value={settings.groups.group3.join('')}
                            onChange={(e) => handleGroupChange('group3', e.target.value)}
                        />
                    </div>
                </div>

                <div className="border-t border-gray-700 pt-4">
                     <button onClick={() => setShowUpperGroups(!showUpperGroups)} className="flex items-center gap-2 text-sm font-bold text-gray-400 uppercase tracking-wider hover:text-white">
                        {showUpperGroups ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        Uppercase Groups
                     </button>
                     
                     {showUpperGroups && (
                        <div className="space-y-4 mt-4 animate-in slide-in-from-top-2">
                             <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Group 1 (Relational)</label>
                                <textarea 
                                    className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white font-mono text-sm"
                                    value={settings.groups.upperGroup1.join('')}
                                    onChange={(e) => handleGroupChange('upperGroup1', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Group 2 (Semi-Relational)</label>
                                <textarea 
                                    className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white font-mono text-sm"
                                    value={settings.groups.upperGroup2.join('')}
                                    onChange={(e) => handleGroupChange('upperGroup2', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Group 3 (Visual)</label>
                                <textarea 
                                    className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white font-mono text-sm"
                                    value={settings.groups.upperGroup3.join('')}
                                    onChange={(e) => handleGroupChange('upperGroup3', e.target.value)}
                                />
                            </div>
                        </div>
                     )}
                </div>
            </div>
        )}

        {step === 'MASTERS' && (
            <div className="space-y-6">
                <div className="bg-blue-900/20 p-4 rounded border border-blue-800 text-sm text-blue-200">
                    Tune the Master glyphs. 'n'/'o' drive lowercase, 'H'/'O' drive uppercase.
                </div>

                {/* Lowercase Masters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <MasterControl char="n" settings={settings} onChange={handleMasterChange} font={font} />
                     <MasterControl char="o" settings={settings} onChange={handleMasterChange} font={font} />
                </div>
                
                {/* Uppercase Masters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-700 pt-4">
                     <MasterControl char="H" settings={settings} onChange={handleMasterChange} font={font} />
                     <MasterControl char="O" settings={settings} onChange={handleMasterChange} font={font} />
                </div>
            </div>
        )}

        {step === 'SEQUENTIAL' && (
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 items-end bg-gray-700/50 p-4 rounded">
                    <div className="flex-1 w-full">
                        <label className="block text-xs text-gray-400 mb-1">Target Glyph to Tune</label>
                        <select 
                            value={targetChar}
                            onChange={(e) => setTargetChar(e.target.value)}
                            className="bg-gray-900 text-white border border-gray-600 rounded px-3 py-2 w-full font-mono text-lg"
                        >
                            <optgroup label="Lowercase - Group 1 (Relational)">
                                {settings.groups.group1.map(c => <option key={c} value={c}>{c}</option>)}
                            </optgroup>
                            <optgroup label="Lowercase - Group 2 (Semi)">
                                {settings.groups.group2.map(c => <option key={c} value={c}>{c}</option>)}
                            </optgroup>
                            <optgroup label="Lowercase - Group 3 (Visual)">
                                {settings.groups.group3.map(c => <option key={c} value={c}>{c}</option>)}
                            </optgroup>
                            <optgroup label="Uppercase - Group 1 (Relational)">
                                {settings.groups.upperGroup1.map(c => <option key={c} value={c}>{c}</option>)}
                            </optgroup>
                            <optgroup label="Uppercase - Group 2 (Semi)">
                                {settings.groups.upperGroup2.map(c => <option key={c} value={c}>{c}</option>)}
                            </optgroup>
                            <optgroup label="Uppercase - Group 3 (Visual)">
                                {settings.groups.upperGroup3.map(c => <option key={c} value={c}>{c}</option>)}
                            </optgroup>
                        </select>
                    </div>
                    <button 
                        onClick={() => {
                            const isUpper = targetChar === targetChar.toUpperCase() && targetChar !== targetChar.toLowerCase();
                            const ctx = isUpper ? settings.groups.upperGroup1 : settings.groups.group1;
                            setTestWord(generateAdhesionText(targetChar, ctx));
                        }}
                        className="w-full sm:w-auto bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded h-11 flex items-center justify-center gap-2 font-medium"
                    >
                        <Play className="w-4 h-4" /> Next Context
                    </button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="space-y-4 bg-gray-800/50 p-4 rounded border border-gray-700">
                         <div>
                             <div className="flex justify-between items-center mb-1">
                                <label className="text-xs text-gray-400">Left SB</label>
                                <input 
                                    type="number" value={currentLsb} 
                                    onChange={(e) => handleOverrideChange('lsb', Number(e.target.value))} 
                                    className="w-16 bg-gray-900 border border-gray-600 rounded px-1 text-right text-xs"
                                />
                             </div>
                             <input 
                                type="range" min="-200" max="500" 
                                value={currentLsb} 
                                onChange={(e) => handleOverrideChange('lsb', Number(e.target.value))}
                                className="w-full accent-green-500 h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                             />
                         </div>
                         <div>
                             <div className="flex justify-between items-center mb-1">
                                <label className="text-xs text-gray-400">Right SB</label>
                                <input 
                                    type="number" value={currentRsb} 
                                    onChange={(e) => handleOverrideChange('rsb', Number(e.target.value))} 
                                    className="w-16 bg-gray-900 border border-gray-600 rounded px-1 text-right text-xs"
                                />
                             </div>
                             <input 
                                type="range" min="-200" max="500" 
                                value={currentRsb} 
                                onChange={(e) => handleOverrideChange('rsb', Number(e.target.value))}
                                className="w-full accent-green-500 h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                             />
                         </div>
                         {settings.overrides[targetChar] && (
                             <button 
                                onClick={() => {
                                    const newOverrides = { ...settings.overrides };
                                    delete newOverrides[targetChar];
                                    onSettingsChange({ ...settings, overrides: newOverrides });
                                }}
                                className="text-xs text-red-400 underline"
                             >
                                 Clear Override
                             </button>
                         )}
                    </div>
                    
                    <div className="h-48 min-h-[200px]">
                        <GlyphVisualizer 
                            char={targetChar} 
                            font={font} 
                            lsb={currentLsb} 
                            rsb={currentRsb} 
                        />
                    </div>
                </div>

                <div className="bg-gray-900 p-6 rounded border border-gray-700 text-center min-h-[120px] flex items-center justify-center">
                    <p style={{ fontFamily: `'${fontFamily}'` }} className="text-2xl md:text-4xl text-white tracking-normal break-all">
                        {testWord}
                    </p>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

const MasterControl = ({ char, settings, onChange, font }: any) => (
    <section className="bg-gray-800/50 p-4 rounded border border-gray-700">
        <h3 className="font-semibold text-green-400 mb-2">Master '{char}'</h3>
        <div className="space-y-4">
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-xs text-gray-400">Left SB</label>
                    <input type="number" value={settings[char].lsb} onChange={(e) => onChange(char, 'lsb', Number(e.target.value))} className="w-14 bg-gray-900 border border-gray-600 rounded text-xs px-1 text-right"/>
                </div>
                <input 
                    type="range" min="-100" max="300" value={settings[char].lsb} 
                    onChange={(e) => onChange(char, 'lsb', Number(e.target.value))}
                    className="w-full accent-green-500 block h-1.5 bg-gray-600 rounded-lg cursor-pointer"
                />
            </div>
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-xs text-gray-400">Right SB</label>
                    <input type="number" value={settings[char].rsb} onChange={(e) => onChange(char, 'rsb', Number(e.target.value))} className="w-14 bg-gray-900 border border-gray-600 rounded text-xs px-1 text-right"/>
                </div>
                <input 
                    type="range" min="-100" max="300" value={settings[char].rsb} 
                    onChange={(e) => onChange(char, 'rsb', Number(e.target.value))}
                    className="w-full accent-green-500 block h-1.5 bg-gray-600 rounded-lg cursor-pointer"
                />
            </div>
            <div className="h-40">
                <GlyphVisualizer char={char} font={font} lsb={settings[char].lsb} rsb={settings[char].rsb} />
            </div>
        </div>
    </section>
);

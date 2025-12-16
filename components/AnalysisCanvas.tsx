

import React, { useState } from 'react';
import { FontState, MethodType } from '../types';
import { Layers, Type, AlignJustify, Download, BarChart2, MousePointerClick, Columns } from 'lucide-react';
import { calculateAverageSB, downloadFont } from '../services/fontService';
import { SpacingDiagram } from './SpacingDiagram';
import { SousaAnalysisView } from './SousaAnalysisView';

interface AnalysisCanvasProps {
  fonts: Record<string, FontState | null>;
}

const PARAGRAPH_TEXT = "Hook, a do. Joe, succor asclepias cod efferent. Fans rolls, oceania leets boise sentimentalisation, geologian pedicels, plowtail, dip em kinins tetracerous, non a revisal, at. Clamer goon, downstrokes imputative blip ballonne, yakin ouenite, he. Em arapunga, oat, a feud. Palaeoclimatologist, a ten noncrucial a to, rauli, a sirky, coy, if, pour my xmas. Hew, wisher seventy. Conducts, ya note, algic. Iricism, mil, swob groundling, koruny, hi lode, overwoman, shrive. Educate am fractocumulus, they tempt. Us goloe, offic, wammus, luminescing. Wow, relighted. Veracious glacon, seed, dram bat oral sgabellos noviceship, age neo cant bethorn, cirri nondepressed laserdisks, mom owl, fall. Multicordate, is, splint chremzel a he, kodak, acre, yokel, pope kong. A mojarra, savant, dredges, squattest ye. Plonked algologist, sip citrin. us gimp, woke, congressing.";

export const AnalysisCanvas: React.FC<AnalysisCanvasProps> = ({ fonts }) => {
  const [testText, setTestText] = useState("HHOOHOH\nnnoonon\nminimum");
  const [fontSize, setFontSize] = useState(120);
  const [viewMode, setViewMode] = useState<'stack' | 'overlay' | 'metrics' | 'side-by-side'>('side-by-side');
  
  const originalFont = fonts[MethodType.ORIGINAL];
  const tracyFont = fonts[MethodType.TRACY];
  const sousaFont = fonts[MethodType.SOUSA];

  const handleExport = (type: MethodType) => {
      const fontState = fonts[type];
      if (fontState?.fontObj) {
          downloadFont(fontState.fontObj, type);
      }
  };

  const getAvgSB = (type: MethodType) => {
      const f = fonts[type];
      return f?.fontObj ? calculateAverageSB(f.fontObj) : 0;
  };

  const setPreset = (text: string, size: number) => {
      setTestText(text);
      setFontSize(size);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg overflow-hidden border border-gray-700 shadow-xl">
      {/* Toolbar */}
      <div className="bg-gray-800 p-3 flex flex-col xl:flex-row gap-4 border-b border-gray-700">
        <div className="flex items-center gap-4 w-full xl:w-auto justify-between xl:justify-start">
            <div className="flex items-center gap-2 px-2 bg-gray-700/50 rounded p-1">
                <Type className="w-4 h-4 text-gray-400" />
                <input 
                    type="number" 
                    value={fontSize} 
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-16 bg-gray-700 border border-gray-600 rounded px-1 text-sm text-center text-white"
                />
                <span className="text-xs text-gray-400">px</span>
            </div>
            
            <div className="flex gap-1 bg-gray-700/50 rounded p-1">
                 <button 
                    onClick={() => setViewMode('side-by-side')}
                    className={`p-1.5 rounded transition-all ${viewMode === 'side-by-side' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:bg-gray-600'}`}
                    title="Side by Side Paragraphs"
                 >
                    <Columns className="w-4 h-4" />
                 </button>
                 <button 
                    onClick={() => setViewMode('stack')}
                    className={`p-1.5 rounded transition-all ${viewMode === 'stack' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:bg-gray-600'}`}
                    title="Stacked View"
                 >
                    <AlignJustify className="w-4 h-4" />
                 </button>
                 <button 
                    onClick={() => setViewMode('overlay')}
                    className={`p-1.5 rounded transition-all ${viewMode === 'overlay' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:bg-gray-600'}`}
                    title="Overlay View"
                 >
                    <Layers className="w-4 h-4" />
                 </button>
                 <button 
                    onClick={() => setViewMode('metrics')}
                    className={`p-1.5 rounded transition-all ${viewMode === 'metrics' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:bg-gray-600'}`}
                    title="Metrics Data"
                 >
                    <BarChart2 className="w-4 h-4" />
                 </button>
            </div>
        </div>

        <div className="flex-1 flex gap-2">
            <textarea 
                value={testText} 
                onChange={(e) => setTestText(e.target.value)}
                className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-gray-200 font-sans min-w-0 resize-none h-10 leading-tight"
                placeholder="Type test text here..."
            />
            <div className="flex flex-col gap-1 justify-center">
                 <div className="flex gap-1">
                    <button onClick={() => setPreset("HHOOHOH\nnnoonon\nminimum", 120)} className="text-[10px] bg-gray-700 hover:bg-gray-600 px-2 py-0.5 rounded text-gray-300 whitespace-nowrap flex-1">Analysis</button>
                    <button onClick={() => setPreset("Hamburgforeigns", 120)} className="text-[10px] bg-gray-700 hover:bg-gray-600 px-2 py-0.5 rounded text-gray-300 whitespace-nowrap flex-1">Word</button>
                 </div>
                 <button onClick={() => setPreset(PARAGRAPH_TEXT, 18)} className="text-[10px] bg-blue-900/40 hover:bg-blue-900/60 border border-blue-800 px-2 py-0.5 rounded text-blue-200 whitespace-nowrap w-full">¶ Paragraph</button>
            </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 overflow-auto bg-gray-950 relative">
        
        {viewMode === 'side-by-side' && (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-0 h-full divide-y md:divide-y-0 md:divide-x divide-gray-800">
                {/* Tracy Method */}
                <div className="flex flex-col h-full">
                     <div className="p-3 border-b border-gray-800 bg-gray-900 flex justify-between items-center sticky top-0 z-10">
                         <h4 className="text-xs font-bold uppercase tracking-widest text-pink-400">Walter Tracy's Method</h4>
                         <button onClick={() => handleExport(MethodType.TRACY)} className="opacity-50 hover:opacity-100"><Download className="w-3 h-3 text-pink-400" /></button>
                     </div>
                     <div className="p-6 md:p-8 flex-1 overflow-y-auto">
                        <p style={{ fontFamily: tracyFont?.fullFontFamily || 'serif', fontSize: `${fontSize}px` }} className="text-gray-200 leading-relaxed whitespace-pre-wrap break-words">
                            {testText}
                        </p>
                     </div>
                </div>

                {/* Original */}
                <div className="flex flex-col h-full bg-gray-900/30">
                     <div className="p-3 border-b border-gray-800 bg-gray-900 flex justify-between items-center sticky top-0 z-10">
                         <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Original Spacings</h4>
                         <button onClick={() => handleExport(MethodType.ORIGINAL)} className="opacity-50 hover:opacity-100"><Download className="w-3 h-3 text-gray-400" /></button>
                     </div>
                     <div className="p-6 md:p-8 flex-1 overflow-y-auto">
                        <p style={{ fontFamily: originalFont?.fullFontFamily || 'serif', fontSize: `${fontSize}px` }} className="text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
                            {testText}
                        </p>
                     </div>
                </div>

                {/* Sousa Method */}
                <div className="flex flex-col h-full">
                     <div className="p-3 border-b border-gray-800 bg-gray-900 flex justify-between items-center sticky top-0 z-10">
                         <h4 className="text-xs font-bold uppercase tracking-widest text-cyan-400">Miguel Sousa's Method</h4>
                         <button onClick={() => handleExport(MethodType.SOUSA)} className="opacity-50 hover:opacity-100"><Download className="w-3 h-3 text-cyan-400" /></button>
                     </div>
                     <div className="p-6 md:p-8 flex-1 overflow-y-auto">
                        <p style={{ fontFamily: sousaFont?.fullFontFamily || 'serif', fontSize: `${fontSize}px` }} className="text-gray-200 leading-relaxed whitespace-pre-wrap break-words">
                            {testText}
                        </p>
                     </div>
                </div>
             </div>
        )}

        {viewMode === 'stack' && (
            <div className="space-y-8 p-4 md:p-8">
                {originalFont?.url && (
                    <div className="border-l-4 border-gray-500 pl-4 bg-gray-900/40 p-4 rounded-r transition-all hover:bg-gray-900/60">
                        <div className="flex justify-between items-center mb-2">
                             <h4 className="text-xs uppercase text-gray-500 font-bold tracking-wider flex items-center gap-2">
                                <span className="w-3 h-3 bg-gray-500 rounded-sm"></span> Original
                             </h4>
                             <button onClick={() => handleExport(MethodType.ORIGINAL)} className="text-xs text-gray-400 hover:text-white flex gap-1 items-center bg-gray-800 px-2 py-1 rounded border border-gray-700"><Download className="w-3 h-3"/> OTF</button>
                        </div>
                        <p style={{ fontFamily: originalFont.fullFontFamily, fontSize: `${fontSize}px` }} className="leading-tight text-white opacity-90 break-words whitespace-pre-wrap">
                            {testText}
                        </p>
                    </div>
                )}
                {tracyFont?.url && (
                    <div className="border-l-4 border-pink-500 pl-4 bg-pink-900/10 p-4 rounded-r transition-all hover:bg-pink-900/20">
                        <div className="flex justify-between items-center mb-2">
                             <h4 className="text-xs uppercase text-pink-500 font-bold tracking-wider flex items-center gap-2">
                                <span className="w-3 h-3 bg-pink-500 rounded-sm"></span> Tracy Method
                             </h4>
                             <button onClick={() => handleExport(MethodType.TRACY)} className="text-xs text-pink-400 hover:text-white flex gap-1 items-center bg-gray-800 px-2 py-1 rounded border border-gray-700"><Download className="w-3 h-3"/> OTF</button>
                        </div>
                        <p style={{ fontFamily: tracyFont.fullFontFamily, fontSize: `${fontSize}px` }} className="leading-tight text-white break-words whitespace-pre-wrap">
                            {testText}
                        </p>
                    </div>
                )}
                {sousaFont?.url && (
                    <div className="border-l-4 border-cyan-500 pl-4 bg-cyan-900/10 p-4 rounded-r transition-all hover:bg-cyan-900/20">
                         <div className="flex justify-between items-center mb-2">
                             <h4 className="text-xs uppercase text-cyan-500 font-bold tracking-wider flex items-center gap-2">
                                <span className="w-3 h-3 bg-cyan-500 rounded-sm"></span> Sousa Method
                             </h4>
                             <button onClick={() => handleExport(MethodType.SOUSA)} className="text-xs text-cyan-400 hover:text-white flex gap-1 items-center bg-gray-800 px-2 py-1 rounded border border-gray-700"><Download className="w-3 h-3"/> OTF</button>
                        </div>
                        <p style={{ fontFamily: sousaFont.fullFontFamily, fontSize: `${fontSize}px` }} className="leading-tight text-white break-words whitespace-pre-wrap">
                            {testText}
                        </p>
                    </div>
                )}
            </div>
        )}

        {viewMode === 'overlay' && (
            <div className="relative pt-8 min-h-[500px] flex justify-center p-4">
                {/* Legend */}
                 <div className="fixed bottom-8 right-8 bg-gray-900/90 backdrop-blur p-4 rounded-lg border border-gray-700 z-50 text-xs shadow-2xl">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-4 h-4 border border-gray-500 rounded bg-transparent"></span> 
                        <span className="text-gray-300">Original (Gray)</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-4 h-4 border border-pink-500 rounded bg-transparent"></span> 
                        <span className="text-pink-400">Tracy (Pink)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-4 h-4 border border-cyan-500 rounded bg-transparent"></span> 
                        <span className="text-cyan-400">Sousa (Cyan)</span>
                    </div>
                </div>

                <div className="w-full text-center">
                    <div className="relative inline-block text-left">
                         {/* Original */}
                        <div 
                            className="absolute top-0 left-0 z-10 select-none pointer-events-none mix-blend-screen"
                            style={{ 
                                fontFamily: originalFont?.fullFontFamily || 'Original', 
                                fontSize: `${fontSize}px`,
                                WebkitTextStroke: '1px rgba(156, 163, 175, 0.7)', 
                                color: 'transparent',
                                whiteSpace: 'pre-wrap'
                            }}
                        >
                            {testText}
                        </div>

                        {/* Tracy */}
                        <div 
                            className="absolute top-0 left-0 z-20 select-none pointer-events-none mix-blend-screen"
                            style={{ 
                                fontFamily: tracyFont?.fullFontFamily || 'Tracy', 
                                fontSize: `${fontSize}px`,
                                WebkitTextStroke: '1px rgba(236, 72, 153, 0.9)', 
                                color: 'transparent',
                                whiteSpace: 'pre-wrap'
                            }}
                        >
                            {testText}
                        </div>

                        {/* Sousa */}
                        <div 
                            className="relative z-30 select-text mix-blend-screen"
                            style={{ 
                                fontFamily: sousaFont?.fullFontFamily || 'Sousa', 
                                fontSize: `${fontSize}px`,
                                WebkitTextStroke: '1px rgba(6, 182, 212, 0.9)', 
                                color: 'transparent',
                                whiteSpace: 'pre-wrap'
                            }}
                        >
                            {testText}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {viewMode === 'metrics' && (
             <div className="p-4 md:p-8 max-w-7xl mx-auto">
                 <h3 className="text-xl font-bold mb-6 flex gap-2 items-center text-white"><BarChart2 className="text-blue-400" /> Metrics Analysis</h3>
                 
                 {/* Spacing Diagrams */}
                 <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-12">
                     <div className="space-y-8">
                         <SpacingDiagram font={tracyFont} method={MethodType.TRACY} category="Lowercase" />
                         <SpacingDiagram font={tracyFont} method={MethodType.TRACY} category="Uppercase" />
                     </div>
                     <div className="space-y-8">
                         <SousaAnalysisView font={sousaFont} category="Lowercase" />
                         <SousaAnalysisView font={sousaFont} category="Uppercase" />
                     </div>
                 </div>

                 {/* General Stats */}
                 <div className="space-y-8 bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                     <h4 className="font-bold text-gray-300">Global Average Spacing</h4>
                     <div>
                         <div className="flex justify-between text-sm mb-2 text-gray-400 font-medium">
                             <span className="flex items-center gap-2"><div className="w-2 h-2 bg-gray-500 rounded-full"></div> Original</span>
                             <span>{getAvgSB(MethodType.ORIGINAL)} units (avg)</span>
                         </div>
                         <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
                             <div className="h-full bg-gray-500 transition-all duration-500 ease-out" style={{ width: `${Math.min(100, (getAvgSB(MethodType.ORIGINAL)/100)*100)}%` }}></div>
                         </div>
                     </div>

                     <div>
                         <div className="flex justify-between text-sm mb-2 text-pink-400 font-medium">
                             <span className="flex items-center gap-2"><div className="w-2 h-2 bg-pink-500 rounded-full"></div> Tracy</span>
                             <span>{getAvgSB(MethodType.TRACY)} units (avg)</span>
                         </div>
                         <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
                             <div className="h-full bg-pink-600 transition-all duration-500 ease-out" style={{ width: `${Math.min(100, (getAvgSB(MethodType.TRACY)/100)*100)}%` }}></div>
                         </div>
                     </div>

                     <div>
                         <div className="flex justify-between text-sm mb-2 text-cyan-400 font-medium">
                             <span className="flex items-center gap-2"><div className="w-2 h-2 bg-cyan-500 rounded-full"></div> Sousa</span>
                             <span>{getAvgSB(MethodType.SOUSA)} units (avg)</span>
                         </div>
                         <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
                             <div className="h-full bg-cyan-600 transition-all duration-500 ease-out" style={{ width: `${Math.min(100, (getAvgSB(MethodType.SOUSA)/100)*100)}%` }}></div>
                         </div>
                     </div>
                 </div>
             </div>
        )}

      </div>
    </div>
  );
};

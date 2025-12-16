
import { FontState, MethodType, TracySettings, SousaSettings, OpenTypeFont, OpenTypeGlyph } from '../types';
// Importing directly from unpkg for browser environment compatibility in this setup
import opentype from 'https://unpkg.com/opentype.js@1.3.4/dist/opentype.module.js';

export const parseFont = async (buffer: ArrayBuffer): Promise<OpenTypeFont> => {
  return opentype.parse(buffer);
};

export const createFontState = async (buffer: ArrayBuffer, type: MethodType): Promise<FontState> => {
  const font = opentype.parse(buffer);
  
  // Calculate basic metrics
  const metrics = {
    ascender: font.ascender,
    descender: font.descender,
    unitsPerEm: font.unitsPerEm,
    xHeight: 0,
    capHeight: 0
  };

  // Estimate xHeight and capHeight from 'x' and 'H'
  const xGlyph = font.charToGlyph('x');
  const hGlyph = font.charToGlyph('H');
  
  if (xGlyph && xGlyph.unicode) {
    const box = xGlyph.getBoundingBox();
    metrics.xHeight = box.y2 - box.y1; 
  }
  if (hGlyph && hGlyph.unicode) {
    const box = hGlyph.getBoundingBox();
    metrics.capHeight = box.y2 - box.y1;
  }
  // Try to read from tables if available for better accuracy
  if(font.tables.os2) {
      if(font.tables.os2.sxHeight) metrics.xHeight = font.tables.os2.sxHeight;
      if(font.tables.os2.sCapHeight) metrics.capHeight = font.tables.os2.sCapHeight;
  }

  const url = createFontUrl(font);

  // Set default family name
  const family = type === MethodType.ORIGINAL ? 'Original' : type === MethodType.TRACY ? 'Tracy' : 'Sousa';

  return {
    type,
    fontObj: font,
    url,
    fullFontFamily: family,
    metrics
  };
};

export const createFontUrl = (font: OpenTypeFont): string => {
  const buffer = font.toArrayBuffer();
  const blob = new Blob([buffer], { type: 'font/opentype' });
  return URL.createObjectURL(blob);
};

export const downloadFont = (font: OpenTypeFont, suffix: string) => {
    const buffer = font.toArrayBuffer();
    const blob = new Blob([buffer], { type: 'font/opentype' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Get original name if possible, or default
    const familyName = font.names.fontFamily?.en || 'SAAME_Font';
    link.href = url;
    link.download = `${familyName}_${suffix}.otf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const calculateAverageSB = (font: OpenTypeFont): number => {
    let total = 0;
    let count = 0;
    for (let i = 0; i < font.glyphs.length; i++) {
        const glyph = font.glyphs.get(i);
        if(glyph.unicode && glyph.name !== 'space') {
            const box = glyph.getBoundingBox();
            const lsb = box.x1;
            const rsb = glyph.advanceWidth - box.x2;
            total += (lsb + rsb);
            count++;
        }
    }
    return count > 0 ? Math.round(total / (count * 2)) : 0;
}

export const getCharMetrics = (font: OpenTypeFont, char: string): { lsb: number, rsb: number } => {
    const glyph = font.charToGlyph(char);
    if (!glyph) return { lsb: 0, rsb: 0 };
    
    const box = glyph.getBoundingBox();
    // Handle empty glyphs
    if (box.x1 === 0 && box.x2 === 0 && box.y1 === 0 && box.y2 === 0 && glyph.path.commands.length === 0) {
        return { lsb: 0, rsb: glyph.advanceWidth };
    }

    const lsb = box.x1;
    const rsb = glyph.advanceWidth - box.x2;
    return { lsb: Math.round(lsb), rsb: Math.round(rsb) };
};

// Helper to get glyph data for Visualization
export const getGlyphData = (font: OpenTypeFont, char: string) => {
    const glyph = font.charToGlyph(char);
    if (!glyph) return null;
    
    const box = glyph.getBoundingBox();
    // Raw typographic metrics (no normalization)
    // x1 = xMin (LSB if origin is 0)
    // x2 = xMax
    // y1 = yMin
    // y2 = yMax
    
    // Handle empty glyphs
    if ((box.x1 === 0 && box.x2 === 0 && box.y1 === 0 && box.y2 === 0) || glyph.path.commands.length === 0) {
         return {
            xMin: 0,
            xMax: 0,
            yMin: font.descender,
            yMax: font.ascender,
            advanceWidth: glyph.advanceWidth,
            pathData: ''
        };
    }

    // Get path exactly as it exists in the font's coordinate system
    // CRITICAL FIX: Use actual unitsPerEm for 1:1 scale with metrics
    const units = font.unitsPerEm || 1000;
    const path = glyph.getPath(0, 0, units); 
    const pathData = path.toPathData(2);

    return {
        xMin: box.x1,
        xMax: box.x2,
        yMin: font.descender,
        yMax: font.ascender, // Use font metrics for vertical consistency
        glyphYMin: box.y1,
        glyphYMax: box.y2,
        advanceWidth: glyph.advanceWidth,
        pathData
    };
};

/**
 * Advanced Auto Spacing Algorithm (Harmony & Legibility Focus)
 */
export const calculateHarmonicSpacing = (font: OpenTypeFont, char: string): number => {
    const glyph = font.charToGlyph(char);
    if (!glyph) return 40; 

    const box = glyph.getBoundingBox();
    const width = box.x2 - box.x1;
    const height = box.y2 - box.y1;
    
    const isUpper = char === char.toUpperCase() && char !== char.toLowerCase();
    const rounds = ['O', 'o', 'Q', 'C', 'G', 'e', 'c', '0'];
    const isRound = rounds.includes(char);

    const weightClass = font.tables.os2?.usWeightClass || 400;
    
    const baseStemRatio = 0.16; 
    const weightFactor = (weightClass / 400); 
    const estimatedStem = height * (baseStemRatio * Math.pow(weightFactor, 0.7)); 

    const internalCounter = Math.max(width * 0.15, width - (2 * estimatedStem));

    let rhythmRatio = isUpper ? 0.40 : 0.32;
    
    let targetSB = internalCounter * rhythmRatio;

    if (isRound) {
        targetSB = targetSB * 0.65;
    }

    return Math.max(10, Math.round(targetSB));
};

export const calculateSousaDefaults = (font: OpenTypeFont) => {
    const n = calculateHarmonicSpacing(font, 'n');
    const o = calculateHarmonicSpacing(font, 'o');
    const H = calculateHarmonicSpacing(font, 'H');
    const O = calculateHarmonicSpacing(font, 'O');

    return {
        n: { lsb: n, rsb: Math.round(n * 0.95) }, 
        o: { lsb: o, rsb: o }, 
        H: { lsb: H, rsb: H }, 
        O: { lsb: O, rsb: O }  
    };
};

export const cleanMetrics = (font: OpenTypeFont): void => {
  for (let i = 0; i < font.glyphs.length; i++) {
    const glyph = font.glyphs.get(i);
    if (glyph.name === 'space') continue;
    
    if (glyph.unicode || glyph.name) {
       const bounds = glyph.getBoundingBox();
       const width = bounds.x2 - bounds.x1;
       
       if (width >= 0) {
         const shiftX = -bounds.x1;
         if(shiftX !== 0) {
            glyph.path.commands.forEach((cmd: any) => {
                if (cmd.x !== undefined) cmd.x += shiftX;
                if (cmd.x1 !== undefined) cmd.x1 += shiftX;
                if (cmd.x2 !== undefined) cmd.x2 += shiftX;
            });
            
            // Invalidate cached bounding box values to force recalculation on next access
            delete (glyph as any).xMin;
            delete (glyph as any).xMax;
            delete (glyph as any).yMin;
            delete (glyph as any).yMax;
         }
         glyph.advanceWidth = width;
         if(glyph.leftSideBearing !== undefined) glyph.leftSideBearing = 0;
       }
    }
  }
  if (font.tables.kern) delete font.tables.kern;
  if (font.tables.gpos) delete font.tables.gpos;
};

const setGlyphSB = (font: OpenTypeFont, glyphName: string, lsb: number | null, rsb: number | null) => {
    const glyph = font.charToGlyph(glyphName);
    if (!glyph || !glyph.path) return;

    let bounds = glyph.getBoundingBox();
    
    if (lsb !== null) {
        const currentLsb = bounds.x1;
        const shift = lsb - currentLsb;
        if (Math.abs(shift) > 0.001) {
            glyph.path.commands.forEach((cmd: any) => {
                if (cmd.x !== undefined) cmd.x += shift;
                if (cmd.x1 !== undefined) cmd.x1 += shift;
                if (cmd.x2 !== undefined) cmd.x2 += shift;
            });
            glyph.leftSideBearing = lsb; 
            
            // Invalidate cache
            delete (glyph as any).xMin;
            delete (glyph as any).xMax;
            delete (glyph as any).yMin;
            delete (glyph as any).yMax;
            
            bounds = glyph.getBoundingBox();
        }
    }

    if (rsb !== null) {
        glyph.advanceWidth = bounds.x2 + rsb;
    }
};

export const applyTracyMethod = (font: OpenTypeFont, settings: TracySettings): void => {
    const { H, O, n, o, overrides } = settings;

    const applyRule = (char: string, ruleLsb: number | null, ruleRsb: number | null) => {
        const override = overrides[char];
        const finalLsb = (override && override.lsb !== null) ? override.lsb : ruleLsb;
        const finalRsb = (override && override.rsb !== null) ? override.rsb : ruleRsb;
        setGlyphSB(font, char, finalLsb, finalRsb);
    };

    applyRule('H', H.lsb, H.rsb);
    applyRule('O', O.lsb, O.rsb);
    applyRule('n', n.lsb, n.rsb);
    applyRule('o', o.lsb, o.rsb);

    const valH = H.lsb;        
    const valO = O.lsb;        
    const valMoreH = Math.round(valH * 1.15); 
    const valLessH = Math.round(valH * 0.85); 
    const valMin = Math.max(5, Math.round(valH * 0.25)); 
    
    const valVisual = Math.round((valH + valO) / 2);

    applyRule('A', valMin, valMin);        
    applyRule('B', valH, valLessH);        
    applyRule('C', valO, valLessH);        
    applyRule('D', valH, valO);            
    applyRule('E', valH, valLessH);        
    applyRule('F', valH, valLessH);        
    applyRule('G', valO, valMoreH);        
    applyRule('H', valH, valH);            
    applyRule('I', valH, valH);            
    applyRule('J', valMin, valH);          
    applyRule('K', valH, valMin);          
    applyRule('L', valH, valMin);          
    applyRule('M', valMoreH, valMoreH);    
    applyRule('N', valMoreH, valMoreH);    
    applyRule('O', valO, valO);            
    applyRule('P', valH, valO);            
    applyRule('Q', valO, valO);            
    applyRule('R', valH, valMin);          
    applyRule('S', valVisual, valVisual);  
    applyRule('T', valMin, valMin);        
    applyRule('U', valMoreH, valMoreH);    
    applyRule('V', valMin, valMin);        
    applyRule('W', valMin, valMin);        
    applyRule('X', valMin, valMin);        
    applyRule('Y', valMin, valMin);        
    applyRule('Z', valLessH, valLessH);    

    const nStem = n.lsb;      
    const nArch = n.rsb;      
    const oRound = o.lsb;     
    
    const valMoreN = Math.round(nStem * 1.15); 
    const valLessO = Math.round(oRound * 0.9);
    const valLowMin = Math.max(5, Math.round(nStem * 0.25));
    const valLowVisual = Math.round((nStem + oRound) / 2);

    applyRule('b', nStem, oRound);        
    applyRule('c', oRound, valLessO);     
    applyRule('d', oRound, nStem);        
    applyRule('e', oRound, valLessO);     
    applyRule('f', nStem, valLowMin);     
    applyRule('g', oRound, valLowVisual); 

    applyRule('h', valMoreN, nArch);      
    applyRule('i', valMoreN, nStem);      
    applyRule('j', nStem, nStem);         
    applyRule('k', nStem, valLowMin);     
    applyRule('l', valMoreN, nStem);      
    applyRule('m', nStem, nArch);         
    applyRule('n', nStem, nArch);         
    applyRule('n', nStem, nArch);         
    applyRule('o', oRound, oRound);       
    applyRule('p', valMoreN, oRound);     
    applyRule('q', oRound, nStem);        
    applyRule('r', nStem, valLowMin);     
    applyRule('s', valLessO, valLessO);   
    applyRule('t', nStem, valLowMin);     
    applyRule('u', nStem, nStem);         
    applyRule('v', valLowMin, valLowMin); 
    applyRule('w', valLowMin, valLowMin); 
    applyRule('x', valLowVisual, valLowVisual); 
    applyRule('y', valLowMin, valLowMin); 
    applyRule('z', valLowVisual, valLowVisual); 
    applyRule('a', oRound, nStem);
};

// EXPORTED TOPOLOGY for UI Visualization usage
export const TOPOLOGY: Record<string, { l: 'S'|'A'|'R'|'V', r: 'S'|'A'|'R'|'V' }> = {
    // Lowercase
    'a': { l: 'R', r: 'S' }, // a: Left Round, Right Stem (Standard single story)
    'b': { l: 'S', r: 'R' },
    'c': { l: 'R', r: 'V' }, // V = Visual/Open, but often treated as Round-ish base
    'd': { l: 'R', r: 'S' },
    'e': { l: 'R', r: 'V' },
    'f': { l: 'S', r: 'V' },
    'g': { l: 'R', r: 'V' },
    'h': { l: 'S', r: 'A' },
    'i': { l: 'S', r: 'S' },
    'j': { l: 'V', r: 'S' },
    'k': { l: 'S', r: 'V' },
    'l': { l: 'S', r: 'S' },
    'm': { l: 'S', r: 'A' },
    'n': { l: 'S', r: 'A' }, 
    'o': { l: 'R', r: 'R' }, 
    'p': { l: 'S', r: 'R' },
    'q': { l: 'R', r: 'S' },
    'r': { l: 'S', r: 'V' },
    's': { l: 'V', r: 'V' },
    't': { l: 'S', r: 'V' },
    'u': { l: 'S', r: 'S' }, // Sousa: u is Stem/Stem in many methods, though u has arch at bottom, top is stems.
    'v': { l: 'V', r: 'V' },
    'w': { l: 'V', r: 'V' },
    'x': { l: 'V', r: 'V' },
    'y': { l: 'V', r: 'V' },
    'z': { l: 'V', r: 'V' },

    // Uppercase
    'A': { l: 'V', r: 'V' },
    'B': { l: 'S', r: 'R' },
    'C': { l: 'R', r: 'V' },
    'D': { l: 'S', r: 'R' },
    'E': { l: 'S', r: 'V' },
    'F': { l: 'S', r: 'V' },
    'G': { l: 'R', r: 'V' },
    'H': { l: 'S', r: 'S' }, 
    'I': { l: 'S', r: 'S' },
    'J': { l: 'V', r: 'S' },
    'K': { l: 'S', r: 'V' },
    'L': { l: 'S', r: 'V' },
    'M': { l: 'S', r: 'S' },
    'N': { l: 'S', r: 'S' },
    'O': { l: 'R', r: 'R' }, 
    'P': { l: 'S', r: 'R' },
    'Q': { l: 'R', r: 'R' },
    'R': { l: 'S', r: 'V' },
    'S': { l: 'V', r: 'V' },
    'T': { l: 'V', r: 'V' },
    'U': { l: 'S', r: 'S' },
    'V': { l: 'V', r: 'V' },
    'W': { l: 'V', r: 'V' },
    'X': { l: 'V', r: 'V' },
    'Y': { l: 'V', r: 'V' },
    'Z': { l: 'V', r: 'V' }
};

export const applySousaMethod = (font: OpenTypeFont, settings: SousaSettings): void => {
    // 1. Apply Masters
    setGlyphSB(font, 'n', settings.n.lsb, settings.n.rsb);
    setGlyphSB(font, 'o', settings.o.lsb, settings.o.rsb);
    setGlyphSB(font, 'H', settings.H.lsb, settings.H.rsb);
    setGlyphSB(font, 'O', settings.O.lsb, settings.O.rsb);

    const lcStraight = settings.n.lsb; 
    const lcRound = settings.o.lsb;    
    const lcArch = settings.n.rsb;     
    const lcVisualDefault = Math.round((lcStraight + lcRound) / 2);

    const ucStraight = settings.H.lsb;
    const ucRound = settings.O.lsb;
    const ucVisualDefault = Math.round((ucStraight + ucRound) / 2);

    const getValue = (type: 'S'|'A'|'R'|'V', caseType: 'lc'|'uc', isVisualSide: boolean) => {
        if (caseType === 'lc') {
            if (type === 'S') return lcStraight; 
            if (type === 'R') return lcRound;    
            if (type === 'A') return lcArch;     
            return lcVisualDefault; 
        } else {
            if (type === 'S') return ucStraight;
            if (type === 'R') return ucRound;
            if (type === 'A') return ucStraight; 
            return ucVisualDefault;
        }
    };

    const applyGroupLogic = (char: string, groupIdx: 1 | 2 | 3, caseType: 'lc' | 'uc') => {
        const topo = TOPOLOGY[char] || { l: 'V', r: 'V' };
        
        let l: number | null = null;
        let r: number | null = null;

        if (groupIdx === 1) {
            l = getValue(topo.l, caseType, false);
            r = getValue(topo.r, caseType, false);
        } 
        else if (groupIdx === 2) {
            if (topo.l !== 'V') {
                l = getValue(topo.l, caseType, false);
            } else {
                l = getValue('V', caseType, true); 
            }
            if (topo.r !== 'V') {
                r = getValue(topo.r, caseType, false); 
            } else {
                r = getValue('V', caseType, true); 
            }
        } 
        else {
            l = getValue('V', caseType, true);
            r = getValue('V', caseType, true);
        }
        
        setGlyphSB(font, char, l, r);
    };

    settings.groups.group1.forEach(c => applyGroupLogic(c, 1, 'lc'));
    settings.groups.group2.forEach(c => applyGroupLogic(c, 2, 'lc'));
    settings.groups.group3.forEach(c => applyGroupLogic(c, 3, 'lc'));

    settings.groups.upperGroup1.forEach(c => applyGroupLogic(c, 1, 'uc'));
    settings.groups.upperGroup2.forEach(c => applyGroupLogic(c, 2, 'uc'));
    settings.groups.upperGroup3.forEach(c => applyGroupLogic(c, 3, 'uc'));

    Object.entries(settings.overrides).forEach(([char, values]) => {
        setGlyphSB(font, char, values.lsb, values.rsb);
    });
};

export const generateAdhesionText = (targetChar: string, contextGroup: string[]): string => {
    const isUpper = targetChar === targetChar.toUpperCase() && targetChar !== targetChar.toLowerCase();
    
    if (isUpper) {
        const ctx = (!contextGroup || contextGroup.length === 0) ? ['H', 'O'] : contextGroup;
        const r = () => ctx[Math.floor(Math.random() * ctx.length)];
        return `HH${targetChar}HH OO${targetChar}OO ${r()}${targetChar}${r()}`;
    } else {
        const ctx = (!contextGroup || contextGroup.length === 0) ? ['n', 'o'] : contextGroup;
        const r = () => ctx[Math.floor(Math.random() * ctx.length)];
        return `nn${targetChar}nn oo${targetChar}oo ${r()}${targetChar}${r()}`;
    }
};
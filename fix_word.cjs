const fs = require('fs');
let content = fs.readFileSync('src/components/TypingArena.tsx', 'utf8');

// Find the imports and add memo
if (!content.includes('memo')) {
  content = content.replace("import React, { useState, useEffect, useRef, useCallback } from 'react';", "import React, { useState, useEffect, useRef, useCallback, memo } from 'react';");
}

const wordComponent = `
const WordRenderer = memo(({ rawWord, wIdx, isActive, currentInput, activeWordRef }: any) => {
  const word = rawWord.trim();
  const prefix = rawWord.substring(0, rawWord.length - word.length);
  const newlines = (prefix.match(/\\n/g) || []).length;
  const indentStr = prefix.split('\\n').pop() || '';
  const indentCount = indentStr.length;

  return (
    <React.Fragment key={wIdx}>
      {newlines > 0 && Array.from({ length: newlines }).map((_, i) => (
        <div key={\`nl-\${wIdx}-\${i}\`} className={\`w-full \${i > 0 ? 'h-6' : 'h-0'} basis-full\`}></div>
      ))}
      {newlines > 0 && indentCount > 0 && (
        <span style={{ width: \`\${indentCount * 1}ch\` }} className="inline-block pointer-events-none select-none"></span>
      )}
      <span
        ref={isActive ? activeWordRef : null}
        className={\`inline-block py-1 rounded transition-colors \${
          isActive ? 'bg-slate-800/40 px-1' : ''
        }\`}
      >
        {word.split('').map((char: string, cIdx: number) => {
          let charColor = 'text-slate-600'; // untyped
          let bg = '';

          if (cIdx < currentInput.length) {
            if (currentInput[cIdx] === char) {
              charColor = 'text-slate-100 font-medium'; // correct
            } else {
              charColor = 'text-rose-400';
              bg = 'bg-rose-500/20'; // incorrect
            }
          }

          const isCaretHere = isActive && cIdx === currentInput.length;

          return (
            <span key={cIdx} className="relative inline-block">
              {isCaretHere && (
                <span className="absolute left-0 top-0.5 bottom-0.5 w-[2px] bg-indigo-400 animate-pulse rounded-full" />
              )}
              <span className={\`\${charColor} \${bg} rounded-sm\`}>{char}</span>
            </span>
          );
        })}
        {/* Extra characters typed beyond word length */}
        {currentInput.length > word.length &&
          currentInput.substring(word.length).split('').map((char: string, idx: number) => (
            <span key={\`extra-\${idx}\`} className="relative inline-block">
              {isActive && idx === currentInput.length - word.length - 1 && (
                <span className="absolute left-0 top-0.5 bottom-0.5 w-[2px] bg-indigo-400 animate-pulse rounded-full" />
              )}
              <span className="text-rose-400 bg-rose-500/20 opacity-80 rounded-sm">{char}</span>
            </span>
          ))}
        {/* Caret at the very end if we typed exactly the word length or more */}
        {isActive && currentInput.length >= word.length && (
          <span className="relative inline-block">
            <span className="absolute left-0 top-0.5 bottom-0.5 h-full w-[2px] bg-indigo-400 animate-pulse rounded-full" />
          </span>
        )}
      </span>
    </React.Fragment>
  );
});
`;

content = content.replace("export const TypingArena: React.FC<TypingArenaProps> = ({ initialTest, onExitProctored }) => {", wordComponent + "\nexport const TypingArena: React.FC<TypingArenaProps> = ({ initialTest, onExitProctored }) => {");

// Now replace the map content
const oldMapRegex = /\{words\.map\(\(rawWord, wIdx\) => \{[\s\S]*?<\/\React\.Fragment>\s*\);\s*\}\)\}/;

const newMapContent = `{words.map((rawWord, wIdx) => {
              const isActive = wIdx === currentWordIndex;
              const currentInput = isActive ? inputVal : typedWords[wIdx] || '';
              return (
                <WordRenderer
                  key={wIdx}
                  rawWord={rawWord}
                  wIdx={wIdx}
                  isActive={isActive}
                  currentInput={currentInput}
                  activeWordRef={isActive ? activeWordRef : null}
                />
              );
            })}`;

content = content.replace(oldMapRegex, newMapContent);

fs.writeFileSync('src/components/TypingArena.tsx', content);

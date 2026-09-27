import React from 'react';

const SEGMENTS: Record<string, string> = {
  a: 'M 8,6 L 14,2 L 40,2 L 46,6 L 40,10 L 14,10 Z',
  b: 'M 48,8 L 52,14 L 52,40 L 48,44 L 44,38 L 44,14 Z',
  c: 'M 48,46 L 52,50 L 52,76 L 48,82 L 44,76 L 44,50 Z',
  d: 'M 8,84 L 14,80 L 40,80 L 46,84 L 40,88 L 14,88 Z',
  e: 'M 6,46 L 10,50 L 10,76 L 6,82 L 2,76 L 2,50 Z',
  f: 'M 6,8 L 10,14 L 10,38 L 6,44 L 2,38 L 2,14 Z',
  g: 'M 8,45 L 13,41 L 41,41 L 46,45 L 41,49 L 13,49 Z',
};

const DIGIT_MAP: Record<string, string[]> = {
  '0': ['a', 'b', 'c', 'd', 'e', 'f'],
  '1': ['b', 'c'],
  '2': ['a', 'b', 'd', 'e', 'g'],
  '3': ['a', 'b', 'c', 'd', 'g'],
  '4': ['b', 'c', 'f', 'g'],
  '5': ['a', 'c', 'd', 'f', 'g'],
  '6': ['a', 'c', 'd', 'e', 'f', 'g'],
  '7': ['a', 'b', 'c'],
  '8': ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
  '9': ['a', 'b', 'c', 'd', 'f', 'g'],
};

interface SevenSegmentDigitProps {
  digit: string;
}

export const SevenSegmentDigit: React.FC<SevenSegmentDigitProps> = ({ digit }) => {
  const activeSegments = DIGIT_MAP[digit] || [];

  return (
    <div className="digital-segment-box">
      <svg viewBox="0 0 54 90" className="digital-segment-svg" aria-hidden="true">
        {Object.entries(SEGMENTS).map(([key, path]) => {
          const isActive = activeSegments.includes(key);
          return (
            <path
              key={key}
              d={path}
              className={`segment-path ${isActive ? 'segment-on' : 'segment-off'}`}
            />
          );
        })}
      </svg>
    </div>
  );
};

interface FlipCounterDisplayProps {
  value: number;
}

export const FlipCounterDisplay: React.FC<FlipCounterDisplayProps> = ({ value }) => {
  const formattedStr = value.toLocaleString('en-US');
  const paddedStr = formattedStr.length < 6 ? formattedStr.padStart(6, '0') : formattedStr;
  const digits = paddedStr.split('');

  return (
    <div className="digital-counter-container" aria-label={`Current Souls Won: ${value}`}>
      <div className="digital-counter-board">
        <div className="digital-digits-row">
          {digits.map((char, idx) => {
            if (char === ',') {
              return (
                <div key={`colon-${idx}`} className="digital-colon">
                  <span className="colon-dot" />
                  <span className="colon-dot" />
                </div>
              );
            }
            return <SevenSegmentDigit key={`seg-${idx}`} digit={char} />;
          })}
        </div>
      </div>
    </div>
  );
};

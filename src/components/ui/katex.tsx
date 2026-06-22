'use client';

import { useMemo } from 'react';
import katex from 'katex';

interface KatexProps {
  math: string;
  displayMode?: boolean;
  className?: string;
}

export function Katex({ math, displayMode = false, className }: KatexProps) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math, {
        displayMode,
        throwOnError: false,
        strict: false,
        trust: true,
      });
    } catch (error) {
      return math;
    }
  }, [math, displayMode]);

  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

// Helper component to parse mixed text and latex
export function MathText({ text, className }: { text: string, className?: string }) {
  const parts = useMemo(() => {
    const regex = /(\$\$[\s\S]*?\$\$|\$[^\n]*?\$)/g;
    return text.split(regex).filter(Boolean);
  }, [text]);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          return <Katex key={index} math={part.slice(2, -2)} displayMode={true} />;
        }
        if (part.startsWith('$') && part.endsWith('$')) {
          return <Katex key={index} math={part.slice(1, -1)} displayMode={false} />;
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}
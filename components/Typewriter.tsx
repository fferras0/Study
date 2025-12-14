import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface TypewriterProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  children?: React.ReactNode;
}

const Typewriter: React.FC<TypewriterProps> = ({ text, speed = 10, onComplete, children }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    setDisplayedText('');
    setIsDone(false);
    
    // Split by words/spaces to ensure Arabic letters stay connected during typing animation
    // The regex /(\s+)/ splits by whitespace but keeps the delimiters (spaces/newlines) in the array
    const segments = text.split(/(\s+)/);
    let i = 0;
    
    // Adjust speed slightly for word-based typing to maintain good pacing
    const adjustedSpeed = speed + 20;

    const timer = setInterval(() => {
      if (i < segments.length) {
        setDisplayedText((prev) => prev + segments[i]);
        i++;
      } else {
        clearInterval(timer);
        setIsDone(true);
        if (onComplete) onComplete();
      }
    }, adjustedSpeed);

    return () => clearInterval(timer);
  }, [text, speed, onComplete]);

  return (
    <div className="min-h-[100px] text-gray-100 font-medium leading-loose animate-fade-in">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
            // Headers
            h1: ({node, ...props}) => <h1 className="text-2xl md:text-3xl font-bold text-blue-400 mt-6 mb-4 pb-2 border-b border-gray-700 leading-normal" {...props} />,
            h2: ({node, ...props}) => <h2 className="text-xl md:text-2xl font-bold text-indigo-300 mt-5 mb-3 leading-normal" {...props} />,
            h3: ({node, ...props}) => <h3 className="text-lg md:text-xl font-bold text-emerald-400 mt-4 mb-2 leading-normal" {...props} />,
            
            // Lists
            ul: ({node, ...props}) => <ul className="list-disc list-outside ml-6 space-y-1 my-4 text-gray-200" {...props} />,
            ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-6 space-y-1 my-4 text-gray-200" {...props} />,
            li: ({node, ...props}) => <li className="pl-1 leading-loose" {...props} />,
            
            // Text Formatting
            strong: ({node, ...props}) => <strong className="font-bold text-white bg-white/10 px-1 rounded mx-0.5" {...props} />,
            em: ({node, ...props}) => <em className="text-yellow-200 not-italic" {...props} />,
            
            // Tables (Critical for Medical/Eng Logs)
            table: ({node, ...props}) => (
                <div className="overflow-x-auto my-6 rounded-lg border border-gray-700 bg-gray-900/50">
                    <table className="w-full text-left text-sm" {...props} />
                </div>
            ),
            thead: ({node, ...props}) => <thead className="bg-gray-800 text-gray-200 uppercase font-bold tracking-wider" {...props} />,
            tbody: ({node, ...props}) => <tbody className="divide-y divide-gray-700" {...props} />,
            tr: ({node, ...props}) => <tr className="hover:bg-gray-800/50 transition-colors" {...props} />,
            th: ({node, ...props}) => <th className="px-4 py-3 text-left" {...props} />,
            td: ({node, ...props}) => <td className="px-4 py-3 text-gray-200 whitespace-pre-wrap leading-relaxed" {...props} />,
            
            // Code blocks
            code: ({node, inline, className, children, ...props}: any) => {
                return inline ? (
                    <code className="bg-gray-800 text-pink-400 px-1 py-0.5 rounded font-mono text-sm" {...props}>{children}</code>
                ) : (
                    <pre className="bg-black/50 p-4 rounded-lg overflow-x-auto border border-gray-700 my-4">
                        <code className="font-mono text-sm text-green-400 block" {...props}>{children}</code>
                    </pre>
                );
            },
            
            // Blockquotes
            blockquote: ({node, ...props}) => <blockquote className="border-r-4 (dir==rtl) border-l-4 border-blue-500 pl-4 pr-4 italic text-gray-300 my-4 bg-gray-800/30 py-3 rounded leading-loose" {...props} />,
            
            // Paragraphs
            p: ({node, ...props}) => <p className="mb-4 last:mb-0 leading-loose" {...props} />,
        }}
      >
        {displayedText}
      </ReactMarkdown>
      
      <div className={`transition-opacity duration-500 mt-4 ${isDone ? 'opacity-100' : 'opacity-0'}`}>
        {children}
      </div>
    </div>
  );
};

export default Typewriter;
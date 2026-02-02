import React, { useRef } from 'react';
import { Paperclip } from 'lucide-react';

interface InsertFileButtonProps {
  onSelect: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  children?: React.ReactNode;
  className?: string;
}

const InsertFileButton: React.FC<InsertFileButtonProps> = ({
  onSelect,
  accept,
  multiple = true,
  children,
  className = '',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      onSelect(files);
    }
    e.target.value = '';
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
        aria-hidden
      />
      <button
        type="button"
        onClick={handleClick}
        className={
          className ||
          'inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 border border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-xl transition-colors'
        }
        aria-label="插入文件"
      >
        {children ?? (
          <>
            <Paperclip size={16} />
            插入文件
          </>
        )}
      </button>
    </>
  );
};

export default InsertFileButton;

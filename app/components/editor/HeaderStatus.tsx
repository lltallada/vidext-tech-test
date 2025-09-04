import { LoaderCircle } from 'lucide-react';

export default function HeaderStatus({ status }: { status: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm opacity-25 font-light">
        {status === 'idle' && ' '}
        {status === 'saving' && (
          <LoaderCircle size={14} className="inline-block animate-spin ml-1" />
        )}
        {status === 'saved' && 'Saved!'}
        {status === 'error' && 'Error'}
      </span>
    </div>
  );
}

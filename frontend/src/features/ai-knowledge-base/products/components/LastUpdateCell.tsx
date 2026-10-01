import type { ProductLastUpdate } from '../types/product.types';

export function LastUpdateCell({ lastUpdate }: { lastUpdate: ProductLastUpdate }) {
  return (
    <div className="flex flex-col">
      <span className="text-sm text-gray-700 dark:text-slate-300">{lastUpdate.label}</span>
      {lastUpdate.author && (
        <span className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">por {lastUpdate.author}</span>
      )}
    </div>
  );
}

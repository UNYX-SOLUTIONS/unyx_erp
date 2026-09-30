import type { ProductLastUpdate } from '../types/product.types';

export function LastUpdateCell({ lastUpdate }: { lastUpdate: ProductLastUpdate }) {
  return (
    <div className="flex flex-col">
      <span className="text-sm text-gray-700">{lastUpdate.label}</span>
      <span className="mt-0.5 text-xs text-gray-500">por {lastUpdate.author}</span>
    </div>
  );
}

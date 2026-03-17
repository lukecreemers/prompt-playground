import { ChainSidebar } from './ChainSidebar';
import { ChainCanvas } from './ChainCanvas';

export function ChainsPage() {
  return (
    <div className="flex h-full">
      <ChainSidebar />
      <ChainCanvas />
    </div>
  );
}


import Navigation from '@/components/Navigation';
import TopologyGraph from '@/components/topology/TopologyGraph';
import TopologyControls from '@/components/topology/TopologyControls';
import { ReactFlowProvider } from 'reactflow';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useCallback } from 'react';
import useTopologyStore from '@/store/useTopologyStore';

const TopologyDesigner = () => {
  const { addSite, addDC } = useTopologyStore();
  
  const handleAddSite = useCallback(() => {
    const siteNumber = Math.floor(Math.random() * 1000);
    const siteName = `Site ${siteNumber}`;
    addSite(siteName);
  }, [addSite]);
  
  const handleAddDC = useCallback(() => {
    const dcNumber = Math.floor(Math.random() * 100);
    const dcName = `DC${dcNumber}`;
    // Add DC without site assignment initially
    addDC(dcName, "", false);
  }, [addDC]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-blue-700 to-blue-900 text-white py-6">
        <div className="container max-w-6xl mx-auto px-4">
          <h1 className="text-2xl font-bold">Domain Infrastructure Sizing Tool</h1>
          <p className="opacity-80 mt-1">Design and visualize your domain controller topology</p>
        </div>
      </header>
      
      <main className="container max-w-6xl mx-auto px-4 py-8">
        <Navigation />
        
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">Topology Designer</h2>
            <p className="text-sm text-gray-600">Build and visualize your domain controller topology</p>
          </div>
          <div className="flex space-x-3">
            <Button onClick={handleAddSite} variant="outline" size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Add Site
            </Button>
            <Button onClick={handleAddDC} variant="outline" size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Add DC
            </Button>
          </div>
        </div>
        
        <div className="h-[700px] mb-4">
          <ReactFlowProvider>
            <TopologyGraph />
          </ReactFlowProvider>
        </div>
        
        <TopologyControls />
      </main>
      
      <footer className="bg-gray-800 text-white py-4 mt-auto">
        <div className="container max-w-6xl mx-auto px-4 text-sm text-center">
          <p>Domain Infrastructure Sizing and Topology Tool © {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
};

export default TopologyDesigner;

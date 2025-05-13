
import Navigation from '@/components/Navigation';
import SitePanel from '@/components/topology/SitePanel';
import TopologyGraph from '@/components/topology/TopologyGraph';
import TopologyControls from '@/components/topology/TopologyControls';
import { ReactFlowProvider } from 'reactflow';

const TopologyDesigner = () => {
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
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1">
            <SitePanel />
          </div>
          
          <div className="lg:col-span-2 space-y-4">
            <ReactFlowProvider>
              <TopologyGraph />
            </ReactFlowProvider>
            <TopologyControls />
          </div>
        </div>
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

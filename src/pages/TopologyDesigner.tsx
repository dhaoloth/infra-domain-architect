
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const TopologyDesigner = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-gradient-to-r from-blue-700 to-blue-900 text-white py-4">
        <div className="container max-w-7xl mx-auto px-4">
          <h1 className="text-2xl font-bold">Domain Infrastructure Sizing Tool</h1>
          <p className="opacity-80 mt-1">Infrastructure Management</p>
        </div>
      </header>
      
      <main className="flex flex-col flex-grow">
        <div className="container max-w-7xl mx-auto px-4 py-3">
          <Navigation />
          
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-semibold">Feature Unavailable</h2>
          </div>
        </div>
        
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Topology Designer Removed</h2>
            <p className="text-gray-600 mb-6">
              The topology designer feature has been removed from this application.
            </p>
            <Button onClick={() => navigate('/')} variant="default">
              Return to Home
            </Button>
          </div>
        </div>
      </main>
      
      <footer className="bg-gray-800 text-white py-4">
        <div className="container max-w-7xl mx-auto px-4 text-sm text-center">
          <p>Domain Infrastructure Sizing Tool © {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
};

export default TopologyDesigner;

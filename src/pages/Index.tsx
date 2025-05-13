
import InfraCalculator from '@/components/InfraCalculator';

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-blue-700 to-blue-900 text-white py-6">
        <div className="container max-w-6xl mx-auto px-4">
          <h1 className="text-2xl font-bold">Domain Infrastructure Sizing Tool</h1>
          <p className="opacity-80 mt-1">Calculate optimal resource requirements for your enterprise deployment</p>
        </div>
      </header>
      
      <main className="container max-w-6xl mx-auto px-4 py-8">
        <InfraCalculator />
      </main>
      
      <footer className="bg-gray-800 text-white py-4 mt-auto">
        <div className="container max-w-6xl mx-auto px-4 text-sm text-center">
          <p>Domain Infrastructure Sizing and Topology Tool © {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

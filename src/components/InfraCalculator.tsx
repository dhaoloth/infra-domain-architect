import { useState } from 'react';
import { ConfigParams, CalculationResults } from '@/types/types';
import { calculateInfrastructure } from '@/utils/calculationUtils';
import ConfigForm from './ConfigForm';
import ResultsDisplay from './ResultsDisplay';

const InfraCalculator = () => {
  const [results, setResults] = useState<CalculationResults | null>(null);
  const [showResults, setShowResults] = useState<boolean>(false);
  
  const handleCalculate = (config: ConfigParams) => {
    const calculationResults = calculateInfrastructure(config);
    setResults(calculationResults);
    setShowResults(true);
  };

  const handleBackToConfig = () => {
    setShowResults(false);
  };
  
  return (
    <div className="container max-w-6xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Infrastructure Sizing Calculator</h1>
        <p className="text-gray-600">
          Calculate domain controller deployment topology and resource requirements for enterprise infrastructure.
        </p>
      </div>
      
      {showResults && results ? (
        <ResultsDisplay results={results} onBack={handleBackToConfig} />
      ) : (
        <ConfigForm onSubmit={handleCalculate} />
      )}
    </div>
  );
};

export default InfraCalculator;
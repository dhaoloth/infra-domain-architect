
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfigParams, CalculationResults } from '@/types/types';
import { calculateInfrastructure } from '@/utils/calculationUtils';
import ConfigForm from './ConfigForm';
import ResultsDisplay from './ResultsDisplay';

const InfraCalculator = () => {
  const [results, setResults] = useState<CalculationResults | null>(null);
  const [activeTab, setActiveTab] = useState<string>('config');
  
  const handleCalculate = (config: ConfigParams) => {
    const calculationResults = calculateInfrastructure(config);
    setResults(calculationResults);
    setActiveTab('results');
  };
  
  return (
    <div className="container max-w-6xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Infrastructure Sizing Calculator</h1>
        <p className="text-gray-600">
          Calculate domain controller deployment topology and resource requirements for enterprise infrastructure.
        </p>
      </div>
      
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="results" disabled={!results}>Results</TabsTrigger>
          </TabsList>
          <CardContent className="pt-6">
            <TabsContent value="config">
              <ConfigForm onSubmit={handleCalculate} />
            </TabsContent>
            <TabsContent value="results">
              {results && <ResultsDisplay results={results} />}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default InfraCalculator;

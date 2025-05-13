
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Download, Check } from 'lucide-react';
import useTopologyStore from '@/store/useTopologyStore';
import { useState } from 'react';
import { toast } from 'sonner';

const TopologyControls = () => {
  const { validateTopology, exportTopology, errors } = useTopologyStore();
  const [validationRun, setValidationRun] = useState(false);

  const handleValidate = () => {
    const validationErrors = validateTopology();
    setValidationRun(true);
    
    if (validationErrors.length === 0) {
      toast.success('Topology validation passed!');
    } else {
      toast.error(`Found ${validationErrors.length} validation issues`);
    }
  };

  const handleExport = () => {
    const data = exportTopology();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'topology-export.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Topology exported successfully');
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <Button 
          onClick={handleValidate} 
          className="flex-1"
          variant="default"
        >
          <Check size={16} className="mr-2" />
          Validate Topology
        </Button>
        <Button 
          onClick={handleExport} 
          className="flex-1"
          variant="outline"
        >
          <Download size={16} className="mr-2" />
          Export Topology
        </Button>
      </div>
      
      {validationRun && (
        <Card className={errors.length > 0 ? "border-red-300 bg-red-50" : "border-green-300 bg-green-50"}>
          <CardContent className="py-3">
            {errors.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center text-red-700 font-medium">
                  <AlertCircle size={16} className="mr-2" />
                  Validation Issues Found ({errors.length})
                </div>
                <ul className="text-sm space-y-1 list-disc pl-5 text-red-700">
                  {errors.map((error, index) => (
                    <li key={index}>{error.message}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="flex items-center text-green-700 font-medium">
                <Check size={16} className="mr-2" /> 
                Topology is valid
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TopologyControls;

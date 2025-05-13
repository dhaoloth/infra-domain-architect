
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CalculationResults, ResourceSpecs, SubsystemSpecs } from '@/types/types';
import SiteDistribution from './SiteDistribution';

interface ResultsDisplayProps {
  results: CalculationResults | null;
}

const SpecsCard = ({ title, specs }: { title: string; specs: ResourceSpecs | SubsystemSpecs }) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-y-2 gap-x-4">
          <div className="text-sm text-muted-foreground">RAM</div>
          <div className="text-sm font-medium">{specs.ram_gb} GB</div>
          
          <div className="text-sm text-muted-foreground">CPU Cores</div>
          <div className="text-sm font-medium">{specs.cpu_cores}</div>
          
          {'cpu_freq_ghz' in specs && (
            <>
              <div className="text-sm text-muted-foreground">CPU Frequency</div>
              <div className="text-sm font-medium">{specs.cpu_freq_ghz} GHz</div>
            </>
          )}
          
          <div className="text-sm text-muted-foreground">Storage</div>
          <div className="text-sm font-medium">{specs.disk_gb} GB</div>
          
          <div className="text-sm text-muted-foreground">Disk Type</div>
          <div className="text-sm font-medium">{specs.disk_type}</div>
          
          <div className="text-sm text-muted-foreground">Network</div>
          <div className="text-sm font-medium">{specs.network_mbps} Mbps</div>
        </div>
      </CardContent>
    </Card>
  );
};

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results }) => {
  if (!results) return null;
  
  const { 
    site_distribution, 
    vertical_specs, 
    subsystem_specs, 
    average_load_per_dc, 
    warnings,
    total_dcs,
    total_dc_ram,
    total_dc_cpu,
    total_dc_disk,
    total_subsystem_ram,
    total_subsystem_cpu,
    total_subsystem_disk
  } = results;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Calculation Results</h2>
        <Badge variant="outline" className="text-blue-600 bg-blue-50">
          {total_dcs} Total DCs
        </Badge>
      </div>
      
      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((warning, index) => (
            <Alert key={index} variant="destructive">
              <AlertDescription>{warning}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SiteDistribution distribution={site_distribution} totalDCs={total_dcs} />
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Average Load</div>
                <div className="text-lg font-medium">{Math.round(average_load_per_dc)} users per DC</div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Total DCs</div>
                  <div className="text-lg font-medium">{total_dcs}</div>
                </div>
                
                <div>
                  <div className="text-sm text-muted-foreground">Total RAM</div>
                  <div className="text-lg font-medium">{total_dc_ram} GB</div>
                </div>
                
                <div>
                  <div className="text-sm text-muted-foreground">Total CPU</div>
                  <div className="text-lg font-medium">{total_dc_cpu} cores</div>
                </div>
                
                <div>
                  <div className="text-sm text-muted-foreground">Total Storage</div>
                  <div className="text-lg font-medium">{total_dc_disk} GB</div>
                </div>
                
                {Object.keys(subsystem_specs).length > 0 && (
                  <>
                    <div>
                      <div className="text-sm text-muted-foreground">Subsystem RAM</div>
                      <div className="text-lg font-medium">{total_subsystem_ram} GB</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-muted-foreground">Subsystem CPU</div>
                      <div className="text-lg font-medium">{total_subsystem_cpu} cores</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <h3 className="text-xl font-bold mt-6">Resource Specifications</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <SpecsCard title="Per Domain Controller" specs={vertical_specs} />
        
        {Object.entries(subsystem_specs).map(([name, specs]) => (
          <SpecsCard 
            key={name} 
            title={`${name.charAt(0).toUpperCase() + name.slice(1)} Subsystem`} 
            specs={specs} 
          />
        ))}
      </div>
    </div>
  );
};

export default ResultsDisplay;

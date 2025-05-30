import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CalculationResults, ResourceSpecs, SubsystemSpecs } from '@/types/types';
import { exportToPDF } from '@/utils/pdfExport';
import { FileDown } from 'lucide-react';

interface ResultsDisplayProps {
  results: CalculationResults | null;
  onBack: () => void;
}

const SpecsCard = ({ title, specs, totalServers }: { 
  title: string; 
  specs: ResourceSpecs | SubsystemSpecs;
  totalServers?: number;
}) => {
  const isSubsystem = 'per_server' in specs && specs.per_server;
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-y-2 gap-x-4">
          {isSubsystem ? (
            <>
              <div className="col-span-2 mb-2">
                <div className="text-sm font-medium text-muted-foreground mb-1">Per Server:</div>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 pl-4">
                  <div className="text-sm text-muted-foreground">RAM</div>
                  <div className="text-sm font-medium">{specs.per_server.ram_gb} GB</div>
                  
                  <div className="text-sm text-muted-foreground">CPU Cores</div>
                  <div className="text-sm font-medium">{specs.per_server.cpu_cores}</div>
                  
                  <div className="text-sm text-muted-foreground">Storage</div>
                  <div className="text-sm font-medium">{specs.per_server.disk_gb} GB</div>
                </div>
              </div>
              
              <div className="col-span-2">
                <div className="text-sm font-medium text-muted-foreground mb-1">Total ({totalServers} servers):</div>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 pl-4">
                  <div className="text-sm text-muted-foreground">RAM</div>
                  <div className="text-sm font-medium">{specs.ram_gb} GB</div>
                  
                  <div className="text-sm text-muted-foreground">CPU Cores</div>
                  <div className="text-sm font-medium">{specs.cpu_cores}</div>
                  
                  <div className="text-sm text-muted-foreground">Storage</div>
                  <div className="text-sm font-medium">{specs.disk_gb} GB</div>
                </div>
              </div>
              
              <div className="col-span-2 mt-2">
                <Separator className="mb-2" />
                <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                  <div className="text-sm text-muted-foreground">Disk Type</div>
                  <div className="text-sm font-medium">{specs.disk_type}</div>
                  
                  <div className="text-sm text-muted-foreground">Network</div>
                  <div className="text-sm font-medium">{specs.network_mbps} Mbps</div>
                </div>
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const SiteDistributionTree = ({ 
  site, 
  dcCount,
  subsystemDistribution,
  totalSubsystemServers
}: { 
  site: string;
  dcCount: number;
  subsystemDistribution: Record<string, Record<string, number>>;
  totalSubsystemServers: Record<string, number>;
}) => {
  const subsystems = Object.entries(subsystemDistribution)
    .filter(([key, distribution]) => distribution[site] > 0)
    .map(([key, distribution]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
      count: distribution[site]
    }));

  return (
    <div className="mb-8 last:mb-0">
      <div className="flex items-center gap-4 mb-4">
        <h3 className="text-lg font-semibold">{site}</h3>
        <div className="h-px flex-1 bg-border"></div>
        <Badge variant="outline" className="text-blue-600 bg-blue-50">
          {dcCount} DCs
        </Badge>
      </div>
      
      {subsystems.length > 0 && (
        <div className="pl-6 border-l border-dashed border-border">
          {subsystems.map(({ name, count }, index) => (
            <div key={index} className="mb-3 last:mb-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="font-medium">{name}</span>
                <div className="h-px flex-1 bg-border/50"></div>
                <span className="text-sm text-muted-foreground">{count} servers</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, onBack }) => {
  if (!results) return null;
  
  const { 
    site_distribution, 
    vertical_specs, 
    subsystem_specs, 
    subsystem_distribution,
    average_load_per_dc, 
    warnings,
    total_dcs,
    total_dc_ram,
    total_dc_cpu,
    total_dc_disk,
    total_subsystem_ram,
    total_subsystem_cpu,
    total_subsystem_disk,
    total_subsystem_servers
  } = results;
  
  const subsystems = [
    { key: 'monitoring', name: 'Monitoring' },
    { key: 'journaling', name: 'Journaling' },
    { key: 'repository', name: 'Repository' },
    { key: 'os_installation', name: 'OS Installation' },
    { key: 'printing', name: 'Printing' },
    { key: 'file_sharing', name: 'File Sharing' },
    { key: 'dhcp', name: 'DHCP' }
  ];
  
  const enabledSubsystems = subsystems.filter(s => subsystem_specs[s.key]);
  
  const handleExportPDF = () => {
    exportToPDF(results);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button 
            className="text-blue-600 hover:text-blue-800" 
            onClick={onBack}
          >
            ← Back
          </button>
          <h2 className="text-2xl font-bold">Calculation Results</h2>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-blue-600 bg-blue-50">
            {total_dcs} Total DCs
          </Badge>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExportPDF}
            className="flex items-center gap-2"
          >
            <FileDown className="w-4 h-4" />
            Export PDF
          </Button>
        </div>
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
            </div>
            
            {enabledSubsystems.length > 0 && (
              <>
                <Separator />
                
                <h3 className="text-md font-medium">Subsystem Totals</h3>
                
                <div className="grid grid-cols-3 gap-4">
                  {total_subsystem_servers && (
                    <div>
                      <div className="text-sm text-muted-foreground">Total Servers</div>
                      <div className="text-lg font-medium">
                        {Object.values(total_subsystem_servers).reduce((a, b) => a + b, 0)}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <div className="text-sm text-muted-foreground">Total RAM</div>
                    <div className="text-lg font-medium">{total_subsystem_ram} GB</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground">Total CPU</div>
                    <div className="text-lg font-medium">{total_subsystem_cpu} cores</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground">Total Storage</div>
                    <div className="text-lg font-medium">{total_subsystem_disk} GB</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                  {enabledSubsystems.map(subsystem => {
                    const serverCount = total_subsystem_servers?.[subsystem.key] || 0;
                    if (serverCount === 0) return null;
                    
                    return (
                      <div key={subsystem.key}>
                        <div className="text-sm text-muted-foreground">{subsystem.name}</div>
                        <div className="text-lg font-medium">{serverCount} servers</div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Infrastructure Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.entries(site_distribution).map(([site, dcCount]) => (
            <SiteDistributionTree
              key={site}
              site={site}
              dcCount={dcCount}
              subsystemDistribution={subsystem_distribution || {}}
              totalSubsystemServers={total_subsystem_servers || {}}
            />
          ))}
        </CardContent>
      </Card>
      
      <h3 className="text-xl font-bold mt-6">Resource Specifications</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <SpecsCard title="Per Domain Controller" specs={vertical_specs} />
        
        {enabledSubsystems.map(subsystem => {
          const specs = subsystem_specs[subsystem.key];
          const serverCount = total_subsystem_servers?.[subsystem.key] || 0;
          if (!specs) return null;
          
          return (
            <SpecsCard 
              key={subsystem.key} 
              title={`${subsystem.name} Subsystem`} 
              specs={specs}
              totalServers={serverCount}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ResultsDisplay;

import { useState } from 'react';
import { NodeProps, NodeResizer } from 'reactflow';
import { Edit, X } from 'lucide-react';
import { Site } from '@/types/topology-types';
import useTopologyStore from '@/store/useTopologyStore';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from '@/components/ui/tooltip';

const SiteNode = ({ data, id }: NodeProps<Site>) => {
  const { updateSite, removeSite, dcs } = useTopologyStore();
  const [name, setName] = useState(data.name);
  
  // Get DCs in this site
  const sitesDCs = useTopologyStore.getState().dcs.filter(dc => dc.siteId === id);
  
  const handleSave = () => {
    updateSite(id, name);
  };
  
  const handleRemove = () => {
    // Check if site has DCs
    if (sitesDCs.length === 0) {
      removeSite(id);
    }
  };

  return (
    <div className="min-w-[200px] min-h-[150px] border-2 border-dashed border-blue-200 bg-blue-50/30 rounded-md p-3 flex flex-col">
      <NodeResizer minWidth={200} minHeight={150} />
      
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-blue-700">{data.name}</h3>
        
        <div className="flex items-center space-x-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-xs text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded-full bg-blue-50">
                  {sitesDCs.length} DCs
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="p-2">
                <div className="text-xs">
                  <p className="font-medium">Domain Controllers:</p>
                  {sitesDCs.length > 0 ? (
                    <ul className="list-disc pl-4 mt-1">
                      {sitesDCs.map(dc => (
                        <li key={dc.id}>{dc.name}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="italic mt-1">No DCs in this site</p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Edit className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" onClick={e => e.stopPropagation()}>
              <div className="space-y-3">
                <h3 className="font-medium text-sm">Edit Site</h3>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Name</label>
                  <Input 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="flex justify-between">
                  <Button 
                    onClick={handleRemove}
                    variant="outline" 
                    size="sm" 
                    disabled={sitesDCs.length > 0}
                    className="text-red-500 hover:text-red-600"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Remove
                  </Button>
                  <Button onClick={handleSave} size="sm">Save</Button>
                </div>
                {sitesDCs.length > 0 && (
                  <p className="text-xs text-amber-600">
                    Cannot remove site with assigned DCs
                  </p>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};

export default SiteNode;

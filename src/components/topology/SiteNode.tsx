
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
  HoverCard,
  HoverCardContent,
  HoverCardTrigger
} from '@/components/ui/hover-card';

// Generate a random pastel color for site backgrounds
const generateRandomPastelColor = () => {
  const hue = Math.floor(Math.random() * 360);
  return `hsla(${hue}, 70%, 90%, 0.3)`;
};

const SiteNode = ({ data, id }: NodeProps<Site>) => {
  const { updateSite, removeSite, dcs } = useTopologyStore();
  const [name, setName] = useState(data.name || `Site ${Math.floor(Math.random() * 1000)}`);
  const [isOpen, setIsOpen] = useState(false);
  
  // Get DCs in this site
  const sitesDCs = useTopologyStore.getState().dcs.filter(dc => dc.siteId === id);
  
  // Use the background color from the data or generate a new one
  const backgroundColor = data.backgroundColor || generateRandomPastelColor();
  
  const handleSave = () => {
    // Ensure name is not empty
    const siteName = name.trim() ? name : `Site ${Math.floor(Math.random() * 1000)}`;
    updateSite(id, siteName, { backgroundColor });
    setIsOpen(false);
  };
  
  const handleRemove = () => {
    // Check if site has DCs
    if (sitesDCs.length === 0) {
      removeSite(id);
    }
  };

  // Properly defined onResize function for ReactFlow's NodeResizer
  const onResize = (
    _event: React.MouseEvent<Element, MouseEvent>,
    _nodeId: string,
    _direction: any,
    _isDone: boolean
  ) => {
    // Since the actual dimensions aren't directly passed in ReactFlow v11,
    // we need to get them from the DOM after the resize is completed
    setTimeout(() => {
      const nodeElement = document.querySelector(`[data-id="${id}"]`);
      if (nodeElement) {
        const width = nodeElement.clientWidth;
        const height = nodeElement.clientHeight;
        
        updateSite(id, undefined, { 
          width, 
          height 
        });
      }
    }, 0);
  };

  return (
    <HoverCard openDelay={0} closeDelay={0}>
      <HoverCardTrigger asChild>
        <div 
          className="min-w-[200px] min-h-[150px] border-2 border-dashed border-blue-200 rounded-md p-3 flex flex-col"
          style={{ backgroundColor }}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
        >
          <NodeResizer 
            minWidth={200} 
            minHeight={150} 
            onResize={onResize} 
          />
          
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-blue-700">{data.name || 'Unnamed Site'}</h3>
            
            <div className="flex items-center space-x-1">
              <div className="text-xs text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded-full bg-blue-50">
                {sitesDCs.length} DCs
              </div>
              
              <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={e => e.stopPropagation()}>
                    <Edit className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 z-[100]" onClick={e => e.stopPropagation()}>
                  <div className="space-y-3">
                    <h3 className="font-medium text-sm">Edit Site</h3>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Name</label>
                      <Input 
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="h-8 text-sm"
                        placeholder={`Site ${Math.floor(Math.random() * 1000)}`}
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
      </HoverCardTrigger>
      <HoverCardContent 
        side="top" 
        align="center" 
        className="z-[1000] bg-white shadow-lg rounded-lg p-4 border border-gray-200 w-64"
      >
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">{data.name || 'Unnamed Site'}</h3>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Domain Controllers:</span>
              <span className="font-medium">{sitesDCs.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Size:</span>
              <span className="font-medium">{data.width || 300} × {data.height || 200} px</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Color:</span>
              <div 
                className="w-4 h-4 rounded-full border border-gray-200" 
                style={{ backgroundColor }}
              ></div>
            </div>
            {sitesDCs.length > 0 && (
              <div className="pt-1 mt-1 border-t border-gray-100">
                <p className="text-gray-500 mb-1">Assigned DCs:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  {sitesDCs.map(dc => (
                    <li key={dc.id}>{dc.name || 'Unnamed DC'}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default SiteNode;

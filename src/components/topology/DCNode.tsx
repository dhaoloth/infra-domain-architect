
import { useState, useEffect } from 'react';
import { Handle, NodeProps, Position } from 'reactflow';
import { Server, Edit, Link } from 'lucide-react';
import { DC } from '@/types/topology-types';
import useTopologyStore from '@/store/useTopologyStore';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import LinkEditor from './LinkEditor';

interface ExtendedDC extends DC {
  siteName: string;
}

const DCNode = ({ data, id }: NodeProps<ExtendedDC>) => {
  const { sites, getLinkCountForDC, dcs, updateDC } = useTopologyStore();
  const linkCount = getLinkCountForDC(id);
  
  // Get all connected DCs
  const connectedDCs = useTopologyStore.getState().links
    .filter(link => link.sourceDC === id || link.targetDC === id)
    .map(link => {
      const connectedId = link.sourceDC === id ? link.targetDC : link.sourceDC;
      return dcs.find(dc => dc.id === connectedId);
    })
    .filter(Boolean) as DC[];
    
  // State for editing
  const [name, setName] = useState(data.name || `DC${Math.floor(Math.random() * 100)}`);
  const [isKey, setIsKey] = useState(data.isKey);
  const [siteId, setSiteId] = useState(data.siteId || "unassigned");
  const [showLinkEditor, setShowLinkEditor] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    setName(data.name || `DC${Math.floor(Math.random() * 100)}`);
    setIsKey(data.isKey);
    setSiteId(data.siteId || "unassigned");
  }, [data]);
  
  const handleSave = () => {
    // Ensure name is not empty
    const dcName = name.trim() ? name : `DC${Math.floor(Math.random() * 100)}`;
    // Update the DC with validated data
    updateDC(id, { 
      name: dcName, 
      isKey, 
      siteId: siteId === "unassigned" ? "" : siteId 
    });
    setIsOpen(false);
  };

  const bgColorClass = data.isKey ? 'bg-amber-50' : siteId !== "unassigned" ? 'bg-white' : 'bg-gray-50';
  const borderColorClass = data.isKey ? 'border-amber-300' : siteId !== "unassigned" ? 'border-gray-200' : 'border-gray-300';

  return (
    <div 
      className={`px-4 py-3 rounded-md shadow-sm transition-colors ${bgColorClass} ${borderColorClass} border`}
      onClick={(e) => {
        e.stopPropagation();
        setIsOpen(true);
      }}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center space-x-2">
              <Server size={18} className={data.isKey ? 'text-amber-600' : siteId !== "unassigned" ? 'text-blue-600' : 'text-gray-600'} />
              <div>
                <div className="font-medium text-sm">{data.name || 'Unnamed DC'}</div>
                <div className="text-xs text-gray-500">
                  {data.siteName || 'Unassigned'}
                </div>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs w-64 p-3 z-[100]">
            <div className="space-y-2">
              <h4 className="font-semibold">{data.name || 'Unnamed DC'}</h4>
              <div className="text-xs">
                <p><span className="font-semibold">Site:</span> {data.siteName || 'Unassigned'}</p>
                <p><span className="font-semibold">Key DC:</span> {data.isKey ? 'Yes' : 'No'}</p>
                <p><span className="font-semibold">Connections:</span> {linkCount}/4</p>
                
                {connectedDCs.length > 0 && (
                  <div className="mt-1">
                    <p className="font-semibold">Connected to:</p>
                    <ul className="list-disc list-inside">
                      {connectedDCs.map(dc => (
                        <li key={dc.id}>{dc.name || 'Unnamed DC'}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <div className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center bg-blue-600 text-white text-xs rounded-full shadow-sm">
        {linkCount}
      </div>
      
      {data.isKey && (
        <div className="absolute -top-1 -left-1 px-1 py-0.5 text-[10px] bg-amber-400 text-white rounded">
          Key
        </div>
      )}
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button 
            className="absolute -bottom-2 -right-2 w-6 h-6 bg-white rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(true);
            }}
          >
            <Edit size={12} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-4 z-[100]" onClick={(e) => e.stopPropagation()}>
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Edit Domain Controller</h4>
            
            <div className="space-y-2">
              <Label htmlFor="dc-name">Name</Label>
              <Input 
                id="dc-name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="h-8 text-sm"
                placeholder={`DC${Math.floor(Math.random() * 100)}`}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dc-site">Assigned Site</Label>
              <Select 
                value={siteId === "" ? "unassigned" : siteId} 
                onValueChange={(value) => setSiteId(value)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select site" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {sites.map(site => (
                    <SelectItem key={site.id} value={site.id}>{site.name || 'Unnamed Site'}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="is-key" 
                checked={isKey} 
                onCheckedChange={(checked) => setIsKey(checked === true)} 
              />
              <Label htmlFor="is-key" className="text-sm font-normal">Key Domain Controller</Label>
            </div>
            
            <div className="pt-2 border-t">
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setShowLinkEditor(true);
                  setIsOpen(false);
                }}
              >
                <Link size={14} className="mr-2" />
                Manage Connections
              </Button>
            </div>
            
            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={handleSave}>Save</Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      {showLinkEditor && (
        <LinkEditor 
          dcId={id} 
          onClose={() => setShowLinkEditor(false)} 
        />
      )}
    </div>
  );
};

export default DCNode;

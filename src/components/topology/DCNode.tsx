
import { useState } from 'react';
import { Handle, NodeProps, Position } from 'reactflow';
import { Server } from 'lucide-react';
import { DC } from '@/types/topology-types';
import useTopologyStore from '@/store/useTopologyStore';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from '@/components/ui/tooltip';

interface ExtendedDC extends DC {
  siteName: string;
  onDCClick?: (dcId: string) => void;
}

const DCNode = ({ data, id }: NodeProps<ExtendedDC>) => {
  const { getLinkCountForDC, dcs } = useTopologyStore();
  const linkCount = getLinkCountForDC(id);
  
  // Get all connected DCs
  const connectedDCs = useTopologyStore.getState().links
    .filter(link => link.sourceDC === id || link.targetDC === id)
    .map(link => {
      const connectedId = link.sourceDC === id ? link.targetDC : link.sourceDC;
      return dcs.find(dc => dc.id === connectedId);
    })
    .filter(Boolean) as DC[];
    
  // Get site ID for styling
  const siteId = data.siteId || "unassigned";

  const bgColorClass = data.isKey ? 'bg-amber-50' : siteId !== "unassigned" ? 'bg-white' : 'bg-gray-50';
  const borderColorClass = data.isKey ? 'border-amber-300' : siteId !== "unassigned" ? 'border-gray-200' : 'border-gray-300';

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.onDCClick) {
      data.onDCClick(id);
    }
  };

  return (
    <div 
      className={`px-4 py-3 rounded-md shadow-sm transition-colors ${bgColorClass} ${borderColorClass} border cursor-pointer`}
      onClick={handleClick}
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
    </div>
  );
};

export default DCNode;

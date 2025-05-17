
import { useState } from 'react';
import { Handle, NodeProps, Position } from 'reactflow';
import { Server } from 'lucide-react';
import { DC } from '@/types/topology-types';
import useTopologyStore from '@/store/useTopologyStore';
import { 
  HoverCard,
  HoverCardContent,
  HoverCardTrigger 
} from '@/components/ui/hover-card';

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
    <HoverCard openDelay={0} closeDelay={0}>
      <HoverCardTrigger asChild>
        <div 
          className={`px-4 py-3 rounded-md shadow-sm transition-colors ${bgColorClass} ${borderColorClass} border cursor-pointer`}
          onClick={handleClick}
        >
          <Handle type="target" position={Position.Top} className="w-3 h-3" />
          <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
          <Handle type="target" position={Position.Left} className="w-3 h-3" />
          <Handle type="source" position={Position.Right} className="w-3 h-3" />
          
          <div className="flex items-center space-x-2">
            <Server size={18} className={data.isKey ? 'text-amber-600' : siteId !== "unassigned" ? 'text-blue-600' : 'text-gray-600'} />
            <div>
              <div className="font-medium text-sm">{data.name || 'Unnamed DC'}</div>
              <div className="text-xs text-gray-500">
                {data.siteName || 'Unassigned'}
              </div>
            </div>
          </div>
          
          <div className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center bg-blue-600 text-white text-xs rounded-full shadow-sm">
            {linkCount}
          </div>
          
          {data.isKey && (
            <div className="absolute -top-1 -left-1 px-1 py-0.5 text-[10px] bg-amber-400 text-white rounded">
              Key
            </div>
          )}
        </div>
      </HoverCardTrigger>
      <HoverCardContent 
        side="right" 
        align="start" 
        className="z-[1000] bg-white shadow-lg rounded-lg p-4 border border-gray-200 w-64"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Server size={20} className={data.isKey ? 'text-amber-600' : siteId !== "unassigned" ? 'text-blue-600' : 'text-gray-600'} />
            <h4 className="font-semibold">{data.name || 'Unnamed DC'}</h4>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Site:</span>
              <span className="font-medium">{data.siteName || 'Unassigned'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status:</span>
              <span className="font-medium">{data.isKey ? 'Key Domain Controller' : 'Standard Domain Controller'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Connections:</span>
              <span className="font-medium">{linkCount}/4</span>
            </div>
            
            {connectedDCs.length > 0 && (
              <div className="pt-2 mt-1 border-t border-gray-100">
                <p className="text-gray-500 mb-1">Connected to:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  {connectedDCs.map(dc => (
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

export default DCNode;

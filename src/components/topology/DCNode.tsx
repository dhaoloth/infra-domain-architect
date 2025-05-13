
import { Handle, NodeProps, Position } from '@xyflow/react';
import { Server } from 'lucide-react';
import { DC } from '@/types/topology-types';
import useTopologyStore from '@/store/useTopologyStore';

const DCNode = ({ data, id }: NodeProps<DC>) => {
  const { sites, getLinkCountForDC } = useTopologyStore();
  const site = sites.find(site => site.id === data.siteId);
  const linkCount = getLinkCountForDC(id);

  return (
    <div className={`px-4 py-3 rounded-md border shadow-sm ${data.isKey ? 'bg-amber-50 border-amber-300' : 'bg-white border-gray-200'}`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
      
      <div className="flex items-center space-x-2">
        <Server size={18} className={data.isKey ? 'text-amber-600' : 'text-blue-600'} />
        <div>
          <div className="font-medium text-sm">{data.name}</div>
          <div className="text-xs text-gray-500">
            {site?.name || 'Unknown Site'}
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
  );
};

export default DCNode;

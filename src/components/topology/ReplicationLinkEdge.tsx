
import { EdgeProps, getBezierPath } from 'reactflow';
import useTopologyStore from '@/store/useTopologyStore';

const ReplicationLinkEdge = ({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps) => {
  const { removeLink, dcs } = useTopologyStore();
  const isInterSite = data?.isInterSite;
  
  // Find the source and target DCs
  const sourceDC = dcs.find(dc => dc.id === source);
  const targetDC = dcs.find(dc => dc.id === target);
  
  // Check if both DCs are key DCs and it's inter-site
  const isKeyConnection = isInterSite && sourceDC?.isKey && targetDC?.isKey;

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  
  // Choose color based on connection type
  const strokeColor = isKeyConnection 
    ? '#9333ea' // Purple for key DC inter-site connections
    : isInterSite 
      ? '#2563eb' // Blue for regular inter-site connections
      : '#333333'; // Dark gray for intra-site connections

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        strokeWidth={2}
        stroke={strokeColor}
        strokeDasharray={isInterSite ? '5,5' : 'none'}
      />
      <path
        d={edgePath}
        strokeOpacity={0}
        strokeWidth={12}
        fill="none"
        onClick={() => removeLink(id)}
        className="cursor-pointer"
      />
    </>
  );
};

export default ReplicationLinkEdge;

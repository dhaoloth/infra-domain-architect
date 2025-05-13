
import { useCallback } from 'react';
import { 
  BaseEdge, 
  EdgeProps, 
  getBezierPath,
  useReactFlow
} from 'reactflow';
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
  data
}: EdgeProps) => {
  const { dcs, removeLink } = useTopologyStore();
  const { setEdges } = useReactFlow();
  
  const sourceDC = dcs.find(dc => dc.id === source);
  const targetDC = dcs.find(dc => dc.id === target);

  const isInterSite = sourceDC?.siteId !== targetDC?.siteId || 
                      sourceDC?.siteId === "" || 
                      targetDC?.siteId === "";
                      
  const isKeyToKey = sourceDC?.isKey && targetDC?.isKey && isInterSite && 
                     sourceDC?.siteId !== "" && targetDC?.siteId !== "";

  let edgeColor = isKeyToKey ? '#86efac' : // green-300 for key-to-key links
                  !isInterSite ? '#4b5563' : // gray-600 for intra-site links
                  '#93c5fd'; // blue-300 for regular inter-site links
                  
  let edgeStyle = {
    strokeWidth: 2,
    stroke: edgeColor
  };
  
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  
  const onEdgeClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    removeLink(id);
  }, [id, removeLink]);

  return (
    <>
      <BaseEdge path={edgePath} style={edgeStyle} />
      <path
        d={edgePath}
        stroke="transparent"
        strokeWidth={12}
        fill="none"
        className="cursor-pointer"
        onClick={onEdgeClick}
      />
    </>
  );
};

export default ReplicationLinkEdge;

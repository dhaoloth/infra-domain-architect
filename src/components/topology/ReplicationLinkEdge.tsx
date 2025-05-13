
import { EdgeProps, getBezierPath } from '@xyflow/react';
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
  const { removeLink } = useTopologyStore();
  const isInterSite = data?.isInterSite;

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        strokeWidth={2}
        stroke={isInterSite ? '#9333ea' : '#2563eb'}
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

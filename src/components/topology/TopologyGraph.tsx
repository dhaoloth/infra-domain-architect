
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ConnectionMode,
  useReactFlow,
  BackgroundVariant,
  NodeMouseHandler,
  OnConnectStartParams,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';
import DCNode from './DCNode';
import ReplicationLinkEdge from './ReplicationLinkEdge';
import useTopologyStore from '@/store/useTopologyStore';
import { toast } from 'sonner';

const nodeTypes = {
  dc: DCNode,
};

const edgeTypes = {
  replication: ReplicationLinkEdge,
};

// Grid size for node snapping
const GRID_SIZE = 15;

// Helper function to snap position to grid
const snapToGrid = (position: { x: number, y: number }) => {
  return {
    x: Math.round(position.x / GRID_SIZE) * GRID_SIZE,
    y: Math.round(position.y / GRID_SIZE) * GRID_SIZE,
  };
};

const TopologyGraph = () => {
  const { 
    dcs, 
    links, 
    sites,
    addLink, 
    canCreateLink,
    updateDC
  } = useTopologyStore();
  
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [connectingNodeId, setConnectingNodeId] = useState<string | null>(null);

  // Convert store data to ReactFlow nodes and edges
  const initialNodes: Node[] = useMemo(() => dcs.map(dc => ({
    id: dc.id,
    type: 'dc',
    data: { 
      ...dc, 
      siteName: sites.find(site => site.id === dc.siteId)?.name || 'Unknown Site',
    },
    position: { x: dc.x || Math.random() * 500, y: dc.y || Math.random() * 400 },
  })), [dcs, sites]);

  const initialEdges: Edge[] = useMemo(() => links.map(link => ({
    id: link.id,
    source: link.sourceDC,
    target: link.targetDC,
    type: 'replication',
    data: { isInterSite: link.isInterSite },
  })), [links]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  // Get the reactFlow utility functions
  const { project } = useReactFlow();

  // Update nodes when dcs or links change
  useEffect(() => {
    setNodes(prev => {
      const nodeMap = new Map(prev.map(node => [node.id, node]));
      
      return dcs.map(dc => {
        const existingNode = nodeMap.get(dc.id);
        const siteName = sites.find(site => site.id === dc.siteId)?.name || 'Unknown Site';
        
        return {
          id: dc.id,
          type: 'dc',
          data: { 
            ...dc,
            siteName,
          },
          position: existingNode ? existingNode.position : { 
            x: dc.x || Math.random() * 500, 
            y: dc.y || Math.random() * 400 
          },
        };
      });
    });
  }, [dcs, sites, setNodes]);

  // Update edges when links change
  useEffect(() => {
    setEdges(links.map(link => ({
      id: link.id,
      source: link.sourceDC,
      target: link.targetDC,
      type: 'replication',
      data: { isInterSite: link.isInterSite },
    })));
  }, [links, setEdges]);

  // Handle node drag to save position
  const onNodeDragStop = useCallback((event: React.MouseEvent, node: Node) => {
    // Snap to grid
    const snappedPosition = snapToGrid(node.position);
    
    // Update the store with the new node position
    updateDC(node.id, { 
      x: snappedPosition.x,
      y: snappedPosition.y
    });
  }, [updateDC]);

  // Handle connection start
  const onConnectStart = useCallback((_: React.MouseEvent, { nodeId }: OnConnectStartParams) => {
    if (nodeId) setConnectingNodeId(nodeId);
  }, []);

  // Handle connection end
  const onConnectEnd = useCallback(
    (event: MouseEvent) => {
      if (!connectingNodeId || !reactFlowWrapper.current || !reactFlowInstance) return;

      // Get the position from the event
      const targetPosition = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Find the node at this position (if any)
      const targetNode = nodes.find(
        node =>
          targetPosition.x > node.position.x &&
          targetPosition.x < node.position.x + (node.width || 150) &&
          targetPosition.y > node.position.y &&
          targetPosition.y < node.position.y + (node.height || 40)
      );

      if (targetNode && targetNode.id !== connectingNodeId) {
        if (canCreateLink(connectingNodeId, targetNode.id)) {
          addLink(connectingNodeId, targetNode.id);
        } else {
          toast.error('Cannot create link - check for duplicates or max connections (4)');
        }
      }

      setConnectingNodeId(null);
    },
    [reactFlowInstance, connectingNodeId, nodes, canCreateLink, addLink]
  );

  // Handle connection creation
  const onConnect = useCallback((connection: Connection) => {
    const { source, target } = connection;
    
    if (source && target) {
      if (canCreateLink(source, target)) {
        addLink(source, target);
      } else {
        toast.error('Cannot create link - check for duplicates or max connections (4)');
      }
    }
  }, [addLink, canCreateLink]);

  return (
    <div ref={reactFlowWrapper} className="w-full h-[700px] border rounded-md bg-gray-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onNodeDragStop={onNodeDragStop}
        onInit={setReactFlowInstance}
        connectionMode={ConnectionMode.Loose}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        snapToGrid
        snapGrid={[GRID_SIZE, GRID_SIZE]}
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
      >
        <Controls />
        <Background
          variant={BackgroundVariant.Dots}
          gap={GRID_SIZE}
          size={1}
        />
      </ReactFlow>
    </div>
  );
};

export default TopologyGraph;

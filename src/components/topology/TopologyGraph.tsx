
import { useState, useCallback, useMemo } from 'react';
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

const TopologyGraph = () => {
  const { 
    dcs, 
    links, 
    addLink, 
    canCreateLink
  } = useTopologyStore();

  // Convert store data to ReactFlow nodes and edges
  const initialNodes: Node[] = useMemo(() => dcs.map(dc => ({
    id: dc.id,
    type: 'dc',
    data: dc,
    position: { x: dc.x || Math.random() * 500, y: dc.y || Math.random() * 400 },
  })), [dcs]);

  const initialEdges: Edge[] = useMemo(() => links.map(link => ({
    id: link.id,
    source: link.sourceDC,
    target: link.targetDC,
    type: 'replication',
    data: { isInterSite: link.isInterSite },
  })), [links]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when dcs or links change
  useMemo(() => {
    setNodes(prev => {
      const nodeMap = new Map(prev.map(node => [node.id, node]));
      
      return dcs.map(dc => {
        const existingNode = nodeMap.get(dc.id);
        return {
          id: dc.id,
          type: 'dc',
          data: dc,
          position: existingNode ? existingNode.position : { 
            x: dc.x || Math.random() * 500, 
            y: dc.y || Math.random() * 400 
          },
        };
      });
    });
  }, [dcs, setNodes]);

  // Update edges when links change
  useMemo(() => {
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
    // Update the store with the new node position
    const { x, y } = node.position;
    useTopologyStore.getState().updateDC(node.id, { x, y });
  }, []);

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
    <div className="w-full h-[700px] border rounded-md bg-gray-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        connectionMode={ConnectionMode.Loose}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
};

export default TopologyGraph;

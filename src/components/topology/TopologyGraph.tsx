
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
  ReactFlowInstance,
  OnConnectStartParams,
  NodeChange,
  NodeDimensionChange,
} from 'reactflow';
import 'reactflow/dist/style.css';
import DCNode from './DCNode';
import SiteNode from './SiteNode';
import ReplicationLinkEdge from './ReplicationLinkEdge';
import useTopologyStore from '@/store/useTopologyStore';
import { toast } from 'sonner';

const nodeTypes = {
  dc: DCNode,
  site: SiteNode
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

// Default site dimensions
const DEFAULT_SITE_WIDTH = 300;
const DEFAULT_SITE_HEIGHT = 200;

// Generate a random pastel color for site backgrounds
const generateRandomPastelColor = () => {
  const hue = Math.floor(Math.random() * 360);
  return `hsla(${hue}, 70%, 90%, 0.3)`;
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
  const initialNodes: Node[] = useMemo(() => {
    // First create site nodes (they should be rendered below DC nodes)
    const siteNodes = sites.map((site, index) => ({
      id: site.id,
      type: 'site',
      data: {
        ...site,
        backgroundColor: site.backgroundColor || generateRandomPastelColor()
      },
      position: { 
        x: site.x || (index * 350) + 50, 
        y: site.y || 100 
      },
      style: { 
        width: site.width || DEFAULT_SITE_WIDTH,
        height: site.height || DEFAULT_SITE_HEIGHT,
        zIndex: 0 // Lower z-index for sites
      },
      draggable: true,
      selectable: true,
    }));
    
    // Then create DC nodes
    const dcNodes = dcs.map(dc => ({
      id: dc.id,
      type: 'dc',
      data: { 
        ...dc, 
        siteName: sites.find(site => site.id === dc.siteId)?.name || '', 
      },
      position: { 
        x: dc.x || Math.random() * 500, 
        y: dc.y || Math.random() * 400 
      },
      parentId: dc.siteId || undefined,
      draggable: true,
      selectable: true,
      zIndex: 1 // Higher z-index for DCs
    }));
    
    return [...siteNodes, ...dcNodes];
  }, [dcs, sites]);

  const initialEdges: Edge[] = useMemo(() => links.map(link => ({
    id: link.id,
    source: link.sourceDC,
    target: link.targetDC,
    type: 'replication',
    data: link,
  })), [links]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  // Get the reactFlow utility functions
  const { project } = useReactFlow();

  // Update nodes when dcs, sites or links change
  useEffect(() => {
    setNodes(prev => {
      const nodeMap = new Map(prev.map(node => [node.id, node]));
      
      // Update existing site nodes and add new ones
      const siteNodes = sites.map(site => {
        const existingNode = nodeMap.get(site.id);
        const backgroundColor = site.backgroundColor || generateRandomPastelColor();
        
        return {
          id: site.id,
          type: 'site',
          data: {
            ...site,
            backgroundColor
          },
          position: existingNode ? existingNode.position : { 
            x: site.x || Math.random() * 500, 
            y: site.y || 100 
          },
          style: { 
            width: site.width || DEFAULT_SITE_WIDTH,
            height: site.height || DEFAULT_SITE_HEIGHT,
            zIndex: 0,
            backgroundColor
          },
          draggable: true,
          selectable: true,
        };
      });
      
      // Update existing DC nodes and add new ones
      const dcNodes = dcs.map(dc => {
        const existingNode = nodeMap.get(dc.id);
        const siteName = sites.find(site => site.id === dc.siteId)?.name || '';
        
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
          parentId: dc.siteId || undefined,
          draggable: true,
          selectable: true,
          zIndex: 1
        };
      });
      
      return [...siteNodes, ...dcNodes];
    });
  }, [dcs, sites, setNodes]);

  // Update edges when links change
  useEffect(() => {
    setEdges(links.map(link => ({
      id: link.id,
      source: link.sourceDC,
      target: link.targetDC,
      type: 'replication',
      data: link,
    })));
  }, [links, setEdges]);

  // Handle node drag to save position
  const onNodeDragStop = useCallback((event: React.MouseEvent, node: Node) => {
    // Snap to grid
    const snappedPosition = snapToGrid(node.position);
    
    // Check if the node is a site
    if (node.type === 'site') {
      // Update site position in store
      useTopologyStore.getState().updateSite(node.id, undefined, {
        x: snappedPosition.x,
        y: snappedPosition.y,
        width: node.style?.width as number || DEFAULT_SITE_WIDTH,
        height: node.style?.height as number || DEFAULT_SITE_HEIGHT
      });
    } else {
      // Update DC position in store
      updateDC(node.id, { 
        x: snappedPosition.x,
        y: snappedPosition.y
      });
    }
  }, [updateDC]);
  
  // Handle node resize events through onNodesChange
  const handleNodeResize = useCallback((nodeChanges: NodeChange[]) => {
    // Filter out resize changes
    const resizeChanges = nodeChanges.filter(
      change => change.type === 'dimensions' && change.dimensions
    );
    
    // Process each resize change
    resizeChanges.forEach(change => {
      if (change.type === 'dimensions' && change.dimensions) {
        const node = nodes.find(n => n.id === change.id);
        if (node && node.type === 'site') {
          // Update site dimensions in store
          useTopologyStore.getState().updateSite(node.id, undefined, {
            width: change.dimensions.width,
            height: change.dimensions.height
          });
        }
      }
    });
  }, [nodes]);

  // Extend onNodesChange to handle resizes
  const onNodesChangeExtended = useCallback(
    (changes: NodeChange[]) => {
      handleNodeResize(changes);
      onNodesChange(changes);
    },
    [onNodesChange, handleNodeResize]
  );

  // Check if a DC is within a site area
  const checkDCInSite = useCallback((dcNode: Node, siteNodes: Node[]) => {
    for (const siteNode of siteNodes) {
      const siteX = siteNode.position.x;
      const siteY = siteNode.position.y;
      const siteWidth = (siteNode.style?.width as number) || DEFAULT_SITE_WIDTH;
      const siteHeight = (siteNode.style?.height as number) || DEFAULT_SITE_HEIGHT;
      
      // Check if DC is within site boundaries
      if (
        dcNode.position.x >= siteX &&
        dcNode.position.x <= siteX + siteWidth &&
        dcNode.position.y >= siteY &&
        dcNode.position.y <= siteY + siteHeight
      ) {
        return siteNode.id;
      }
    }
    return null;
  }, []);
  
  // Handle node drag to check if a DC is being dragged into a site
  const onNodeDrag = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.type === 'dc') {
      // Get all site nodes
      const siteNodes = nodes.filter(n => n.type === 'site');
      const siteId = checkDCInSite(node, siteNodes);
      
      // If DC is in a site and wasn't previously assigned to it, update
      if (siteId && node.data.siteId !== siteId) {
        updateDC(node.id, { siteId });
      } 
      // If DC is not in any site but was previously assigned, remove the assignment
      else if (!siteId && node.data.siteId) {
        updateDC(node.id, { siteId: "" });
      }
    }
  }, [nodes, updateDC, checkDCInSite]);

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
          targetPosition.y < node.position.y + (node.height || 40) &&
          node.type === 'dc' // Only connect to DC nodes
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
    <div ref={reactFlowWrapper} className="w-full h-full bg-white">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChangeExtended}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onNodeDragStop={onNodeDragStop}
        onNodeDrag={onNodeDrag}
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
        deleteKeyCode={['Backspace', 'Delete']}
      >
        <Controls />
        <Background
          variant={BackgroundVariant.Dots}
          gap={GRID_SIZE}
          size={1}
          color="#e0e0e0"
        />
      </ReactFlow>
    </div>
  );
};

export default TopologyGraph;

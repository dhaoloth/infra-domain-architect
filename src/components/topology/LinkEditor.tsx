
import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import useTopologyStore from '@/store/useTopologyStore';
import { X, Link as LinkIcon } from 'lucide-react';

interface LinkEditorProps {
  dcId: string;
  onClose: () => void;
}

const LinkEditor = ({ dcId, onClose }: LinkEditorProps) => {
  const { sites, dcs, links, addLink, removeLink, canCreateLink } = useTopologyStore();
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [selectedDcId, setSelectedDcId] = useState<string>("");
  
  const currentDC = dcs.find(dc => dc.id === dcId);
  
  // Get DCs that could potentially be linked
  const availableDCs = useMemo(() => {
    // Filter out the current DC and any DCs that already have a link to this DC
    return dcs.filter(dc => {
      // Skip current DC
      if (dc.id === dcId) return false;
      
      // Skip DCs that don't match the selected site filter
      if (selectedSiteId && dc.siteId !== selectedSiteId && dc.siteId !== "") return false;
      
      // Skip if already connected
      const alreadyConnected = links.some(link => 
        (link.sourceDC === dcId && link.targetDC === dc.id) || 
        (link.sourceDC === dc.id && link.targetDC === dcId)
      );
      
      return !alreadyConnected;
    });
  }, [dcs, dcId, links, selectedSiteId]);
  
  // Get DCs that are already connected to this DC
  const connectedDCs = useMemo(() => {
    return links
      .filter(link => link.sourceDC === dcId || link.targetDC === dcId)
      .map(link => {
        const connectedDcId = link.sourceDC === dcId ? link.targetDC : link.sourceDC;
        const dc = dcs.find(d => d.id === connectedDcId);
        return {
          linkId: link.id,
          dc
        };
      })
      .filter(item => item.dc) as { linkId: string; dc: typeof dcs[0] }[];
  }, [links, dcs, dcId]);
  
  const handleCreateLink = () => {
    if (selectedDcId && canCreateLink(dcId, selectedDcId)) {
      addLink(dcId, selectedDcId);
      setSelectedDcId("");
    }
  };
  
  const handleRemoveLink = (linkId: string) => {
    removeLink(linkId);
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage DC Connections</DialogTitle>
          <DialogDescription>
            Create or remove replication links for {currentDC?.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-5 py-2">
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Current Connections ({connectedDCs.length}/4)</h3>
            {connectedDCs.length === 0 ? (
              <p className="text-xs text-muted-foreground">No connections</p>
            ) : (
              <ul className="space-y-2">
                {connectedDCs.map(({ linkId, dc }) => {
                  const dcSite = sites.find(s => s.id === dc.siteId);
                  const isIntraSite = currentDC?.siteId === dc.siteId && currentDC?.siteId !== "";
                  const isKeyToKey = currentDC?.isKey && dc.isKey && currentDC?.siteId !== dc.siteId;
                  
                  return (
                    <li key={linkId} className="flex items-center justify-between p-2 rounded bg-gray-50 border border-gray-100">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          isKeyToKey ? 'bg-green-400' : isIntraSite ? 'bg-gray-500' : 'bg-blue-400'
                        }`} />
                        <div>
                          <div className="text-sm font-medium">{dc.name}</div>
                          <div className="text-xs text-gray-500">
                            {dcSite?.name || 'Unassigned'} {dc.isKey && '(Key)'}
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0" 
                        onClick={() => handleRemoveLink(linkId)}
                      >
                        <X size={14} className="text-gray-500" />
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          
          <div className="border-t pt-3">
            <h3 className="text-sm font-medium mb-3">Add New Connection</h3>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="filter-site" className="text-xs">Filter by Site</Label>
                <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
                  <SelectTrigger id="filter-site" className="h-8 text-sm">
                    <SelectValue placeholder="All sites" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All sites</SelectItem>
                    <SelectItem value="unassigned">Unassigned DCs</SelectItem>
                    {sites.map(site => (
                      <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="select-dc" className="text-xs">Select Domain Controller</Label>
                <div className="flex items-center space-x-2">
                  <Select 
                    value={selectedDcId} 
                    onValueChange={setSelectedDcId} 
                    disabled={availableDCs.length === 0 || connectedDCs.length >= 4}
                  >
                    <SelectTrigger id="select-dc" className="h-8 text-sm flex-1">
                      <SelectValue placeholder="Select DC" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDCs.map(dc => {
                        const dcSite = sites.find(s => s.id === dc.siteId);
                        return (
                          <SelectItem key={dc.id} value={dc.id}>
                            {dc.name} {dcSite ? `(${dcSite.name})` : '(Unassigned)'} {dc.isKey ? '(Key)' : ''}
                          </SelectItem>
                        );
                      })}
                      {availableDCs.length === 0 && (
                        <SelectItem value="none" disabled>No available DCs</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  
                  <Button
                    size="sm"
                    onClick={handleCreateLink}
                    disabled={!selectedDcId || connectedDCs.length >= 4}
                  >
                    <LinkIcon size={14} className="mr-1" />
                    Link
                  </Button>
                </div>
                
                {connectedDCs.length >= 4 && (
                  <p className="text-xs text-amber-600 mt-2">
                    Maximum connections reached (4/4)
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LinkEditor;

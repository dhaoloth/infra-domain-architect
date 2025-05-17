
import { useState, useEffect } from 'react';
import { DC } from '@/types/topology-types';
import useTopologyStore from '@/store/useTopologyStore';
import { X, Link } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import LinkEditor from './LinkEditor';

interface DCEditModalProps {
  dcId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DCEditModal = ({ dcId, open, onOpenChange }: DCEditModalProps) => {
  const { dcs, sites, updateDC, removeDC, getLinkCountForDC, links } = useTopologyStore();
  const [name, setName] = useState('');
  const [isKey, setIsKey] = useState(false);
  const [siteId, setSiteId] = useState('');
  const [showLinkEditor, setShowLinkEditor] = useState(false);
  
  // Get DC data
  const dc = dcs.find(d => d.id === dcId);
  const linkCount = dcId ? getLinkCountForDC(dcId) : 0;
  
  // Get all connected DCs
  const connectedDCs = dcId 
    ? links
        .filter(link => link.sourceDC === dcId || link.targetDC === dcId)
        .map(link => {
          const connectedId = link.sourceDC === dcId ? link.targetDC : link.sourceDC;
          return dcs.find(dc => dc.id === connectedId);
        })
        .filter(Boolean) as DC[]
    : [];
  
  // Update form when DC changes
  useEffect(() => {
    if (dc) {
      setName(dc.name || '');
      setIsKey(dc.isKey);
      setSiteId(dc.siteId || "");
    }
  }, [dc]);
  
  const handleSave = () => {
    if (!dcId) return;
    
    // Ensure name is not empty
    const dcName = name.trim() ? name : `DC${Math.floor(Math.random() * 100)}`;
    
    updateDC(dcId, { 
      name: dcName, 
      isKey, 
      siteId: siteId === "unassigned" ? "" : siteId
    });
    
    onOpenChange(false);
  };
  
  const handleRemove = () => {
    if (!dcId) return;
    removeDC(dcId);
    onOpenChange(false);
  };
  
  const handleOpenLinkEditor = () => {
    setShowLinkEditor(true);
    onOpenChange(false);
  };
  
  if (!dc) return null;
  
  return (
    <>
      <Dialog open={open && !showLinkEditor} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Domain Controller</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="dc-name">Domain Controller Name</Label>
              <Input
                id="dc-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter DC name"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="dc-site">Assigned Site</Label>
              <Select 
                value={siteId === "" ? "unassigned" : siteId} 
                onValueChange={(value) => setSiteId(value)}
              >
                <SelectTrigger className="w-full" id="dc-site">
                  <SelectValue placeholder="Select site" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {sites.map(site => (
                    <SelectItem key={site.id} value={site.id}>{site.name || 'Unnamed Site'}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="is-key" 
                checked={isKey} 
                onCheckedChange={(checked) => setIsKey(checked === true)} 
              />
              <Label htmlFor="is-key">Key Domain Controller</Label>
            </div>
            
            <div className="grid gap-2">
              <Label>Connections ({linkCount}/4)</Label>
              {connectedDCs.length > 0 ? (
                <div className="border rounded p-2 bg-gray-50 max-h-32 overflow-auto">
                  <ul className="space-y-1">
                    {connectedDCs.map(connectedDc => (
                      <li key={connectedDc?.id} className="text-sm flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        {connectedDc?.name || 'Unnamed DC'}
                        {connectedDc?.isKey && (
                          <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-1 rounded">Key</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No connections</p>
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleOpenLinkEditor}
                className="mt-2"
              >
                <Link size={14} className="mr-2" />
                Manage Connections
              </Button>
            </div>
          </div>
          
          <DialogFooter className="sm:justify-between">
            <Button
              variant="destructive"
              onClick={handleRemove}
              className="mr-auto"
            >
              <X className="mr-2 h-4 w-4" />
              Remove DC
            </Button>
            
            <div>
              <Button variant="outline" onClick={() => onOpenChange(false)} className="mr-2">
                Cancel
              </Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {showLinkEditor && dcId && (
        <LinkEditor 
          dcId={dcId} 
          onClose={() => {
            setShowLinkEditor(false);
            onOpenChange(true);
          }} 
        />
      )}
    </>
  );
};

export default DCEditModal;

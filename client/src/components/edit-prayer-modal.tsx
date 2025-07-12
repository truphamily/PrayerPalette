import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { useDeletePrayerCard, useUpdatePrayerCard, useCategories } from "@/hooks/useGuestData";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import ScriptureSearchModal from "./scripture-search-modal";
import type { PrayerCardWithDetails, Category } from "@shared/schema";

interface EditPrayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: PrayerCardWithDetails;
}

export default function EditPrayerModal({ isOpen, onClose, card }: EditPrayerModalProps) {
  const { toast } = useToast();
  const { isGuest } = useAuth();
  const queryClient = useQueryClient();
  const [isScriptureModalOpen, setIsScriptureModalOpen] = useState(false);
  
  const [name, setName] = useState(card.name);
  const [categoryId, setCategoryId] = useState((card.categoryId || 1).toString());
  const [frequency, setFrequency] = useState(card.frequency);
  const [dayOfWeek, setDayOfWeek] = useState(card.dayOfWeek || "");
  const [dayOfMonth, setDayOfMonth] = useState(card.dayOfMonth?.toString() || "");
  const [daysOfMonth, setDaysOfMonth] = useState<number[]>(card.daysOfMonth || []);
  const [scriptures, setScriptures] = useState<Array<{text: string, reference: string}>>(
    card.scriptures && card.scriptureReferences
      ? card.scriptures.map((text, index) => ({
          text,
          reference: card.scriptureReferences?.[index] || ""
        }))
      : []
  );
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualScripture, setManualScripture] = useState('');
  const [manualReference, setManualReference] = useState('');

  // Use guest-compatible hooks
  const { data: categories = [] } = useCategories();
  const updatePrayerCardMutation = useUpdatePrayerCard();
  const deletePrayerCardMutation = useDeletePrayerCard();

  // Handle form update using guest-compatible hook
  const handleUpdate = () => {
    const updateData = {
      name,
      categoryId: parseInt(categoryId),
      frequency,
      dayOfWeek: frequency === "weekly" ? dayOfWeek : null,
      dayOfMonth: frequency === "monthly" && daysOfMonth.length === 0 ? parseInt(dayOfMonth) || null : null,
      daysOfMonth: frequency === "monthly" && daysOfMonth.length > 0 ? daysOfMonth : null,
      scriptures: scriptures.length > 0 ? scriptures.map(s => s.text) : null,
      scriptureReferences: scriptures.length > 0 ? scriptures.map(s => s.reference) : null,
    };

    updatePrayerCardMutation.mutate({ id: card.id, data: updateData }, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Prayer card updated successfully",
        });
        onClose();
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to update prayer card",
          variant: "destructive",
        });
      }
    });
  };



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !categoryId) return;
    handleUpdate();
  };

  const handleScriptureSelect = (scripture: string, reference: string) => {
    const newScripture = { text: scripture, reference };
    setScriptures(prev => [...prev, newScripture]);
    setIsScriptureModalOpen(false);
  };

  const removeScripture = (index: number) => {
    setScriptures(prev => prev.filter((_, i) => i !== index));
  };

  const handleManualScriptureAdd = () => {
    if (manualScripture.trim() && manualReference.trim()) {
      const newScripture = { text: manualScripture.trim(), reference: manualReference.trim() };
      setScriptures(prev => [...prev, newScripture]);
      
      // Clear the manual input fields
      setManualScripture('');
      setManualReference('');
      setShowManualInput(false);
    }
  };

  const handleDeleteClick = () => {
    if (window.confirm("Are you sure you want to delete this prayer card? This action cannot be undone.")) {
      deletePrayerCardMutation.mutate(card.id, {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Prayer card deleted successfully",
          });
          onClose();
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to delete prayer card",
            variant: "destructive",
          });
        }
      });
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Prayer Card</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter prayer card name"
                required
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        <span>{category.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="frequency">Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {frequency === "weekly" && (
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="dayOfWeek">Day of Week</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                      const randomDay = days[Math.floor(Math.random() * days.length)];
                      setDayOfWeek(randomDay);
                    }}
                    className="text-xs"
                  >
                    <i className="fas fa-random mr-1"></i>
                    Random Day
                  </Button>
                </div>
                <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sunday">Sunday</SelectItem>
                    <SelectItem value="Monday">Monday</SelectItem>
                    <SelectItem value="Tuesday">Tuesday</SelectItem>
                    <SelectItem value="Wednesday">Wednesday</SelectItem>
                    <SelectItem value="Thursday">Thursday</SelectItem>
                    <SelectItem value="Friday">Friday</SelectItem>
                    <SelectItem value="Saturday">Saturday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {frequency === "monthly" && (
              <div>
                <div className="flex items-center justify-between">
                  <Label>Day of Month</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const randomDay = Math.floor(Math.random() * 28) + 1;
                      setDayOfMonth(randomDay);
                    }}
                    className="text-xs"
                  >
                    <i className="fas fa-random mr-1"></i>
                    Random Day
                  </Button>
                </div>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  placeholder="Enter day (1-31)"
                  value={dayOfMonth || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    setDayOfMonth(value ? parseInt(value) : undefined);
                  }}
                />
                <div className="text-xs text-gray-600">
                  Choose a day of the month (1-31) for your monthly prayer
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Scripture (Optional)</Label>
                <div className="flex gap-3 ml-8">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowManualInput(true)}
                    className="border-[#e81c32] text-[#e81c32] hover:bg-[#e81c32] hover:text-white"
                  >
                    <i className="fas fa-edit mr-1"></i>
                    Add Text
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsScriptureModalOpen(true)}
                    className="border-[#e81c32] text-[#e81c32] hover:bg-[#e81c32] hover:text-white"
                  >
                    <i className="fas fa-search mr-1"></i>
                    Search
                  </Button>
                </div>
              </div>
              
              {/* Manual Scripture Input */}
              {showManualInput && (
                <div className="bg-prayer-soft rounded-lg p-4 space-y-3 mb-4">
                  <div className="space-y-2">
                    <Label htmlFor="manualScripture">Scripture Text</Label>
                    <textarea
                      id="manualScripture"
                      placeholder="Enter scripture text..."
                      value={manualScripture}
                      onChange={(e) => setManualScripture(e.target.value)}
                      className="w-full min-h-[80px] p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-[#e81c32] focus:border-[#e81c32]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manualReference">Scripture Reference</Label>
                    <input
                      id="manualReference"
                      type="text"
                      placeholder="e.g., John 3:16"
                      value={manualReference}
                      onChange={(e) => setManualReference(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#e81c32] focus:border-[#e81c32]"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowManualInput(false);
                        setManualScripture('');
                        setManualReference('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleManualScriptureAdd}
                      disabled={!manualScripture.trim() || !manualReference.trim()}
                      className="bg-[#e81c32] hover:bg-[#e81c32]/90"
                    >
                      Add Scripture
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Current Scriptures */}
              {scriptures.length > 0 && (
                <div className="space-y-2 mb-4">
                  <h4 className="text-sm font-medium text-gray-700">Current Scriptures:</h4>
                  {scriptures.map((scripture, index) => (
                    <div key={index} className="flex items-start justify-between p-3 bg-gray-50 rounded">
                      <div className="flex-1">
                        <p className="text-sm italic">"{scripture.text}"</p>
                        <p className="text-xs text-gray-600 mt-1">{scripture.reference}</p>
                      </div>
                      <button
                        onClick={() => removeScripture(index)}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteClick}
                disabled={deletePrayerCardMutation.isPending}
              >
                {deletePrayerCardMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
              
              <div className="space-x-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updatePrayerCardMutation.isPending}>
                  {updatePrayerCardMutation.isPending ? "Updating..." : "Update"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <ScriptureSearchModal
        isOpen={isScriptureModalOpen}
        onClose={() => setIsScriptureModalOpen(false)}
        onSelect={handleScriptureSelect}
      />
    </>
  );
}
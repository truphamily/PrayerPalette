import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useCategories, useCreatePrayerCard, useCreatePrayerRequest } from "@/hooks/useGuestData";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import ScriptureSearchModal from "./scripture-search-modal";
import type { Category } from "@shared/schema";

const prayerCardSchema = z.object({
  name: z.string().min(1, "Prayer name is required"),
  categoryId: z.number().min(1, "Please select a category"),
  frequency: z.enum(["daily", "weekly", "monthly"]),
  dayOfWeek: z.string().optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  scriptures: z.array(z.string()).optional(),
  scriptureReferences: z.array(z.string()).optional(),
  initialRequest: z.string().optional(),
});

type PrayerCardForm = z.infer<typeof prayerCardSchema>;

interface AddPrayerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddPrayerModal({ isOpen, onClose }: AddPrayerModalProps) {
  const { toast } = useToast();
  const [isScriptureModalOpen, setIsScriptureModalOpen] = useState(false);
  const [scriptures, setScriptures] = useState<Array<{text: string, reference: string}>>([]);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualScripture, setManualScripture] = useState('');
  const [manualReference, setManualReference] = useState('');

  const form = useForm<PrayerCardForm>({
    resolver: zodResolver(prayerCardSchema),
    defaultValues: {
      name: "",
      frequency: "daily",
      scriptures: [],
      scriptureReferences: [],
      initialRequest: "",
    },
  });

  const watchedFrequency = form.watch("frequency");

  // Use guest-compatible hooks
  const { data: categories = [] } = useCategories();
  const createPrayerCardMutation = useCreatePrayerCard();
  const createPrayerRequestMutation = useCreatePrayerRequest();

  const onSubmit = async (data: PrayerCardForm) => {
    try {
      console.log("Form data submitted:", data);
      const { initialRequest, ...prayerCardData } = data;
      console.log("Prayer card data to create:", prayerCardData);
      
      // Create prayer card using guest-compatible mutation
      const cardResult = await createPrayerCardMutation.mutateAsync(prayerCardData);
      
      // Add initial request if provided (cardResult should be a PrayerCard object)
      if (initialRequest?.trim() && cardResult && typeof cardResult === 'object' && 'id' in cardResult) {
        await createPrayerRequestMutation.mutateAsync({
          text: initialRequest.trim(),
          prayerCardId: cardResult.id,
        });
      }
      
      toast({
        title: "Success",
        description: "Prayer card created successfully",
      });
      form.reset({
        name: "",
        frequency: "daily",
        scriptures: [],
        scriptureReferences: [],
        initialRequest: "",
      });
      setScriptures([]);
      setShowManualInput(false);
      setManualScripture('');
      setManualReference('');
      onClose();
    } catch (error) {
      console.error("Error creating prayer card:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      const errorMessage = error instanceof Error ? error.message : "Failed to create prayer card";
      toast({
        title: "Error",
        description: errorMessage.includes('terminating connection') ? 
          "Database connection issue. Please try again." : errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleFormSubmit = (data: PrayerCardForm) => {
    console.log("Form validation errors:", form.formState.errors);
    // Add scriptures to the form data and handle monthly days
    const formDataWithScriptures = {
      ...data,
      scriptures: scriptures.length > 0 ? scriptures.map(s => s.text) : undefined,
      scriptureReferences: scriptures.length > 0 ? scriptures.map(s => s.reference) : undefined,
      // For monthly frequency, ensure we have dayOfMonth set
      dayOfMonth: data.frequency === "monthly" ? data.dayOfMonth : undefined,
    };
    console.log("Final form data with scriptures:", formDataWithScriptures);
    onSubmit(formDataWithScriptures);
  };

  const handleScriptureSelect = (scripture: string, reference: string) => {
    const newScripture = { text: scripture, reference };
    setScriptures(prev => [...prev, newScripture]);
    
    // Update form values
    const scriptureTexts = [...scriptures.map(s => s.text), scripture];
    const scriptureRefs = [...scriptures.map(s => s.reference), reference];
    form.setValue("scriptures", scriptureTexts);
    form.setValue("scriptureReferences", scriptureRefs);
    
    setIsScriptureModalOpen(false);
  };

  const removeScripture = (index: number) => {
    const newScriptures = scriptures.filter((_, i) => i !== index);
    setScriptures(newScriptures);
    
    form.setValue("scriptures", newScriptures.map(s => s.text));
    form.setValue("scriptureReferences", newScriptures.map(s => s.reference));
  };

  const handleManualScriptureAdd = () => {
    if (manualScripture.trim() && manualReference.trim()) {
      const newScripture = { text: manualScripture.trim(), reference: manualReference.trim() };
      setScriptures(prev => [...prev, newScripture]);
      
      // Clear the manual input fields
      setManualScripture('');
      setManualReference('');
      setShowManualInput(false);
      
      // Update form values
      const updatedScriptures = [...scriptures, newScripture];
      form.setValue("scriptures", updatedScriptures.map(s => s.text));
      form.setValue("scriptureReferences", updatedScriptures.map(s => s.reference));
    }
  };

  const handleClose = () => {
    form.reset({
      name: "",
      frequency: "daily",
      scriptures: [],
      scriptureReferences: [],
      initialRequest: "",
    });
    setScriptures([]);
    setShowManualInput(false);
    setManualScripture('');
    setManualReference('');
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-gray-900">Create Prayer Card</DialogTitle>
            <DialogDescription className="text-prayer-gray">
              Create a new prayer card with category, frequency, and optional scripture verses
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
              {/* Prayer Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prayer Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter prayer card name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category Selection */}
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString() || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            <div className="flex items-center space-x-2">
                              <i className={category.icon} style={{ color: category.color }}></i>
                              <span>{category.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Frequency Selection */}
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prayer Frequency</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="space-y-3"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="daily" id="daily" />
                          <Label htmlFor="daily">Daily</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="weekly" id="weekly" />
                          <Label htmlFor="weekly">Weekly</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="monthly" id="monthly" />
                          <Label htmlFor="monthly">Monthly</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Day Selection (for weekly) */}
              {watchedFrequency === "weekly" && (
                <FormField
                  control={form.control}
                  name="dayOfWeek"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Day of Week</FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                            const randomDay = days[Math.floor(Math.random() * days.length)];
                            field.onChange(randomDay);
                          }}
                          className="text-xs"
                        >
                          <i className="fas fa-random mr-1"></i>
                          Random Day
                        </Button>
                      </div>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                        </FormControl>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Day of Month Selection (for monthly) */}
              {watchedFrequency === "monthly" && (
                <FormField
                  control={form.control}
                  name="dayOfMonth"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Day of Month</FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const randomDay = Math.floor(Math.random() * 28) + 1;
                            field.onChange(randomDay);
                          }}
                          className="text-xs"
                        >
                          <i className="fas fa-random mr-1"></i>
                          Random Day
                        </Button>
                      </div>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="31"
                          placeholder="Enter day (1-31)"
                          value={field.value || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value ? parseInt(value) : undefined);
                          }}
                        />
                      </FormControl>
                      <div className="text-xs text-gray-600">
                        Choose a day of the month (1-31) for your monthly prayer
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Scripture Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label>Scripture (Optional)</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" className="flex items-center">
                            <Info className="h-4 w-4 text-gray-500 cursor-help hover:text-gray-700" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p className="text-sm">
                            Scripture verses can guide your prayers and be used in praying for the person, location, and/or topic. Pick a scripture(s) that describes what you want to happen in their lives.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
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
                  <div className="bg-prayer-soft rounded-lg p-4 space-y-3">
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
                
                {/* Display Current Scriptures */}
                {scriptures.length > 0 && (
                  <div className="space-y-2">
                    {scriptures.map((scripture, index) => (
                      <div key={index} className="bg-prayer-soft rounded-lg p-3 flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm text-prayer-gray italic mb-1">
                            "{scripture.text}"
                          </p>
                          <p className="text-xs text-prayer-gray font-medium">
                            {scripture.reference}
                          </p>
                        </div>
                        <button
                          type="button"
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

              {/* Initial Prayer Request */}
              <FormField
                control={form.control}
                name="initialRequest"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prayer Request (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add your first prayer request..." 
                        rows={3}
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createPrayerCardMutation.isPending}
                  className="flex-1 bg-[#e81c32] hover:bg-[#e81c32]/90"
                >
                  {createPrayerCardMutation.isPending ? "Creating..." : "Create Prayer Card"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      {/* Scripture Search Modal */}
      <ScriptureSearchModal
        isOpen={isScriptureModalOpen}
        onClose={() => setIsScriptureModalOpen(false)}
        onSelect={handleScriptureSelect}
      />
    </>
  );
}

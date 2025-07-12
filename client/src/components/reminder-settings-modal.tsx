import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { notificationService } from "@/lib/notificationService";
import type { UserReminderSettings, InsertUserReminderSettings } from "@shared/schema";

interface ReminderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReminderSettingsModal({ isOpen, onClose }: ReminderSettingsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [enableReminders, setEnableReminders] = useState(false);
  const [enableBrowserNotifications, setEnableBrowserNotifications] = useState(false);

  const [reminderTimes, setReminderTimes] = useState<string[]>([]);
  const [timezone, setTimezone] = useState("");

  const { data: settings, isLoading } = useQuery<UserReminderSettings>({
    queryKey: ["/api/reminder-settings"],
    enabled: isOpen,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertUserReminderSettings) => {
      const response = await fetch("/api/reminder-settings", {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: (updatedSettings) => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminder-settings"] });
      // Update notification service with new settings
      notificationService.updateSettings(updatedSettings);
      toast({
        title: "Settings updated",
        description: "Your reminder settings have been saved successfully.",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update reminder settings",
        variant: "destructive",
      });
    },
  });

  // Initialize form with existing settings
  useEffect(() => {
    if (settings) {
      setEnableReminders(Boolean(settings.enableReminders));
      setReminderTimes(settings.reminderTimes || []);
      setTimezone(settings.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
      
      // Check if browser notifications are actually available and permitted
      if (settings.enableBrowserNotifications && "Notification" in window) {
        setEnableBrowserNotifications(Notification.permission === "granted");
      } else {
        setEnableBrowserNotifications(false);
      }
    } else if (isOpen) {
      // Set defaults for new users
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    }
  }, [settings, isOpen]);

  // Request notification permission when enabling browser notifications
  const handleBrowserNotificationToggle = async (enabled: boolean) => {
    if (!enabled) {
      setEnableBrowserNotifications(false);
      return;
    }

    if ("Notification" in window) {
      // Check current permission status
      if (Notification.permission === "granted") {
        setEnableBrowserNotifications(true);
        toast({
          title: "Notifications enabled",
          description: "You'll now receive browser notifications for prayer reminders.",
        });
        return;
      }

      // Request permission if not yet decided
      if (Notification.permission === "default") {
        try {
          const permission = await Notification.requestPermission();
          if (permission === "granted") {
            setEnableBrowserNotifications(true);
            toast({
              title: "Notifications enabled",
              description: "You'll now receive browser notifications for prayer reminders.",
            });
          } else {
            setEnableBrowserNotifications(false);
            toast({
              title: "Permission denied",
              description: "Please allow notifications in your browser settings to use this feature.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Error requesting notification permission:", error);
          setEnableBrowserNotifications(false);
          toast({
            title: "Error",
            description: "Could not request notification permission.",
            variant: "destructive",
          });
        }
      } else {
        // Permission was previously denied
        setEnableBrowserNotifications(false);
        toast({
          title: "Permission previously denied",
          description: "Please enable notifications in your browser settings and try again.",
          variant: "destructive",
        });
      }
    } else {
      setEnableBrowserNotifications(false);
      toast({
        title: "Not supported",
        description: "Browser notifications are not supported in this browser.",
        variant: "destructive",
      });
    }
  };

  const removeReminderTime = (timeToRemove: string) => {
    setReminderTimes(reminderTimes.filter(time => time !== timeToRemove));
  };

  const handleSave = () => {
    const data: InsertUserReminderSettings = {
      userId: "", // This will be set by the server
      enableReminders,
      reminderTimes,
      timezone,
      enableBrowserNotifications,
    };
    updateMutation.mutate(data);
  };

  // Generate time options
  const timeOptions = Array.from({ length: 24 }, (_, hour) => {
    const timeString = `${hour.toString().padStart(2, '0')}:00`;
    const displayTime = new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    return { value: timeString, label: displayTime };
  });

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-full max-w-md">
          <div className="flex items-center justify-center py-8">
            <i className="fas fa-spinner fa-spin text-[#e81c32] text-2xl"></i>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-prayer-dark flex items-center gap-2">
            <i className="fas fa-bell text-[#e81c32]"></i>
            Prayer Reminders
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Enable Reminders Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Enable Reminders</Label>
              <p className="text-sm text-prayer-gray">Get reminded to spend time in prayer</p>
            </div>
            <Switch
              checked={enableReminders}
              onCheckedChange={setEnableReminders}
            />
          </div>

          {enableReminders && (
            <>
              {/* Browser Notifications Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label className="text-base font-medium">Browser Notifications</Label>
                  <div className="space-y-1">
                    <p className="text-sm text-prayer-gray">Show notification popups</p>
                    {"Notification" in window ? (
                      <p className="text-xs text-prayer-gray">
                        Permission: {Notification.permission === "granted" ? "✓ Granted" : 
                                   Notification.permission === "denied" ? "✗ Denied" : "⚠ Not requested"}
                      </p>
                    ) : (
                      <p className="text-xs text-red-500">Not supported in this browser</p>
                    )}
                  </div>
                </div>
                <Switch
                  checked={enableBrowserNotifications}
                  onCheckedChange={handleBrowserNotificationToggle}
                  disabled={!("Notification" in window)}
                />
              </div>

              {/* Reminder Times */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Reminder Times</Label>
                
                {/* Add Time */}
                <div className="space-y-2">
                  <Label className="text-sm">Click a time to add it:</Label>
                  <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                    {timeOptions.map(({ value, label }) => (
                      <Button
                        key={value}
                        type="button"
                        variant={reminderTimes.includes(value) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          if (reminderTimes.includes(value)) {
                            removeReminderTime(value);
                          } else {
                            setReminderTimes([...reminderTimes, value].sort());
                          }
                        }}
                        className={
                          reminderTimes.includes(value)
                            ? "bg-[#e81c32] hover:bg-[#e81c32]/90 text-white"
                            : "text-xs"
                        }
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>

                {reminderTimes.length > 0 && (
                  <p className="text-sm text-prayer-gray">
                    Selected: {reminderTimes.length} reminder{reminderTimes.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              {/* Timezone */}
              <div className="space-y-2">
                <Label className="text-base font-medium">Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {/* Auto-detected timezone at the top if it's not in the list */}
                    {timezone && !['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Anchorage', 'Pacific/Honolulu', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Rome', 'Europe/Madrid', 'Europe/Amsterdam', 'Europe/Stockholm', 'Europe/Moscow', 'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Seoul', 'Asia/Hong_Kong', 'Asia/Singapore', 'Asia/Kolkata', 'Asia/Dubai', 'Australia/Sydney', 'Australia/Melbourne', 'Australia/Perth', 'Pacific/Auckland', 'America/Toronto', 'America/Vancouver', 'America/Mexico_City', 'America/Sao_Paulo', 'America/Buenos_Aires', 'Africa/Cairo', 'Africa/Johannesburg', 'Africa/Lagos'].includes(timezone) && (
                      <>
                        <SelectItem value={timezone}>{timezone} (Auto-detected)</SelectItem>
                        <div className="border-t my-1"></div>
                      </>
                    )}
                    <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                    <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                    <SelectItem value="America/Anchorage">Alaska Time (AKT)</SelectItem>
                    <SelectItem value="Pacific/Honolulu">Hawaii Time (HST)</SelectItem>
                    <SelectItem value="Europe/London">London (GMT/BST)</SelectItem>
                    <SelectItem value="Europe/Paris">Paris (CET/CEST)</SelectItem>
                    <SelectItem value="Europe/Berlin">Berlin (CET/CEST)</SelectItem>
                    <SelectItem value="Europe/Rome">Rome (CET/CEST)</SelectItem>
                    <SelectItem value="Europe/Madrid">Madrid (CET/CEST)</SelectItem>
                    <SelectItem value="Europe/Amsterdam">Amsterdam (CET/CEST)</SelectItem>
                    <SelectItem value="Europe/Stockholm">Stockholm (CET/CEST)</SelectItem>
                    <SelectItem value="Europe/Moscow">Moscow (MSK)</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                    <SelectItem value="Asia/Shanghai">Shanghai (CST)</SelectItem>
                    <SelectItem value="Asia/Seoul">Seoul (KST)</SelectItem>
                    <SelectItem value="Asia/Hong_Kong">Hong Kong (HKT)</SelectItem>
                    <SelectItem value="Asia/Singapore">Singapore (SGT)</SelectItem>
                    <SelectItem value="Asia/Kolkata">Mumbai (IST)</SelectItem>
                    <SelectItem value="Asia/Dubai">Dubai (GST)</SelectItem>
                    <SelectItem value="Australia/Sydney">Sydney (AEDT/AEST)</SelectItem>
                    <SelectItem value="Australia/Melbourne">Melbourne (AEDT/AEST)</SelectItem>
                    <SelectItem value="Australia/Perth">Perth (AWST)</SelectItem>
                    <SelectItem value="Pacific/Auckland">Auckland (NZDT/NZST)</SelectItem>
                    <SelectItem value="America/Toronto">Toronto (ET)</SelectItem>
                    <SelectItem value="America/Vancouver">Vancouver (PT)</SelectItem>
                    <SelectItem value="America/Mexico_City">Mexico City (CST/CDT)</SelectItem>
                    <SelectItem value="America/Sao_Paulo">São Paulo (BRT)</SelectItem>
                    <SelectItem value="America/Buenos_Aires">Buenos Aires (ART)</SelectItem>
                    <SelectItem value="Africa/Cairo">Cairo (EET)</SelectItem>
                    <SelectItem value="Africa/Johannesburg">Johannesburg (SAST)</SelectItem>
                    <SelectItem value="Africa/Lagos">Lagos (WAT)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-prayer-gray">
                  {timezone === Intl.DateTimeFormat().resolvedOptions().timeZone 
                    ? "Using your local timezone" 
                    : "Your reminders will be scheduled according to this timezone"}
                </p>
              </div>

              {/* Test Notification */}
              {enableBrowserNotifications && (
                <div className="pt-4 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => notificationService.testNotification()}
                    className="w-full"
                  >
                    <i className="fas fa-test-tube mr-2"></i>
                    Test Notification
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="bg-[#e81c32] hover:bg-[#e81c32]/90"
            >
              {updateMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
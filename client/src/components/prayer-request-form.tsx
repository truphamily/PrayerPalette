import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const prayerRequestSchema = z.object({
  text: z.string().min(1, "Prayer request is required"),
});

type PrayerRequestForm = z.infer<typeof prayerRequestSchema>;

interface PrayerRequestFormProps {
  prayerCardId: number;
  onSuccess?: () => void;
}

export default function PrayerRequestForm({ prayerCardId, onSuccess }: PrayerRequestFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<PrayerRequestForm>({
    resolver: zodResolver(prayerRequestSchema),
    defaultValues: {
      text: "",
    },
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data: PrayerRequestForm) => {
      await apiRequest("POST", `/api/prayer-cards/${prayerCardId}/requests`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prayer-cards"] });
      toast({
        title: "Success",
        description: "Prayer request added successfully",
      });
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add prayer request",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PrayerRequestForm) => {
    createRequestMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prayer Request</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter your prayer request..." 
                  rows={4}
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex space-x-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => form.reset()}
            className="flex-1"
          >
            Clear
          </Button>
          <Button 
            type="submit" 
            disabled={createRequestMutation.isPending}
            className="flex-1 bg-[#e81c32] hover:bg-[#e81c32]/90"
          >
            {createRequestMutation.isPending ? "Adding..." : "Add Request"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

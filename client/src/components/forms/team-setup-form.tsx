import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const teamSetupSchema = z.object({
  name: z.string().min(1, 'Team name is required').max(255, 'Team name is too long'),
});

type TeamSetupFormData = z.infer<typeof teamSetupSchema>;

interface TeamSetupFormProps {
  initialData: { name: string };
  onSubmit: (data: TeamSetupFormData) => void;
  isLoading: boolean;
}

export default function TeamSetupForm({ initialData, onSubmit, isLoading }: TeamSetupFormProps) {
  const form = useForm<TeamSetupFormData>({
    resolver: zodResolver(teamSetupSchema),
    defaultValues: initialData,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Team Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Engineering Team" 
                  {...field}
                  className="text-lg"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Add your team members by email</li>
            <li>• Configure when check-ins are sent</li>
            <li>• Choose or customize feedback questions</li>
            <li>• Start collecting anonymous feedback</li>
          </ul>
        </div>

        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={isLoading}
            size="lg"
          >
            {isLoading ? "Creating..." : "Create Team"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

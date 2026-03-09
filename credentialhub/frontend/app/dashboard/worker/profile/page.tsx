"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getWorkerProfile,
  updateWorkerProfile,
  type WorkerProfilePayload,
} from "@/lib/worker-api-client";
import { workerQueryKeys } from "@/lib/worker-query-keys";

export default function WorkerProfilePage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: workerQueryKeys.profile,
    queryFn: getWorkerProfile,
  });

  const [form, setForm] = useState<WorkerProfilePayload>({
    full_name: "",
    bio: "",
    years_experience: 0,
  });

  useEffect(() => {
    if (data) {
      setForm({
        full_name: data.full_name,
        bio: data.bio,
        years_experience: data.years_experience,
      });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: updateWorkerProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workerQueryKeys.profile });
      toast.success("Profile saved successfully.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Worker Profile</CardTitle>
        <CardDescription>
          Keep your professional summary current for employers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form
          onSubmit={(event) => {
            event.preventDefault();
            saveMutation.mutate(form);
          }}
        >
          <FormItem>
            <Label htmlFor="full_name">Full name</Label>
            <Input
              id="full_name"
              value={form.full_name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, full_name: event.target.value }))
              }
              placeholder="Jordan Rivera"
              required
            />
          </FormItem>

          <FormItem>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={form.bio}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, bio: event.target.value }))
              }
              placeholder="Experienced tradesperson focused on safety and quality."
              rows={5}
            />
          </FormItem>

          <FormItem>
            <Label htmlFor="years_experience">Years experience</Label>
            <Input
              id="years_experience"
              type="number"
              min={0}
              value={form.years_experience}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  years_experience: Math.max(0, Number(event.target.value) || 0),
                }))
              }
              required
            />
          </FormItem>

          <Button type="submit" disabled={saveMutation.isPending || isLoading}>
            {saveMutation.isPending ? "Saving..." : "Save profile"}
          </Button>
        </Form>
      </CardContent>
    </Card>
  );
}

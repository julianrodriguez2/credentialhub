"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
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
import {
  addReference,
  deleteReference,
  getReferences,
  type ReferencePayload,
} from "@/lib/worker-api-client";
import { workerQueryKeys } from "@/lib/worker-query-keys";

const emptyReferenceForm: ReferencePayload = {
  reference_name: "",
  company: "",
  position: "",
  email: "",
  phone: "",
  relationship: "",
};

export default function WorkerReferencesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ReferencePayload>(emptyReferenceForm);

  const { data = [] } = useQuery({
    queryKey: workerQueryKeys.references,
    queryFn: getReferences,
  });

  const addMutation = useMutation({
    mutationFn: addReference,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workerQueryKeys.references });
      setForm(emptyReferenceForm);
      toast.success("Reference added.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteReference,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workerQueryKeys.references });
      toast.success("Reference removed.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Professional References</CardTitle>
          <CardDescription>
            Add references who can validate your work history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form
            onSubmit={(event) => {
              event.preventDefault();
              addMutation.mutate(form);
            }}
            className="grid gap-4 md:grid-cols-2"
          >
            <FormItem>
              <Label htmlFor="reference_name">Name</Label>
              <Input
                id="reference_name"
                value={form.reference_name}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    reference_name: event.target.value,
                  }))
                }
                required
              />
            </FormItem>
            <FormItem>
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={form.company}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, company: event.target.value }))
                }
                required
              />
            </FormItem>
            <FormItem>
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                value={form.position}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, position: event.target.value }))
                }
                required
              />
            </FormItem>
            <FormItem>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, email: event.target.value }))
                }
                required
              />
            </FormItem>
            <FormItem>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, phone: event.target.value }))
                }
                required
              />
            </FormItem>
            <FormItem>
              <Label htmlFor="relationship">Relationship</Label>
              <Input
                id="relationship"
                value={form.relationship}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    relationship: event.target.value,
                  }))
                }
                required
              />
            </FormItem>
            <div className="md:col-span-2">
              <Button type="submit" disabled={addMutation.isPending}>
                {addMutation.isPending ? "Saving..." : "Add reference"}
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saved References</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No references added yet.
            </p>
          ) : null}

          {data.map((reference) => (
            <div
              key={reference.id}
              className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{reference.reference_name}</p>
                  <Badge variant={reference.verified ? "default" : "outline"}>
                    {reference.verified ? "Verified" : "Unverified"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {reference.position} at {reference.company}
                </p>
                <p className="text-sm text-muted-foreground">
                  {reference.email} | {reference.phone}
                </p>
                <p className="text-sm text-muted-foreground">
                  Relationship: {reference.relationship}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => deleteMutation.mutate(reference.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

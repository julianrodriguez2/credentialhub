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
  addCompetency,
  deleteCompetency,
  getCompetencies,
  type CompetencyPayload,
} from "@/lib/worker-api-client";
import { workerQueryKeys } from "@/lib/worker-query-keys";

const emptyCompetencyForm: CompetencyPayload = {
  competency_name: "",
  years_experience: 0,
  certification_related: null,
};

export default function WorkerCompetenciesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CompetencyPayload>(emptyCompetencyForm);

  const { data = [] } = useQuery({
    queryKey: workerQueryKeys.competencies,
    queryFn: getCompetencies,
  });

  const addMutation = useMutation({
    mutationFn: addCompetency,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workerQueryKeys.competencies });
      setForm(emptyCompetencyForm);
      toast.success("Competency added.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCompetency,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workerQueryKeys.competencies });
      toast.success("Competency removed.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Competencies</CardTitle>
          <CardDescription>
            Add your skill and equipment expertise.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form
            onSubmit={(event) => {
              event.preventDefault();
              addMutation.mutate(form);
            }}
            className="grid gap-4 md:grid-cols-3"
          >
            <FormItem className="md:col-span-1">
              <Label htmlFor="competency_name">Competency name</Label>
              <Input
                id="competency_name"
                value={form.competency_name}
                placeholder="Heavy Machinery"
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    competency_name: event.target.value,
                  }))
                }
                required
              />
            </FormItem>
            <FormItem>
              <Label htmlFor="competency_years">Years experience</Label>
              <Input
                id="competency_years"
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
            <FormItem>
              <Label htmlFor="certification_related">Related certification</Label>
              <Input
                id="certification_related"
                value={form.certification_related ?? ""}
                placeholder="OSHA 30"
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    certification_related: event.target.value || null,
                  }))
                }
              />
            </FormItem>
            <div className="md:col-span-3">
              <Button type="submit" disabled={addMutation.isPending}>
                {addMutation.isPending ? "Saving..." : "Add competency"}
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {data.map((competency) => (
          <Card key={competency.id}>
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">
                    {competency.competency_name}
                  </CardTitle>
                  <CardDescription>
                    {competency.years_experience} years experience
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => deleteMutation.mutate(competency.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {competency.certification_related ? (
                <Badge variant="secondary">
                  {competency.certification_related}
                </Badge>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No related certification added.
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

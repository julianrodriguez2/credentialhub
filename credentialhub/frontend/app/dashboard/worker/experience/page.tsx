"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Plus, Trash2 } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  addExperience,
  deleteExperience,
  getExperiences,
  updateExperience,
  type WorkExperience,
  type WorkExperiencePayload,
} from "@/lib/worker-api-client";
import { workerQueryKeys } from "@/lib/worker-query-keys";

const emptyForm: WorkExperiencePayload = {
  company_name: "",
  role_title: "",
  description: "",
  start_date: "",
  end_date: null,
  equipment_used: "",
};

function formatDate(value: string | null): string {
  if (!value) {
    return "Present";
  }
  return new Date(`${value}T00:00:00`).toLocaleDateString();
}

export default function WorkerExperiencePage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<WorkExperiencePayload>(emptyForm);

  const { data = [], isLoading } = useQuery({
    queryKey: workerQueryKeys.experiences,
    queryFn: getExperiences,
  });

  const isEditing = useMemo(() => editingId !== null, [editingId]);

  const createMutation = useMutation({
    mutationFn: addExperience,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workerQueryKeys.experiences });
      setIsModalOpen(false);
      toast.success("Experience added.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: updateExperience,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workerQueryKeys.experiences });
      setIsModalOpen(false);
      toast.success("Experience updated.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteExperience,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workerQueryKeys.experiences });
      toast.success("Experience removed.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (experience: WorkExperience) => {
    setEditingId(experience.id);
    setForm({
      company_name: experience.company_name,
      role_title: experience.role_title,
      description: experience.description,
      start_date: experience.start_date,
      end_date: experience.end_date,
      equipment_used: experience.equipment_used,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.start_date) {
      toast.error("Start date is required.");
      return;
    }

    if (isEditing && editingId) {
      updateMutation.mutate({ ...form, id: editingId });
      return;
    }

    createMutation.mutate(form);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle>Work Experience</CardTitle>
          <CardDescription>
            Add your most relevant roles and equipment history.
          </CardDescription>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="mr-2 h-4 w-4" />
          Add experience
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isLoading && data.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No experience added yet.
          </p>
        ) : null}

        {data.map((experience) => (
          <Card key={experience.id} className="border-dashed">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">
                    {experience.role_title}
                  </CardTitle>
                  <CardDescription>{experience.company_name}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditModal(experience)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteMutation.mutate(experience.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                {formatDate(experience.start_date)} -{" "}
                {formatDate(experience.end_date)}
              </p>
              <p>{experience.description}</p>
              <p className="text-muted-foreground">
                Equipment used: {experience.equipment_used || "N/A"}
              </p>
            </CardContent>
          </Card>
        ))}
      </CardContent>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit experience" : "Add experience"}
            </DialogTitle>
            <DialogDescription>
              Keep your employment history accurate for employers.
            </DialogDescription>
          </DialogHeader>

          <Form onSubmit={handleSubmit}>
            <FormItem>
              <Label htmlFor="company_name">Company</Label>
              <Input
                id="company_name"
                value={form.company_name}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    company_name: event.target.value,
                  }))
                }
                required
              />
            </FormItem>
            <FormItem>
              <Label htmlFor="role_title">Role</Label>
              <Input
                id="role_title"
                value={form.role_title}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    role_title: event.target.value,
                  }))
                }
                required
              />
            </FormItem>
            <FormItem>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={4}
                value={form.description}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
              />
            </FormItem>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormItem>
                <Label htmlFor="start_date">Start date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={form.start_date}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      start_date: event.target.value,
                    }))
                  }
                  required
                />
              </FormItem>
              <FormItem>
                <Label htmlFor="end_date">End date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={form.end_date ?? ""}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      end_date: event.target.value || null,
                    }))
                  }
                />
              </FormItem>
            </div>
            <FormItem>
              <Label htmlFor="equipment_used">Equipment used</Label>
              <Textarea
                id="equipment_used"
                rows={3}
                value={form.equipment_used}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    equipment_used: event.target.value,
                  }))
                }
              />
            </FormItem>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {isEditing ? "Save changes" : "Add experience"}
              </Button>
            </DialogFooter>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

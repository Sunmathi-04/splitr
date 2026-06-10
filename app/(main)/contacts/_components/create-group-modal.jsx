"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { api } from "@/convex/_generated/api";
import { useConvexMutation, useConvexQuery } from "@/hooks/use-convex-query";

import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { X, UserPlus } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/* ---------------- Schema ---------------- */

const groupSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  description: z.string().optional(),
});

/* ---------------- Component ---------------- */

export function CreateGroupModal({
  isOpen,
  onClose,
  onSuccess,
}) {
  /* ---------------- State ---------------- */

  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [commandOpen, setCommandOpen] = useState(false);

  /* ---------------- Clerk ---------------- */

  const { user, isLoaded } = useUser();

  /* ---------------- Convex ---------------- */

  const { data: currentUserDoc } = useConvexQuery(
  api.users.getCurrentUser,
  {}
);



  const createGroup = useConvexMutation(
    api.contacts.createGroup
  );

  /* ---------------- SEARCH FIX ---------------- */

 



  const trimmedQuery = searchQuery.trim();



  const {
    data: searchResults,
    isLoading: isSearching,
  } = useConvexQuery(
    api.users.searchUsers,
    trimmedQuery.length >= 2
      ? {
          query: trimmedQuery.toLowerCase(),
        }
      : "skip"
  );
console.log(
  "SEARCH RESULTS:",
  JSON.stringify(searchResults, null, 2)
);

 {searchResults?.map((user) => (
  <CommandItem
    key={String(user._id)}
    value={`${user.name}-${user.email}`}
    onSelect={() => addMember(user)}
  >
    <div>
      <p className="text-sm">{user.name}</p>
      <p className="text-xs text-muted-foreground">
        {user.email}
      </p>
    </div>
  </CommandItem>
))}

  /* ---------------- Form ---------------- */

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  if (!isLoaded || !currentUserDoc) return null;



  /* ---------------- Helpers ---------------- */

  const removeMember = (userId) => {
    setSelectedMembers((prev) =>
      prev.filter((m) => m._id !== userId)
    );
  };

  const addMember = (user) => {
    // prevent duplicates
    if (
      selectedMembers.some((m) => m._id === user._id)
    )
      return;

    setSelectedMembers((prev) => [...prev, user]);

    setCommandOpen(false);
    setSearchQuery("");
  };

  /* ---------------- Submit ---------------- */

  const onSubmit = async (data) => {
    try {
      const memberIds = selectedMembers.map(
        (m) => m._id
      );

      const groupId = await createGroup.mutate({
        name: data.name,
        description: data.description,
        createdBy: currentUserDoc._id,
        members: memberIds,
      });

      toast.success("Group created successfully!");

      reset();
      setSelectedMembers([]);

      onClose();

      onSuccess?.(groupId);
    } catch (error) {
      toast.error("Failed to create group");
    }
  };

  /* ---------------- Close ---------------- */

  const handleClose = () => {
    reset();

    setSelectedMembers([]);
    setSearchQuery("");

    onClose();
  };

  /* ---------------- UI ---------------- */

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Create New Group
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          {/* Group name */}

          <div className="space-y-2">
            <Label>Group Name</Label>

            <Input {...register("name")} />

            {errors.name && (
              <p className="text-sm text-red-500">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Description */}

          <div className="space-y-2">
            <Label>Description (Optional)</Label>

            <Textarea
              {...register("description")}
            />
          </div>

          {/* Members */}

          <div className="space-y-2">
            <Label>Members</Label>

            <div className="flex flex-wrap gap-2">
              {/* Current user */}

<Badge variant="secondary">
  <Avatar className="h-5 w-5 mr-2">
    <AvatarFallback>
      {currentUserDoc.name?.charAt(0) || "?"}
    </AvatarFallback>
  </Avatar>

  You
</Badge>

              {/* Selected members */}

              {selectedMembers.map((member) => (
                <Badge
                  key={member._id}
                  variant="secondary"
                >
                  <Avatar className="h-5 w-5 mr-2">
                    <AvatarFallback>
                      {member.name?.charAt(0) ||
                        "?"}
                    </AvatarFallback>
                  </Avatar>

                  {member.name}

                  <button
                    type="button"
                    onClick={() =>
                      removeMember(member._id)
                    }
                    className="ml-2"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}

              {/* Add member */}

              <Popover
                open={commandOpen}
                onOpenChange={setCommandOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Add member
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="p-0 w-72">
                 <Command shouldFilter={false}>
                 <CommandInput
  placeholder="Search by name or email..."
  value={searchQuery}
  onValueChange={(value) => {
    console.log("TYPING:", value);
    setSearchQuery(value);
  }}
/>

                    <CommandList>
                      <CommandEmpty>
                        {trimmedQuery.length < 2
                          ? "Type at least 2 characters"
                          : isSearching
                          ? "Searching..."
                          : "No users found"}
                      </CommandEmpty>

<CommandGroup heading="Users">
  {searchResults
    ?.filter(
      (u) =>
        !selectedMembers.some(
          (m) => m._id === u._id
        )
    )
    .map((user) => (
      <CommandItem
        key={String(user._id)}
        value={`${user.name} ${user.email}`}
        onSelect={() => addMember(user)}
      >
        <div>
          <p className="text-sm">
            {user.name}
          </p>

          <p className="text-xs text-muted-foreground">
            {user.email}
          </p>
        </div>
      </CommandItem>
    ))}
</CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {selectedMembers.length === 0 && (
              <p className="text-sm text-amber-600">
                Add at least one other person
              </p>
            )}
          </div>

          {/* Footer */}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={
                isSubmitting ||
                selectedMembers.length === 0
              }
            >
              {isSubmitting
                ? "Creating..."
                : "Create Group"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
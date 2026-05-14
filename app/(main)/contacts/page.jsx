"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { BarLoader } from "react-spinners";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Plus } from "lucide-react";
import { CreateGroupModal } from "./_components/create-group-modal";

export default function ContactsPage() {
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const router = useRouter();
  const searchParams =
  typeof window !== "undefined" ? useSearchParams() : null;

  const { data: currentUser } = useConvexQuery(api.users.getCurrentUser);

  const { data, isLoading } = useConvexQuery(
    api.contacts.getAllContacts,
    currentUser ? { currentUserId: currentUser._id } : "skip"
  );

  useEffect(() => {
if (searchParams?.get("createGroup") === "true"){
      setIsCreateGroupModalOpen(true);
      router.replace("/contacts");
    }
  }, [searchParams, router]);

  if (isLoading || !currentUser) {
    return (
      <div className="container mx-auto py-12">
        <BarLoader width="100%" color="#36d7b7" />
      </div>
    );
  }

  const { users = [], groups = [] } = data || {};

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-5xl gradient-title">Contacts</h1>
        <Button onClick={() => setIsCreateGroupModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Group
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PEOPLE */}
        <div>
          <h2 className="text-xl font-bold mb-4">People</h2>

          {users.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-center text-muted-foreground">
                No contacts yet
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {users.map((user) => (
          <Link key={user._id} href={`/person/${user._id}`}>

                  <Card className="hover:bg-muted/30 cursor-pointer">
                    <CardContent className="py-4 flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.imageUrl} />
                        <AvatarFallback>
                          {user.name?.charAt(0) ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* GROUPS */}
        <div>
          <h2 className="text-xl font-bold mb-4">Groups</h2>

          {groups.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-center text-muted-foreground">
                No groups yet
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {groups.map((group) => (
                <Link key={group.id} href={`/groups/${group.id}`}>
                  <Card className="hover:bg-muted/30 cursor-pointer">
                    <CardContent className="py-4 flex items-center gap-3">
                      <Users className="h-5 w-5 text-primary" />
                      <p className="font-medium">{group.name}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        onSuccess={(groupId) => router.push(`/groups/${groupId}`)}
      />
    </div>
  );
}

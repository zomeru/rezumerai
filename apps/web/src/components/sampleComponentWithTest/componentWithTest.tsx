"use client";

import type { UserType } from "@rezumerai/types";
import { Button } from "@rezumerai/ui";
import { capitalize } from "@rezumerai/utils/string";
import { useState } from "react";
import { api } from "@/lib/api";
import { ClientDate } from "../client-date";
import { UserFetcher } from "../user-fetcher";

export default function SampleComponentWithTest() {
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");

  // Use ts-rest queries
  const { data: healthData, isLoading: healthLoading } = api.getHealth.useQuery(["health"]);
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = api.getUsers.useQuery(["users"]);
  const { data: projectsData, isLoading: projectsLoading } = api.getProjects.useQuery(["projects"]);

  // Use ts-rest mutations
  const createUserMutation = api.createUser.useMutation({
    onSuccess: () => {
      refetchUsers();
      setNewUserName("");
      setNewUserEmail("");
    },
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUserName && newUserEmail) {
      createUserMutation.mutate({
        body: {
          name: newUserName,
          email: newUserEmail,
        },
      });
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-8">
      <h1 className="mb-6 font-bold text-3xl">{capitalize("welcome to rezumerai")}</h1>
      <p className="mb-6 text-gray-600">
        <ClientDate prefix="Today is: " options={{ dateStyle: "full" }} />
      </p>

      {/* Health Check */}
      <div className="mb-8 rounded-lg bg-gray-50 p-4">
        <h2 className="mb-2 font-semibold text-xl">Server Health</h2>
        {healthLoading ? (
          <p>Loading...</p>
        ) : (
          <div>
            <p>Status: {healthData?.body.success ? "✅ Healthy" : "❌ Unhealthy"}</p>
            {healthData?.body.data && (
              <div className="mt-2">
                <p>Message: {healthData.body.data.message}</p>
                <p>Server: {healthData.body.data.server}</p>
                <p>Timestamp: {healthData.body.data.timestamp}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Users Section */}
      <div className="mb-8 rounded-lg bg-blue-50 p-4">
        <h2 className="mb-4 font-semibold text-xl">Users</h2>
        {usersLoading ? (
          <p>Loading users...</p>
        ) : (
          <div>
            <div className="mb-4 grid gap-2">
              {usersData?.body.data?.map((user: UserType) => (
                <div key={user.id} className="rounded border bg-white p-2">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-gray-600 text-sm">{user.email}</p>
                </div>
              ))}
            </div>

            {/* Create User Form */}
            <form onSubmit={handleCreateUser} className="space-y-2">
              <h3 className="font-medium">Add New User</h3>
              <input
                type="text"
                placeholder="Name"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                className="w-full rounded border p-2"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="w-full rounded border p-2"
                required
              />
              <Button appName="RezumerAI" type="submit" disabled={createUserMutation.isPending}>
                {createUserMutation.isPending ? "Creating..." : "Create User"}
              </Button>
            </form>
          </div>
        )}
      </div>

      {/* Individual User Fetch Section */}
      <UserFetcher className="mb-8" />

      {/* Projects Section */}
      <div className="mb-8 rounded-lg bg-green-50 p-4">
        <h2 className="mb-4 font-semibold text-xl">Projects</h2>
        {projectsLoading ? (
          <p>Loading projects...</p>
        ) : (
          <div className="grid gap-2">
            {projectsData?.body.data?.map((project) => (
              <div key={project.id} className="rounded border bg-white p-3">
                <h3 className="font-medium">{project.title}</h3>
                <p className="text-gray-600 text-sm">{project.description}</p>
                <p className="text-gray-500 text-xs">User ID: {project.userId}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8">
        <Button appName="RezumerAI">Get Started</Button>
      </div>
    </div>
  );
}

// biome-ignore-all lint: This is a sample component for testing purposes, not production code
// Sample component demonstrating Eden API client usage with health check and user CRUD.

"use client";

import type { UserType } from "@rezumerai/types";
import { Button } from "@rezumerai/ui";
import { capitalize } from "@rezumerai/utils/string";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { ClientDate } from "../client-date";
import { UserFetcher } from "../user-fetcher";

interface HealthData {
  message: string;
  server: string;
  timestamp: string;
}

export default function SampleComponentWithTest() {
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");

  // Health state
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);

  // Users state
  const [users, setUsers] = useState<UserType[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  // Projects state (endpoint removed in Elysia migration — placeholder)
  const [projects] = useState<{ id: string; title: string; description: string; userId: string }[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  const [creating, setCreating] = useState(false);

  const fetchHealth = useCallback(async () => {
    setHealthLoading(true);
    const { data } = await api.health.get();
    if (data && "data" in data && data.data) {
      setHealthData(data.data as HealthData);
    }
    setHealthLoading(false);
  }, []);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    const { data } = await api.users.get();
    if (data && "data" in data) {
      setUsers((data.data ?? []) as UserType[]);
    }
    setUsersLoading(false);
  }, []);

  useEffect(() => {
    fetchHealth();
    fetchUsers();
    // Projects endpoint not yet migrated — clear loading
    setProjectsLoading(false);
  }, [fetchHealth, fetchUsers]);

  const handleCreateUser = async (e: React.SubmitEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;

    setCreating(true);
    await api.users.post({ name: newUserName, email: newUserEmail });
    setCreating(false);
    setNewUserName("");
    setNewUserEmail("");
    fetchUsers();
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
            <p>Status: {healthData ? "✅ Healthy" : "❌ Unhealthy"}</p>
            {healthData && (
              <div className="mt-2">
                <p>Message: {healthData.message}</p>
                <p>Server: {healthData.server}</p>
                <p>Timestamp: {healthData.timestamp}</p>
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
              {users.map((user: UserType) => (
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
              <Button appName="Rezumer" type="submit" disabled={creating}>
                {creating ? "Creating..." : "Create User"}
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
            {projects.map((project) => (
              <div key={project.id} className="rounded border bg-white p-3">
                <h3 className="font-medium">{project.title}</h3>
                <p className="text-gray-600 text-sm">{project.description}</p>
                <p className="text-gray-500 text-xs">User ID: {project.userId}</p>
              </div>
            ))}
            {projects.length === 0 && <p className="text-gray-500">No projects yet (endpoint not migrated).</p>}
          </div>
        )}
      </div>

      <div className="mt-8">
        <Button appName="Rezumer">Get Started</Button>
      </div>
    </div>
  );
}

// biome-ignore-all lint: This is a sample component for testing purposes, not production code

"use client";

import type { UserType } from "@rezumerai/types";
import { Button } from "@rezumerai/ui";
import { useId, useState } from "react";
import { api } from "../lib/api";

interface UserFetcherProps {
  className?: string;
}

export function UserFetcher({ className }: UserFetcherProps): React.JSX.Element {
  const [userId, setUserId] = useState<string>("1");
  const userIdInputId = useId();
  const [userData, setUserData] = useState<UserType | null>(null);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);

  const handleFetchUser = async () => {
    setUserLoading(true);
    setUserError(null);
    setUserData(null);

    const { data, error } = await api.api.users({ id: userId }).get();

    setUserLoading(false);
    if (error) {
      setUserError(
        typeof error === "object" && "error" in error ? (error as { error: string }).error : "User not found",
      );
    } else if (data && "data" in data && data.data) {
      setUserData(data.data as UserType);
    }
  };

  return (
    <div className={`rounded-lg bg-purple-50 p-4 ${className}`}>
      <h2 className="mb-4 font-semibold text-xl">Fetch Individual User</h2>
      <div className="space-y-4">
        <div>
          <label htmlFor={userIdInputId} className="mb-1 block font-medium text-sm">
            User ID:
          </label>
          <div className="flex gap-2">
            <input
              id={userIdInputId}
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="flex-1 rounded border p-2"
              placeholder="Enter user ID (e.g., 1, 2, 3)"
            />
            <Button appName="Rezumer" onClick={handleFetchUser}>
              Fetch User
            </Button>
          </div>
        </div>

        {userLoading ? (
          <div className="rounded border border-blue-300 bg-blue-100 p-3">
            <p className="text-blue-700">Loading user...</p>
          </div>
        ) : userError ? (
          <div className="rounded border border-red-300 bg-red-100 p-3">
            <p className="text-red-700">Error: {userError}</p>
          </div>
        ) : userData ? (
          <UserCard user={userData} />
        ) : (
          <p className="text-gray-500">Enter a user ID and click "Fetch User" to see details</p>
        )}
      </div>
    </div>
  );
}

interface UserCardProps {
  user: UserType;
}

function UserCard({ user }: UserCardProps): React.JSX.Element {
  return (
    <div className="rounded border bg-white p-4 shadow-sm">
      <h3 className="mb-2 font-semibold text-lg">User Details</h3>
      <div className="space-y-1">
        <p>
          <span className="font-medium text-gray-600">ID:</span>
          <span className="ml-2">{user.id}</span>
        </p>
        <p>
          <span className="font-medium text-gray-600">Name:</span>
          <span className="ml-2">{user.name}</span>
        </p>
        <p>
          <span className="font-medium text-gray-600">Email:</span>
          <span className="ml-2">{user.email}</span>
        </p>
      </div>
    </div>
  );
}

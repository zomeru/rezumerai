"use client";

import type { UserType } from "@rezumerai/types";
import { Button } from "@rezumerai/ui";
import { useId, useState } from "react";
import { api } from "../lib/api";

interface UserFetcherProps {
  className?: string;
}

export function UserFetcher({ className }: UserFetcherProps) {
  const [userId, setUserId] = useState<string>("1");
  const userIdInputId = useId();

  const {
    data: userData,
    isLoading: userLoading,
    error: userError,
    refetch: refetchUser,
  } = api.getUser.useQuery(["user", userId], { params: { id: userId } });

  const handleFetchUser = () => {
    refetchUser();
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
            <Button appName="RezumerAI" onClick={handleFetchUser}>
              Fetch User
            </Button>
          </div>
        </div>

        {userLoading ? (
          <div className="rounded border border-blue-300 bg-blue-100 p-3">
            <p className="text-blue-700">Loading user...</p>
          </div>
        ) : userError || (userData && !userData.body.success) ? (
          <div className="rounded border border-red-300 bg-red-100 p-3">
            <p className="text-red-700">Error: {userData?.body.error || "User not found"}</p>
          </div>
        ) : userData?.body.success && userData.body.data ? (
          <UserCard user={userData.body.data} />
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

function UserCard({ user }: UserCardProps) {
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

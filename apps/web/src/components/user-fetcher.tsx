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
    <div className={`p-4 bg-purple-50 rounded-lg ${className}`}>
      <h2 className="text-xl font-semibold mb-4">Fetch Individual User</h2>
      <div className="space-y-4">
        <div>
          <label htmlFor={userIdInputId} className="block text-sm font-medium mb-1">
            User ID:
          </label>
          <div className="flex gap-2">
            <input
              id={userIdInputId}
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="flex-1 p-2 border rounded"
              placeholder="Enter user ID (e.g., 1, 2, 3)"
            />
            <Button appName="RezumerAI" onClick={handleFetchUser}>
              Fetch User
            </Button>
          </div>
        </div>

        {userLoading ? (
          <div className="p-3 bg-blue-100 border border-blue-300 rounded">
            <p className="text-blue-700">Loading user...</p>
          </div>
        ) : userError || (userData && !userData.body.success) ? (
          <div className="p-3 bg-red-100 border border-red-300 rounded">
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
    <div className="p-4 bg-white rounded border shadow-sm">
      <h3 className="font-semibold text-lg mb-2">User Details</h3>
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

import { contract } from "@rezumerai/types";
import { initQueryClient } from "@ts-rest/react-query";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const api = initQueryClient(contract, {
  baseUrl,
  baseHeaders: {
    "Content-Type": "application/json",
  },
});

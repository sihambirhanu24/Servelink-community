import { QueryClient } from "@tanstack/react-query";

let queryClientInstance: QueryClient | null = null;

export function getQueryClient() {
  if (!queryClientInstance) {
    queryClientInstance = new QueryClient();
  }

  return queryClientInstance;
}

export const queryClient = getQueryClient();
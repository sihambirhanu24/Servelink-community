import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { getProfile } from "@/services/profile";

export function useProfile() {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    staleTime: 60_000,
    retry: 1,
    // Skip the query if there's no token
    enabled: !!token,
  });
}

import { useQuery } from "@tanstack/react-query";

import {
    getMembershipRequests,
} from "@/services/admin";

export function useMembershipRequests(){

    return useQuery({

        queryKey:["membershipRequests"],

        queryFn:getMembershipRequests,

    });

}
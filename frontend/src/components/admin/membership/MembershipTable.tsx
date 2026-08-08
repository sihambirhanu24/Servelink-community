"use client";

import { useMembershipRequests } from "@/hooks/useMembershipRequests";
import MembershipActions from "./MembershipActions";

export default function MembershipTable() {
  const {
    data,
    isLoading,
  } = useMembershipRequests();

  if (isLoading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-sm">

      <table className="w-full">

        <thead className="bg-gray-100">

          <tr>

            <th className="p-4 text-left">Teacher</th>

            <th>Level</th>

            <th>Community</th>

            <th>Status</th>

            <th>Eligible</th>

            <th>Action</th>

          </tr>

        </thead>

        <tbody>

          {data?.map((request: any) => (

            <tr
              key={request.id}
              className="border-b"
            >

              <td className="p-4">

                {request.teacher.firstName}{" "}
                {request.teacher.lastName}

              </td>

              <td>

                {request.teacher.level}

              </td>

              <td>

                {request.community.name}

              </td>

              <td>

                {request.status}

              </td>

              <td>

                {request.eligible ? (
                  <span className="font-semibold text-green-600">
                    ✔ Eligible
                  </span>
                ) : (
                  <span className="font-semibold text-red-500">
                    ✖ Not Eligible
                  </span>
                )}

              </td>

              <td>

                <MembershipActions
                  request={request}
                />

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}
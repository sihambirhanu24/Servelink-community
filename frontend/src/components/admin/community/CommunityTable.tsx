"use client";

export default function CommunityTable() {

  const communities = [

    {
      id: "1",
      name: "School Community",
      members: 210,
      posts: 120,
      type: "SCHOOL",
    },

    {
      id: "2",
      name: "Zone Community",
      members: 70,
      posts: 18,
      type: "ZONE",
    },

  ];

  return (

    <div className="overflow-hidden rounded-3xl bg-white shadow-sm">

      <table className="w-full">

        <thead className="bg-gray-100">

          <tr>

            <th>Name</th>

            <th>Type</th>

            <th>Members</th>

            <th>Posts</th>

            <th>Action</th>

          </tr>

        </thead>

        <tbody>

          {communities.map((community) => (

            <tr key={community.id}>

              <td>{community.name}</td>

              <td>{community.type}</td>

              <td>{community.members}</td>

              <td>{community.posts}</td>

              <td>

                View Edit Delete

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  );

}
import DataTableActions from "src/components/ui/DataTableActions";
import { Column, FetchParams, ServerSideDataTable } from "src/components/ui/ServerSideDatatable";

// import { Modal } from "src/components/ui/Modal";




interface User  {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Inactive';
  department: string;
}

type UserWithActions = User & { actions?: string };

interface ServerResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}


// ---- DUMMY DATA: 50 USERS ----
const dummyUsers: User[] = Array.from({ length: 50 }).map((_, i) => ({
  id: (i + 1).toString(),
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
  role: ["Admin", "Manager", "Staff"][(i % 3)],
  status: i % 2 === 0 ? "Active" : "Inactive",
  department: ["IT", "HR", "Sales"][i % 3],
}));

// ---- MOCK SERVER RESPONSE LOGIC ----
const fetchUsers = async (params: FetchParams): Promise<ServerResponse<User>> => {
  let filtered = [...dummyUsers];

  if (params.search) {
    const term = params.search.toLowerCase();
    filtered = filtered.filter(
      (u) =>
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
    );
  }

  if (params.filters) {
    Object.entries(params.filters).forEach(([key, value]) => {
      if (value) filtered = filtered.filter((u) => u[key as keyof User] === value);
    });
  }

  if (params.sortBy) {
    filtered.sort((a, b) => {
      const A = a[params.sortBy as keyof User];
      const B = b[params.sortBy as keyof User];
      if (A < B) return params.sortOrder === "desc" ? 1 : -1;
      if (A > B) return params.sortOrder === "desc" ? -1 : 1;
      return 0;
    });
  }

  const start = (params.page - 1) * params.pageSize;
  const paged = filtered.slice(start, start + params.pageSize);

  return {
    data: paged,
    total: filtered.length,
    page: params.page,
    pageSize: params.pageSize,
  };
};


// ---- DUMMY ROLES ----
const loadRoleOptions = async () => {
  return [
    { value: "Admin", label: "Admin" },
    { value: "Manager", label: "Manager" },
    { value: "Staff", label: "Staff" },
  ];
};

// ---- COLUMN SETUP ----
const columns: Column<UserWithActions>[] = [
  { key: "name", label: "Name", sortable: true },
  { key: "email", label: "Email", sortable: true },
  {
    key: "role",
    label: "Role",
    sortable: true,
    filterable: true,
    filterType: "select",
    filterOptions: loadRoleOptions,
  },
  {
    key: "status",
    label: "Status",
    filterable: true,
    filterType: "select",
    filterOptions: [
      { value: "Active", label: "Active" },
      { value: "Inactive", label: "Inactive" },
    ],
    render: (value) => (
      <span
        className={`tw-px-3 tw-py-1 tw-rounded-full tw-text-xs ${
          value === "Active"
            ? "tw-bg-primary tw-text-white"
            : "tw-bg-gray-200 tw-text-secondary"
        }`}
      >
        {value}
      </span>
    ),
  },
  {
    key: "department",
    label: "Department",
    filterable: true,
    filterType: "select",
    filterOptions: [
      { value: "IT", label: "IT" },
      { value: "HR", label: "Human Resources" },
      { value: "Sales", label: "Sales" },
    ],
  },
  {
    key: 'actions',
    label: 'Actions',
    render: (_value:any, row: User) => (
      <DataTableActions 
        row={row}
        onView={(r) => console.log("View", r.name)}
        onEdit={(r) => console.log("Edit", r.name)}
        onDelete={(r) => console.log("Delete", r.name)}
       />
    ),
  },
];

// ---- TEST PAGE ----
export default function UsersPage() {
  return (
    <ServerSideDataTable
      columns={columns}
      fetchData={fetchUsers}
      title="Users Management"
      pageSize={10}
      onRowSelect={(selected) => console.log("Selected:", selected)}
      actions={(selected) => (
        <button className="tw-px-4 tw-py-2 tw-bg-danger tw-text-white tw-rounded-lg">
          Delete {selected.length}
        </button>
      )}
    />
  );
}




// import { useState } from "react";

// export default function TestPage() {
//   const [isOpen, setIsOpen] = useState(true);

//   return (
//     <Modal
//       isOpen={isOpen}
//       onClose={() => setIsOpen(false)}
//       title="Modal Component Title Goes Here"
//     >
//       <form className="max-w-sm mx-auto space-y-4">
//         <div>
//           <label htmlFor="smallInput" className="block mb-2.5 text-sm font-medium text-heading">
//             Small Input
//           </label>
//           <input
//             type="text"
//             id="smallInput"
//             name="smallInput"
//             className="bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-2.5 py-2 shadow-xs placeholder:text-body"
//             required
//           />
//         </div>
//         <div>
//           <label htmlFor="baseInput" className="block mb-2.5 text-sm font-medium text-heading">
//             Base Input
//           </label>
//           <input
//             type="text"
//             id="baseInput"
//             name="baseInput"
//             className="bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body"
//             required
//           />
//         </div>
//         <div>
//           <label htmlFor="largeInput" className="block mb-2.5 text-sm font-medium text-heading">
//             Large Input
//           </label>
//           <input
//             type="text"
//             id="largeInput"
//             name="largeInput"
//             className="bg-neutral-secondary-medium border border-default-medium text-heading text-base rounded-base focus:ring-brand focus:border-brand block w-full px-3.5 py-3 shadow-xs placeholder:text-body"
//             required
//           />
//         </div>
//         <div>
//           <label htmlFor="xlInput" className="block mb-2.5 text-sm font-medium text-heading">
//             Extra Large Input
//           </label>
//           <input
//             type="text"
//             id="xlInput"
//             name="xlInput"
//             className="bg-neutral-secondary-medium border border-default-medium text-heading text-base rounded-base focus:ring-brand focus:border-brand block w-full px-4 py-3.5 shadow-xs placeholder:text-body"
//             required
//           />
//         </div>
//       </form>
//     </Modal>
//   );
// }

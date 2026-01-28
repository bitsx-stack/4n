import React, { useState, useEffect, useMemo } from "react";
import AdminDashboardLayout from "src/components/AdminDashboardLayout";
import DashboardCard from "src/components/DashboardCard";
import { Column, FetchParams } from "src/components/ui/ServerSideDatatable";
import DataTableActions from "src/components/ui/DataTableActions";
import api from "src/utils/api";

// Types based on company.py model
interface Company {
  id: number | null;
  name: string;
  tin: string | null;
  vrn: string | null;
  phone: string | null;
  email: string | null;
  location: string;
  created_at: string | null;
  updated_at: string | null;
  status: string | null;
  is_active?: boolean | true;
}

const initialCompany: Company = {
  id: null,
  name: "",
  tin: null,
  vrn: null,
  location: "",
  phone: null,
  email: null,
  created_at: null,
  updated_at: null,
  status: "active",
};

const API_BASE_URL = "http://localhost:8000/api"; // Update with your API URL

export interface Client {
  id: string;
  name: string;
  tin?: string | null;
  vrn?: string | null;
  location?: string | null;
  phone?: string | null;
  email?: string | null;
  is_active?: boolean | true;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

type ClientWithActions = Client & { actions?: string };

interface ServerResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

const fetchClients = async (
  params: FetchParams,
): Promise<ServerResponse<Client>> => {
  const res = await api.get("/clients", {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search || "",
    },
  });
  return res.data;
};

const createClient = async (data: Omit<Client, "id">): Promise<Client> => {
  const res = await api.post("/clients", data);
  return res.data;
};

const updateClient = async (
  id: string,
  data: Omit<Client, "id">,
): Promise<Client> => {
  const res = await api.put(`/clients/${id}`, data);
  return res.data;
};

const deleteClient = async (id: string): Promise<void> => {
  await api.delete(`/clients/${id}`);
};

const fetchClientById = async (id: string): Promise<Client> => {
  const res = await api.get(`/clients/${id}`);
  return res.data;
};

const columns: Column<ClientWithActions>[] = [
  { key: "id", label: "S/N", sortable: true, filterable: false },
  { key: "name", label: "Name", sortable: true, filterable: false },
  { key: "phone", label: "Phone", sortable: true, filterable: false },
  { key: "email", label: "Email", sortable: true, filterable: false },
  { key: "status", label: "Status", sortable: true, filterable: false },
  {
    key: "actions",
    label: "Actions",
    render: (_value: any, row: Client) => (
      <DataTableActions
        row={row}
        onView={(r) => console.log("View", r.name)}
        onEdit={(r) => console.log("Edit", r.name)}
        onDelete={(_r) => alert("Delete")}
      />
    ),
  },
];

const CompanyDashboard: React.FC = () => {
  const [clients, setCompanies] = useState<Company[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currentCompany, setCurrentCompany] = useState<Company>(initialCompany);
  const [isEditing, setIsEditing] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [sortField, setSortField] = useState<keyof Company>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Fetch clients on mount
  useEffect(() => {
    fetchCompanies();
  }, []);

  // Filter and sort clients
  const filteredCompanies = useMemo(() => {
    let result = [...clients];

    // Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (company) =>
          company.name.toLowerCase().includes(query) ||
          company.tin?.toLowerCase().includes(query) ||
          company.email?.toLowerCase().includes(query) ||
          company.phone?.toLowerCase().includes(query) ||
          company.location?.toLowerCase().includes(query),
      );
    }

    // Sort
    result.sort((a, b) => {
      const aVal = a[sortField] ?? "";
      const bVal = b[sortField] ?? "";
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [clients, searchQuery, sortField, sortDirection]);

  // Pagination
  const paginatedCompanies = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCompanies.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCompanies, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);

  // API Functions
  const fetchCompanies = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/clients`);
      const data = await response.json();
      setCompanies(data);
    } catch (error) {
      console.error("Failed to fetch clients:", error);
      alert("Failed to fetch clients");
    } finally {
      setIsLoading(false);
    }
  };

  const createCompany = async (company: Company) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/clients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...company,
          created_at: new Date().toISOString(),
        }),
      });
      if (response.ok) {
        alert("Company created successfully");
        fetchCompanies();
        closeModal();
      } else {
        alert("Failed to create company");
      }
    } catch (error) {
      console.error("Failed to create company:", error);
      alert("Failed to create company");
    } finally {
      setIsLoading(false);
    }
  };

  const updateCompany = async (company: Company) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/clients/${company.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...company,
          updated_at: new Date().toISOString(),
        }),
      });
      if (response.ok) {
        alert("Company updated successfully");
        fetchCompanies();
        closeModal();
      } else {
        alert("Failed to update company");
      }
    } catch (error) {
      console.error("Failed to update company:", error);
      alert("Failed to update company");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCompany = async (id: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/clients/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        alert("Company deleted successfully");
        fetchCompanies();
        setDeleteModalOpen(false);
        setCompanyToDelete(null);
      } else {
        alert("Failed to delete company");
      }
    } catch (error) {
      console.error("Failed to delete company:", error);
      alert("Failed to delete company");
    } finally {
      setIsLoading(false);
    }
  };

  // Modal handlers
  const openCreateModal = () => {
    setCurrentCompany(initialCompany);
    setIsEditing(false);
    setModalOpen(true);
  };

  const openEditModal = (company: Company) => {
    setCurrentCompany(company);
    setIsEditing(true);
    setModalOpen(true);
  };

  const openDeleteModal = (company: Company) => {
    setCompanyToDelete(company);
    setDeleteModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setCurrentCompany(initialCompany);
    setIsEditing(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany.name.trim()) {
      alert("Company name is required");
      return;
    }
    if (isEditing) {
      updateCompany(currentCompany);
    } else {
      createCompany(currentCompany);
    }
  };

  const handleSort = (field: keyof Company) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: keyof Company) => {
    if (sortField !== field) return "↕";
    return sortDirection === "asc" ? "↑" : "↓";
  };

  return (
    <AdminDashboardLayout>
      <DashboardCard title="clients">
        <div style={styles.container}>
          {/* Header */}
          <div style={styles.header}>
            <h1 style={styles.title}>Company Management</h1>
            <button style={styles.addButton} onClick={openCreateModal}>
              + Add Company
            </button>
          </div>

          {/* Search Bar */}
          <div style={styles.searchContainer}>
            <input
              type="text"
              style={styles.searchInput}
              placeholder="Search by name, TIN, email, phone, or address..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
            {searchQuery && (
              <button
                style={styles.clearButton}
                onClick={() => setSearchQuery("")}
              >
                ✕
              </button>
            )}
          </div>

          {/* Results count */}
          <p style={styles.resultsCount}>
            Showing {paginatedCompanies.length} of {filteredCompanies.length}{" "}
            clients
            {searchQuery && ` (filtered from ${clients.length} total)`}
          </p>

          {/* Table */}
          {isLoading && clients.length === 0 ? (
            <div style={styles.loader}>Loading...</div>
          ) : (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeaderRow}>
                    <th
                      style={styles.tableHeader}
                      onClick={() => handleSort("name")}
                    >
                      Name {getSortIcon("name")}
                    </th>
                    <th
                      style={styles.tableHeader}
                      onClick={() => handleSort("tin")}
                    >
                      TIN {getSortIcon("tin")}
                    </th>
                    <th
                      style={styles.tableHeader}
                      onClick={() => handleSort("phone")}
                    >
                      Phone {getSortIcon("phone")}
                    </th>
                    <th
                      style={styles.tableHeader}
                      onClick={() => handleSort("email")}
                    >
                      Email {getSortIcon("email")}
                    </th>
                    <th
                      style={styles.tableHeader}
                      onClick={() => handleSort("status")}
                    >
                      Status {getSortIcon("status")}
                    </th>
                    <th style={styles.tableHeader}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCompanies.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={styles.emptyText}>
                        No clients found
                      </td>
                    </tr>
                  ) : (
                    paginatedCompanies.map((company) => (
                      <tr key={company.id} style={styles.tableRow}>
                        <td style={styles.tableCell}>{company.name}</td>
                        <td style={styles.tableCell}>{company.tin || "-"}</td>
                        <td style={styles.tableCell}>{company.phone || "-"}</td>
                        <td style={styles.tableCell}>{company.email || "-"}</td>
                        <td style={styles.tableCell}>
                          <span
                            style={{
                              ...styles.statusBadge,
                              ...(company.status === "active"
                                ? styles.statusActive
                                : styles.statusInactive),
                            }}
                          >
                            {company.status || "N/A"}
                          </span>
                        </td>
                        <td style={styles.tableCell}>
                          <div style={styles.actionButtons}>
                            <button
                              style={styles.viewBtn}
                              onClick={() => openEditModal(company)}
                              title="View Details"
                            >
                              👁
                            </button>
                            <button
                              style={styles.editBtn}
                              onClick={() => openEditModal(company)}
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button
                              style={styles.deleteBtn}
                              onClick={() => openDeleteModal(company)}
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={styles.pagination}>
              <button
                style={styles.pageButton}
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                «
              </button>
              <button
                style={styles.pageButton}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                ‹
              </button>
              <span style={styles.pageInfo}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                style={styles.pageButton}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
              >
                ›
              </button>
              <button
                style={styles.pageButton}
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                »
              </button>
            </div>
          )}

          {/* Create/Edit Modal */}
          {modalOpen && (
            <div style={styles.modalOverlay} onClick={closeModal}>
              <div
                style={styles.modalContent}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={styles.modalHeader}>
                  <h2 style={styles.modalTitle}>
                    {isEditing ? "Edit Company" : "Create Company"}
                  </h2>
                  <button style={styles.modalCloseBtn} onClick={closeModal}>
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSave} style={styles.form}>
                  <div style={styles.formGrid}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Name *</label>
                      <input
                        type="text"
                        style={styles.input}
                        placeholder="Company Name"
                        value={currentCompany.name}
                        onChange={(e) =>
                          setCurrentCompany({
                            ...currentCompany,
                            name: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>TIN</label>
                      <input
                        type="text"
                        style={styles.input}
                        placeholder="Tax Identification Number"
                        value={currentCompany.tin || ""}
                        onChange={(e) =>
                          setCurrentCompany({
                            ...currentCompany,
                            tin: e.target.value || null,
                          })
                        }
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>VRN</label>
                      <input
                        type="text"
                        style={styles.input}
                        placeholder="VAT Registration Number"
                        value={currentCompany.vrn || ""}
                        onChange={(e) =>
                          setCurrentCompany({
                            ...currentCompany,
                            vrn: e.target.value || null,
                          })
                        }
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Phone</label>
                      <input
                        type="tel"
                        style={styles.input}
                        placeholder="Phone Number"
                        value={currentCompany.phone || ""}
                        onChange={(e) =>
                          setCurrentCompany({
                            ...currentCompany,
                            phone: e.target.value || null,
                          })
                        }
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Email</label>
                      <input
                        type="email"
                        style={styles.input}
                        placeholder="Email Address"
                        value={currentCompany.email || ""}
                        onChange={(e) =>
                          setCurrentCompany({
                            ...currentCompany,
                            email: e.target.value || null,
                          })
                        }
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Is Active</label>
                      <select
                        style={styles.input}
                        value={currentCompany.is_active ? "active" : "inactive"}
                        onChange={(e) =>
                          setCurrentCompany({
                            ...currentCompany,
                            is_active: e.target.value === "active",
                          })
                        }
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>

                    <div style={styles.formGroupFull}>
                      <label style={styles.label}>Location</label>
                      <textarea
                        style={styles.textarea}
                        placeholder="Coompany Location"
                        value={currentCompany.location || ""}
                        onChange={(e) =>
                          setCurrentCompany({
                            ...currentCompany,
                            location: e.target.value || "",
                          })
                        }
                        rows={3}
                      />
                    </div>



                  <div style={styles.modalFooter}>
                    <button
                      type="button"
                      style={styles.cancelBtn}
                      onClick={closeModal}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={styles.saveBtn}
                      disabled={isLoading}
                    >
                      {isLoading
                        ? "Saving..."
                        : isEditing
                          ? "Update"
                          : "Create"}
                    </button>
                  </div>
                </div>

                </form>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {deleteModalOpen && (
            <div
              style={styles.modalOverlay}
              onClick={() => setDeleteModalOpen(false)}
            >
              <div
                style={styles.deleteModalContent}
                onClick={(e) => e.stopPropagation()}
              >
                <h2 style={styles.deleteModalTitle}>Confirm Delete</h2>
                <p style={styles.deleteModalText}>
                  Are you sure you want to delete "
                  <strong>{companyToDelete?.name}</strong>"? This action cannot
                  be undone.
                </p>
                <div style={styles.modalFooter}>
                  <button
                    style={styles.cancelBtn}
                    onClick={() => {
                      setDeleteModalOpen(false);
                      setCompanyToDelete(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    style={styles.confirmDeleteBtn}
                    onClick={() =>
                      companyToDelete?.id && deleteCompany(companyToDelete.id)
                    }
                    disabled={isLoading}
                  >
                    {isLoading ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardCard>
    </AdminDashboardLayout>
  );
};

// Styles
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: "24px",
    maxWidth: "1400px",
    margin: "0 auto",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#1a1a2e",
    margin: 0,
  },
  addButton: {
    backgroundColor: "#4361ee",
    color: "#fff",
    border: "none",
    padding: "12px 24px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  searchContainer: {
    position: "relative",
    marginBottom: "16px",
  },
  searchInput: {
    width: "100%",
    padding: "14px 40px 14px 16px",
    fontSize: "16px",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    outline: "none",
    boxSizing: "border-box",
  },
  clearButton: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    fontSize: "18px",
    color: "#999",
    cursor: "pointer",
  },
  resultsCount: {
    color: "#666",
    marginBottom: "16px",
    fontSize: "14px",
  },
  tableContainer: {
    overflowX: "auto",
    backgroundColor: "#fff",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
    border: "1px solid #e8e8e8",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  tableHeaderRow: {
    backgroundColor: "#f8f9fa",
  },
  tableHeader: {
    padding: "16px",
    textAlign: "left",
    fontWeight: "600",
    color: "#1a1a2e",
    borderBottom: "2px solid #e8e8e8",
    cursor: "pointer",
    userSelect: "none",
    whiteSpace: "nowrap",
  },
  tableRow: {
    borderBottom: "1px solid #f0f0f0",
    transition: "background-color 0.2s",
  },
  tableCell: {
    padding: "14px 16px",
    color: "#333",
    fontSize: "14px",
  },
  statusBadge: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  statusActive: {
    backgroundColor: "#d4edda",
    color: "#155724",
  },
  statusInactive: {
    backgroundColor: "#f8d7da",
    color: "#721c24",
  },
  actionButtons: {
    display: "flex",
    gap: "8px",
  },
  viewBtn: {
    background: "#e3f2fd",
    border: "none",
    padding: "8px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
  },
  editBtn: {
    background: "#fff3cd",
    border: "none",
    padding: "8px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
  },
  deleteBtn: {
    background: "#f8d7da",
    border: "none",
    padding: "8px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
  },
  emptyText: {
    textAlign: "center",
    padding: "40px",
    color: "#999",
    fontSize: "16px",
  },
  loader: {
    textAlign: "center",
    padding: "60px",
    fontSize: "18px",
    color: "#666",
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
    marginTop: "24px",
  },
  pageButton: {
    padding: "8px 14px",
    border: "1px solid #e0e0e0",
    backgroundColor: "#fff",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
  },
  pageInfo: {
    padding: "0 16px",
    fontSize: "14px",
    color: "#666",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    padding: "20px",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "600px",
    maxHeight: "90vh",
    overflow: "auto",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 24px",
    borderBottom: "1px solid #e8e8e8",
  },
  modalTitle: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#1a1a2e",
    margin: 0,
  },
  modalCloseBtn: {
    background: "none",
    border: "none",
    fontSize: "20px",
    color: "#999",
    cursor: "pointer",
  },
  form: {
    padding: "24px",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "16px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
  },
  formGroupFull: {
    display: "flex",
    flexDirection: "column",
    gridColumn: "span 2",
  },
  label: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#333",
    marginBottom: "6px",
  },
  input: {
    padding: "12px",
    fontSize: "14px",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    outline: "none",
    transition: "border-color 0.2s",
  },
  textarea: {
    padding: "12px",
    fontSize: "14px",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
  },
  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "24px",
    paddingTop: "20px",
    borderTop: "1px solid #e8e8e8",
  },
  cancelBtn: {
    padding: "12px 24px",
    backgroundColor: "#f0f0f0",
    color: "#666",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  saveBtn: {
    padding: "12px 24px",
    backgroundColor: "#4361ee",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  deleteModalContent: {
    backgroundColor: "#fff",
    borderRadius: "16px",
    padding: "24px",
    width: "100%",
    maxWidth: "440px",
  },
  deleteModalTitle: {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#dc3545",
    marginTop: 0,
    marginBottom: "12px",
  },
  deleteModalText: {
    fontSize: "16px",
    color: "#666",
    lineHeight: "1.6",
    marginBottom: "24px",
  },
  confirmDeleteBtn: {
    padding: "12px 24px",
    backgroundColor: "#dc3545",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
};

export default CompanyDashboard;

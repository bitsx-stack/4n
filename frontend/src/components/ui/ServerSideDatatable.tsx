import { useState, useEffect, useCallback } from "react";
import {
  FiSearch,
  FiDownload,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiPlus,
} from "react-icons/fi";
import Select from "react-select";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";

export interface Column<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  filterType?: "text" | "select";
  filterOptions?:
    | Array<{ value: string; label: string }>
    | (() => Promise<Array<{ value: string; label: string }>>);
  render?: (value: any, row: T) => React.ReactNode;
}

interface ServerResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  fetchData: (params: FetchParams) => Promise<ServerResponse<T>>;
  title?: string;
  pageSize?: number;
  onRowSelect?: (selectedRows: T[]) => void;
  actions?: (selectedRows: T[]) => React.ReactNode;
  enableExport?: boolean;
}

export interface FetchParams {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  filters?: Record<string, string>;
}

export function ServerSideDataTable<T extends Record<string, any>>({
  columns,
  fetchData,
  title = "Data Table",
  pageSize = 10,
  onRowSelect,
  actions,
  enableExport = true,
}: DataTableProps<T>) {
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T;
    direction: "asc" | "desc";
  } | null>(null);
  const [selectedRows, setSelectedRows] = useState<T[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filterOptions, setFilterOptions] = useState<
    Record<string, Array<{ value: string; label: string }>>
  >({});

  const totalPages = Math.ceil(total / pageSize);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load filter options for select filters
  useEffect(() => {
    const loadFilterOptions = async () => {
      const options: Record<
        string,
        Array<{ value: string; label: string }>
      > = {};

      // Only include columns that are not 'actions' and are filterable
      const filterableColumns = columns.filter(
        (col) => col.key !== "actions" && col.filterType === "select"
      );

      for (const col of filterableColumns) {
        const key = String(col.key);
        if (typeof col.filterOptions === "function") {
          options[key] = await col.filterOptions();
        } else if (col.filterOptions) {
          options[key] = col.filterOptions;
        }
      }

      setFilterOptions(options);
    };

    loadFilterOptions();
  }, [columns]);

  // Fetch data from server
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: FetchParams = {
        page: currentPage,
        pageSize,
        search: debouncedSearch,
        sortBy: sortConfig ? String(sortConfig.key) : undefined,
        sortOrder: sortConfig?.direction,
        filters,
      };

      const response = await fetchData(params);
      setData(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch, sortConfig, filters, fetchData]);

  // Reload data when dependencies change
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset to page 1 when filters or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filters]);

  // Handle sort
  const handleSort = (key: keyof T) => {
    setSortConfig((prev) => {
      if (!prev || prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return null;
    });
  };

  // Handle select all (current page only)
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(data);
      onRowSelect?.(data);
    } else {
      setSelectedRows([]);
      onRowSelect?.([]);
    }
  };

  // Handle select row
  const handleSelectRow = (row: T, checked: boolean) => {
    const newSelected = checked
      ? [...selectedRows, row]
      : selectedRows.filter((r) => r !== row);
    setSelectedRows(newSelected);
    onRowSelect?.(newSelected);
  };

  // Export current filtered data to CSV
  const exportToCSV = async () => {
    // Fetch all data with current filters
    const allData = await fetchData({
      page: 1,
      pageSize: total,
      search: debouncedSearch,
      sortBy: sortConfig ? String(sortConfig.key) : undefined,
      sortOrder: sortConfig?.direction,
      filters,
    });

    const csv = Papa.unparse(allData.data);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "_")}.csv`;
    a.click();
  };

  // Export current filtered data to PDF
  const exportToPDF = async () => {
    // Fetch all data with current filters
    const allData = await fetchData({
      page: 1,
      pageSize: total,
      search: debouncedSearch,
      sortBy: sortConfig ? String(sortConfig.key) : undefined,
      sortOrder: sortConfig?.direction,
      filters,
    });

    const doc = new jsPDF();
    const tableData = allData.data.map((row) =>
      columns.map((col) => row[col.key]?.toString() || "")
    );
    const headers = columns.map((col) => col.label);

    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 20,
    });

    doc.text(title, 14, 15);
    doc.save(`${title.replace(/\s+/g, "_")}.pdf`);
  };

  // Custom styles for react-select
  const selectStyles = {
    control: (base: any) => ({
      ...base,
      minHeight: "38px",
      borderColor: "#d1d5db",
      "&:hover": { borderColor: "#00693E" },
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isFocused ? "#00693E" : "white",
      color: state.isFocused ? "white" : "#4A4A4A",
      "&:active": { backgroundColor: "#004D2C" },
    }),
  };

  return (
    <div className="tw-bg-white tw-rounded-lg tw-shadow-md tw-overflow-hidden">
      {/* Header */}
      <div className="tw-px-6 tw-py-4 tw-border-b tw-border-gray-200">
        <div className="tw-flex tw-flex-col lg:tw-flex-row tw-gap-4 tw-items-start lg:tw-items-center tw-justify-between">
          <h3 className="tw-text-lg tw-font-semibold tw-text-secondary">
            {title}
          </h3>

          <div className="tw-flex tw-flex-wrap tw-gap-3 tw-w-full lg:tw-w-auto">
            {/* Search */}
            <div className="tw-relative tw-flex-1 lg:tw-flex-initial">
              <FiSearch className="tw-absolute tw-left-3 tw-top-1/2 tw-transform -tw-translate-y-1/2 tw-text-secondary-light" />
              <input
                type="text"
                placeholder="Search all columns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="tw-pl-10 tw-pr-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded-lg focus:tw-ring-2 focus:tw-ring-primary focus:tw-border-primary tw-outline-none tw-w-full lg:tw-w-64"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`tw-px-4 tw-py-2 tw-rounded-lg tw-flex tw-items-center tw-gap-2 tw-transition-colors ${
                showFilters
                  ? "tw-bg-primary tw-text-white"
                  : "tw-bg-gray-100 tw-text-secondary hover:tw-bg-gray-200"
              }`}
            >
              <FiFilter />
              Filters
            </button>

            {/* Export */}
            {enableExport && (
              <div className="tw-flex tw-gap-2">
                <button
                  onClick={exportToCSV}
                  className="tw-px-4 tw-py-2 tw-bg-secondary tw-text-white tw-rounded-lg hover:tw-bg-primary-dark tw-transition-colors tw-flex tw-items-center tw-gap-2"
                >
                  <FiDownload />
                  CSV
                </button>
                <button
                  onClick={exportToPDF}
                  className="tw-px-4 tw-py-2 tw-bg-secondary tw-text-white tw-rounded-lg hover:tw-bg-secondary-dark tw-transition-colors tw-flex tw-items-center tw-gap-2"
                >
                  <FiDownload />
                  PDF
                </button>
                
              </div>
            )}
          </div>
        </div>

        {/* Column Filters */}
        {showFilters && (
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-4 tw-mt-4">
            {columns
              .filter(
                (col) => col.filterable !== false && col.key !== "actions"
              )
              .map((col) => {
                const key = String(col.key);
                const filterType = col.filterType || "text";

                return (
                  <div key={key}>
                    <label className="tw-block tw-text-xs tw-font-medium tw-text-secondary tw-mb-1">
                      {col.label}
                    </label>
                    {filterType === "select" ? (
                      <Select
                        isClearable
                        isSearchable
                        placeholder={`Filter ${col.label}...`}
                        options={filterOptions[key] || []}
                        value={
                          filters[key]
                            ? filterOptions[key]?.find(
                                (opt) => opt.value === filters[key]
                              )
                            : null
                        }
                        onChange={(option) => {
                          setFilters((prev) => ({
                            ...prev,
                            [key]: option?.value || "",
                          }));
                        }}
                        styles={selectStyles}
                      />
                    ) : (
                      <input
                        type="text"
                        placeholder={`Filter ${col.label}...`}
                        value={filters[key] || ""}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            [key]: e.target.value,
                          }))
                        }
                        className="tw-w-full tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-lg focus:tw-ring-2 focus:tw-ring-primary focus:tw-border-primary tw-outline-none tw-text-sm"
                      />
                    )}
                  </div>
                );
              })}
          </div>
        )}

        {/* Bulk Actions */}
        {selectedRows.length > 0 && actions && (
          <div className="tw-mt-4 tw-flex tw-items-center tw-gap-3 tw-p-3 tw-bg-primary tw-bg-opacity-10 tw-rounded-lg">
            <span className="tw-text-sm tw-font-medium tw-text-primary">
              {selectedRows.length} selected
            </span>
            {actions(selectedRows)}
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="tw-absolute tw-inset-0 tw-bg-white tw-bg-opacity-75 tw-flex tw-items-center tw-justify-center tw-z-10">
          <div className="tw-text-primary tw-text-lg">Loading...</div>
        </div>
      )}

      {/* Table */}
      <div className="tw-overflow-x-auto">
        <table className="tw-w-full">
          <thead className="tw-bg-gray-50 tw-border-b tw-border-gray-200">
            <tr>
              <th className="tw-px-6 tw-py-3 tw-text-left">
                <input
                  type="checkbox"
                  checked={
                    selectedRows.length === data.length && data.length > 0
                  }
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="tw-w-4 tw-h-4 tw-text-primary tw-rounded focus:tw-ring-primary"
                />
              </th>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-secondary tw-uppercase"
                >
                  {col.sortable !== false ? (
                    <button
                      onClick={() => handleSort(col.key)}
                      className="tw-flex tw-items-center tw-gap-1 hover:tw-text-primary tw-transition-colors"
                    >
                      {col.label}
                      {sortConfig?.key === col.key && (
                        <span>
                          {sortConfig.direction === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="tw-divide-y tw-divide-gray-200">
            {data.map((row, index) => (
              <tr
                key={index}
                className="hover:tw-bg-gray-50 tw-transition-colors"
              >
                <td className="tw-px-6 tw-py-4">
                  <input
                    type="checkbox"
                    checked={selectedRows.includes(row)}
                    onChange={(e) => handleSelectRow(row, e.target.checked)}
                    className="tw-w-4 tw-h-4 tw-text-primary tw-rounded focus:tw-ring-primary"
                  />
                </td>
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className="tw-px-6 tw-py-4 tw-text-sm tw-text-secondary"
                  >
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="tw-px-6 tw-py-4 tw-border-t tw-border-gray-200 tw-flex tw-flex-col sm:tw-flex-row tw-items-center tw-justify-between tw-gap-4">
        <div className="tw-text-sm tw-text-secondary-light">
          Showing {Math.min((currentPage - 1) * pageSize + 1, total)} to{" "}
          {Math.min(currentPage * pageSize, total)} of {total} results
        </div>

        <div className="tw-flex tw-items-center tw-gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-lg tw-text-secondary hover:tw-bg-gray-50 disabled:tw-opacity-50 disabled:tw-cursor-not-allowed tw-transition-colors"
          >
            <FiChevronLeft />
          </button>

          <div className="tw-flex tw-gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`tw-px-4 tw-py-2 tw-rounded-lg tw-transition-colors ${
                    currentPage === pageNum
                      ? "tw-bg-primary tw-text-white"
                      : "tw-text-secondary hover:tw-bg-gray-50"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="tw-px-3 tw-py-2 tw-border tw-border-gray-300 tw-rounded-lg tw-text-secondary hover:tw-bg-gray-50 disabled:tw-opacity-50 disabled:tw-cursor-not-allowed tw-transition-colors"
          >
            <FiChevronRight />
          </button>
        </div>
      </div>
    </div>
  );
}

import { EyeIcon, PencilIcon, DeleteIcon } from "lucide-react";

interface DataTableActionsProps<T> {
  row: T;
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
}

export default function DataTableActions<T>({
  row,
  onView,
  onEdit,
  onDelete,
}: DataTableActionsProps<T>) {
  return (
    <div className="tw-flex tw-gap-2">
      <button
        onClick={() => onView?.(row)}
        className="tw-px-2 tw-py-1 tw-bg-secondary tw-text-white tw-rounded hover:tw-bg-secondary-dark tw-text-xs"
      >
        <EyeIcon />
      </button>

      <button
        onClick={() => onEdit?.(row)}
        className="tw-px-2 tw-py-1 tw-bg-primary tw-text-white tw-rounded hover:tw-bg-primary-dark tw-text-xs"
      >
        <PencilIcon />
      </button>

      <button
        onClick={() => onDelete?.(row)}
        className="tw-px-2 tw-py-1 tw-bg-danger tw-text-white tw-rounded hover:tw-bg-danger-dark tw-text-xs"
      >
        <DeleteIcon />
      </button>
    </div>
  );
}

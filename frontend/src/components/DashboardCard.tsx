interface DashboardCardProps {
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export default function DashboardCard({ title, children, actions, className = '' }: DashboardCardProps) {
  return (
    <div className={`tw-bg-white tw-rounded-lg tw-shadow-md tw-overflow-hidden ${className}`}>
      {title && (
        <div className="tw-bg-gray-50 tw-px-6 tw-py-4 tw-border-b tw-border-gray-200 tw-flex tw-justify-between tw-items-center">
          <h3 className="tw-text-lg tw-font-semibold tw-text-secondary">{title}</h3>
          {actions && <div>{actions}</div>}
        </div>
      )}
      <div className="tw-p-6">{children}</div>
    </div>
  );
}
import { capitalizeWords, getTwoInitials } from "src/utils/getInitials";
import { LogoutButton } from "./ui/LogoutButton";


interface HeaderProps {
  onMenuClick: () => void;
  onNotificationClick: () => void;
  fullname: string;
  role: string
}


export default function Header({ onMenuClick, onNotificationClick, fullname, role }: HeaderProps) {
  return (
    <header className="tw-bg-white tw-border-b tw-border-gray-200 tw-px-6 tw-py-4 tw-sticky tw-top-0 tw-z-30">
      <div className="tw-flex tw-items-center tw-justify-between">
        <div className="tw-flex tw-items-center tw-gap-4">
          <button onClick={onMenuClick} className="lg:tw-hidden tw-text-secondary hover:tw-text-primary tw-text-2xl">
            ☰
          </button>
          <h1 className="tw-text-xl tw-font-semibold tw-text-secondary">Dashboard</h1>
        </div>

        <div className="tw-flex tw-items-center tw-gap-4">
          <button onClick={onNotificationClick} className="tw-relative tw-p-2 tw-text-secondary hover:tw-text-primary tw-transition-colors">
            <span className="tw-text-2xl">🔔</span>
            <span className="tw-absolute tw-top-1 tw-right-1 tw-w-2 tw-h-2 tw-bg-danger tw-rounded-full"></span>
          </button>

          <div className="tw-flex tw-items-center tw-gap-3">
            <div className="tw-text-right tw-hidden sm:tw-block">
              <p className="tw-text-sm tw-font-medium tw-text-secondary">{capitalizeWords(fullname)}</p>
              <p className="tw-text-xs tw-text-secondary-light">{capitalizeWords(role)}</p>
            </div>
            <div className="tw-w-10 tw-h-10 tw-bg-primary tw-rounded-full tw-flex tw-items-center tw-justify-center tw-text-white tw-font-semibold">
              {getTwoInitials(fullname)}
            </div>
          </div>

          <LogoutButton />
        </div>
      </div>
    </header>
  );
}

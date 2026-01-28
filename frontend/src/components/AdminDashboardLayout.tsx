import { useEffect, useState } from "react";
import ErrorPage from "src/components/ErrorPage";
import Header from "src/components/Header";
import Sidebar from "src/components/Sidebar";
import ToastNotification from "src/components/ToastNotification";
import api from "src/utils/api";
import { useNavigate } from "react-router";

export default function AdminDashboardLayout({ children }:{
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDetails, setUserDetails] = useState<any>()
  const [error, setError] = useState<string>("")

  const navigate = useNavigate()
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  } | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });

  const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setNotification({ message, type });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showNotification('Form submitted successfully!', 'success');
    setFormData({ firstName: '', lastName: '', email: '' });
  };


  const getUserDetails = async () => {
    try {
      setError("")
      const response = await api.get("/auth/me")
      localStorage.setItem("user", JSON.stringify(response.data));
      setUserDetails(response.data)
    } catch (error: any) {
      setError(error.friendlyMessage || "Failed to load authenticated user! try to login again...")
    }
   
  }

  useEffect(()=>{
    getUserDetails()
  }, [])

  if (error) return (<><ErrorPage errorType="unauthorized" errorMessage={error} onGoHome={()=>{ navigate("/login")}}/></>)
  return (
    <div className="tw-flex tw-h-screen tw-bg-gray-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="tw-flex-1 tw-flex tw-flex-col tw-overflow-hidden">
        {/* Header */}
        <Header
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          onNotificationClick={() => showNotification('You have 3 new notifications', 'info')}
          fullname={userDetails?.fullname || ""}
          role={userDetails?.role || ""}
        />

        {/* Notification Container */}
        {notification && (
          <div className="tw-fixed tw-top-20 tw-right-6 tw-z-50 tw-w-96 tw-max-w-[calc(100vw-3rem)]">
            <ToastNotification
              message={notification.message}
              type={notification.type}
              duration={5000}
              onClose={() => setNotification(null)}
            />
          </div>
        )}

        {/* Main Content Area */}
        <main className="tw-flex-1 tw-overflow-y-auto tw-p-6">
          {/* Stats Cards */}
          {/* <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-6 tw-mb-6">
            <DashboardCard>
              <div className="tw-flex tw-items-center tw-justify-between">
                <div>
                  <p className="tw-text-secondary-light tw-text-sm">Total Users</p>
                  <p className="tw-text-3xl tw-font-bold tw-text-primary">1,234</p>
                  <p className="tw-text-xs tw-text-primary tw-mt-1">↑ 12% from last month</p>
                </div>
                <div className="tw-text-5xl tw-opacity-20">👥</div>
              </div>
            </DashboardCard>

            <DashboardCard>
              <div className="tw-flex tw-items-center tw-justify-between">
                <div>
                  <p className="tw-text-secondary-light tw-text-sm">Revenue</p>
                  <p className="tw-text-3xl tw-font-bold tw-text-primary">$45,678</p>
                  <p className="tw-text-xs tw-text-primary tw-mt-1">↑ 8% from last month</p>
                </div>
                <div className="tw-text-5xl tw-opacity-20">💰</div>
              </div>
            </DashboardCard>

            <DashboardCard>
              <div className="tw-flex tw-items-center tw-justify-between">
                <div>
                  <p className="tw-text-secondary-light tw-text-sm">Orders</p>
                  <p className="tw-text-3xl tw-font-bold tw-text-secondary">892</p>
                  <p className="tw-text-xs tw-text-danger tw-mt-1">↓ 3% from last month</p>
                </div>
                <div className="tw-text-5xl tw-opacity-20">📦</div>
              </div>
            </DashboardCard>

            <DashboardCard>
              <div className="tw-flex tw-items-center tw-justify-between">
                <div>
                  <p className="tw-text-secondary-light tw-text-sm">Stock Items</p>
                  <p className="tw-text-3xl tw-font-bold tw-text-primary">5,678</p>
                  <p className="tw-text-xs tw-text-primary tw-mt-1">↑ 5% from last month</p>
                </div>
                <div className="tw-text-5xl tw-opacity-20">📊</div>
              </div>
            </DashboardCard>
          </div> */}

          {/* Content Cards */}
          {/* <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-6 tw-mb-6">
            <DashboardCard
              title="Recent Orders"
              actions={
                <button className="tw-text-primary hover:tw-text-primary-dark tw-text-sm tw-font-medium">
                  View All
                </button>
              }
            >
              <div className="tw-space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="tw-flex tw-items-center tw-justify-between tw-py-2 tw-border-b tw-border-gray-100 last:tw-border-0">
                    <div>
                      <p className="tw-font-medium tw-text-secondary">Order #{1000 + i}</p>
                      <p className="tw-text-sm tw-text-secondary-light">Customer Name</p>
                    </div>
                    <span className="tw-px-3 tw-py-1 tw-bg-primary tw-bg-opacity-10 tw-text-primary tw-rounded-full tw-text-xs tw-font-medium">
                      Completed
                    </span>
                  </div>
                ))}
              </div>
            </DashboardCard>

            <DashboardCard title="Quick Actions">
              <div className="tw-grid tw-grid-cols-2 tw-gap-4">
                <button
                  onClick={() => showNotification('User added successfully!', 'success')}
                  className="tw-p-4 tw-bg-primary tw-bg-opacity-10 tw-text-primary hover:tw-bg-opacity-20 tw-rounded-lg tw-transition-colors tw-text-center"
                >
                  <div className="tw-text-3xl tw-mb-2">➕</div>
                  <div className="tw-text-sm tw-font-medium">Add User</div>
                </button>
                <button
                  onClick={() => showNotification('Stock updated successfully!', 'success')}
                  className="tw-p-4 tw-bg-primary tw-bg-opacity-10 tw-text-primary hover:tw-bg-opacity-20 tw-rounded-lg tw-transition-colors tw-text-center"
                >
                  <div className="tw-text-3xl tw-mb-2">📦</div>
                  <div className="tw-text-sm tw-font-medium">Manage Stock</div>
                </button>
                <button
                  onClick={() => showNotification('Report generated!', 'info')}
                  className="tw-p-4 tw-bg-secondary tw-bg-opacity-10 tw-text-secondary hover:tw-bg-opacity-20 tw-rounded-lg tw-transition-colors tw-text-center"
                >
                  <div className="tw-text-3xl tw-mb-2">📊</div>
                  <div className="tw-text-sm tw-font-medium">View Reports</div>
                </button>
                <button
                  onClick={() => showNotification('Settings updated!', 'warning')}
                  className="tw-p-4 tw-bg-secondary tw-bg-opacity-10 tw-text-secondary hover:tw-bg-opacity-20 tw-rounded-lg tw-transition-colors tw-text-center"
                >
                  <div className="tw-text-3xl tw-mb-2">⚙️</div>
                  <div className="tw-text-sm tw-font-medium">Settings</div>
                </button>
              </div>
            </DashboardCard>
          </div> */}

          {/* Form Example */}
          {/* <DashboardCard title="Sample Form" className="tw-mb-6">
            <div className="tw-space-y-4">
              <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
                <div>
                  <label className="tw-block tw-text-sm tw-font-medium tw-text-secondary tw-mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="tw-w-full tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded-lg focus:tw-ring-2 focus:tw-ring-primary focus:tw-border-primary tw-outline-none tw-transition-colors"
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <label className="tw-block tw-text-sm tw-font-medium tw-text-secondary tw-mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="tw-w-full tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded-lg focus:tw-ring-2 focus:tw-ring-primary focus:tw-border-primary tw-outline-none tw-transition-colors"
                    placeholder="Enter last name"
                  />
                </div>
              </div>
              <div className="tw-flex tw-gap-3">
                <button
                  onClick={handleSubmit}
                  className="tw-px-6 tw-py-2 tw-bg-primary tw-text-white tw-rounded-lg hover:tw-bg-primary-dark tw-transition-colors tw-font-medium"
                >
                  Submit
                </button>
                <button
                  onClick={() => setFormData({ firstName: '', lastName: '', email: '' })}
                  className="tw-px-6 tw-py-2 tw-bg-secondary-light tw-text-white tw-rounded-lg hover:tw-bg-secondary tw-transition-colors tw-font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </DashboardCard> */}

          {/* Sample Table */}
          {/* <DashboardCard title="Users Table">
            <div className="tw-overflow-x-auto">
              <table className="tw-w-full">
                <thead className="tw-bg-gray-50 tw-border-b tw-border-gray-200">
                  <tr>
                    <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-secondary tw-uppercase">Name</th>
                    <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-secondary tw-uppercase">Email</th>
                    <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-secondary tw-uppercase">Role</th>
                    <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-secondary tw-uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="tw-divide-y tw-divide-gray-200">
                  {[
                    { name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' },
                    { name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'Active' },
                    { name: 'Bob Johnson', email: 'bob@example.com', role: 'User', status: 'Inactive' },
                  ].map((user, i) => (
                    <tr key={i} className="hover:tw-bg-gray-50">
                      <td className="tw-px-6 tw-py-4 tw-text-sm tw-text-secondary">{user.name}</td>
                      <td className="tw-px-6 tw-py-4 tw-text-sm tw-text-secondary">{user.email}</td>
                      <td className="tw-px-6 tw-py-4 tw-text-sm tw-text-secondary">{user.role}</td>
                      <td className="tw-px-6 tw-py-4">
                        <span className={`tw-px-3 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${
                          user.status === 'Active' ? 'tw-bg-primary tw-bg-opacity-10 tw-text-primary' : 'tw-bg-gray-200 tw-text-secondary'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DashboardCard> */}

          { children }
        </main>
      </div>
    </div>
  );
}
import { createBrowserRouter } from "react-router";
import LoginPage from "./pages/Login";
import {
  UnauthorizedPage,
  ForbiddenPage,
  ServerErrorPage,
  NetworkErrorPage,
  NotFoundPage,
} from "./components/Error";
import AdminDashboard from "./pages/Dashboard";
import { ForgotPasswordPage } from "./pages/ForgotPassword";
import { ResetPasswordPage } from "./pages/ResetPassword";
import TestPage from "./pages/TestPage";
import TypesPage from "./pages/types";
import CategoriesPage from "./pages/categories";
import ImeiInventoryPage from "./pages/imeis";
import CompaniesPage from "./pages/companies";
import StorePage from "./pages/stores";
import VendorsPage from "./pages/vendors";
import SmsSettingsPage from "./pages/sms";
import PurchasesPage from "./pages/purchases";
import TransfersPage from "./pages/transfers";
import SalesPage from "./pages/sales";
import CustomersPage from "./pages/customers";
import PermissionsPage from "./pages/permissions";
import StockTakingPage from "./pages/stock-taking";
import MenuManagementPage from "./pages/settings/menus";
import UserPermissionsPage from "./pages/users/permissions";

const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/dashboard", element: <AdminDashboard /> },
  { path: "/users/permissions", element: <UserPermissionsPage /> },
  { path: "/users/customers", element: <CustomersPage /> },
  { path: "/inventory/stock", element: <ImeiInventoryPage /> },
  { path: "/inventory/stock-taking", element: <StockTakingPage /> },
  { path: "/inventory/transfers", element: <TransfersPage /> },
  { path: "/billing/sales", element: <SalesPage /> },


  { path: "/purchases/list", element: <PurchasesPage /> },
  { path: "/settings/types", element: <TypesPage /> },
  { path: "/settings/categories", element: <CategoriesPage /> },
  { path: "/settings/companies", element: <CompaniesPage /> },
  { path: "/settings/stores", element: <StorePage /> },
  { path: "/settings/vendors", element: <VendorsPage /> },
  { path: "/settings/sms", element: <SmsSettingsPage /> },
  { path: "/settings/menus", element: <MenuManagementPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  { path: "/test", element: <TestPage /> },

  { path: "/unauthorized", element: <UnauthorizedPage /> },
  { path: "/forbidden", element: <ForbiddenPage /> },
  { path: "/server-error", element: <ServerErrorPage /> },
  { path: "/network-error", element: <NetworkErrorPage /> },
  { path: "/generic", element: <UnauthorizedPage /> },

  { path: "*", element: <NotFoundPage /> },
]);

export default router;

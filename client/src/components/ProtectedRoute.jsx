
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
    const { isAuthenticated, authLoading } = useAuth();
    const location = useLocation();

    if (authLoading) {
        return (
            <div
                className="flex min-h-screen items-center justify-center"
                role="status"
                aria-live="polite"
            >
                <div className="text-center">
                    <div
                        className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-current border-t-transparent"
                        aria-hidden="true"
                    />
                    <p className="mt-4 text-sm text-gray-500">
                        Restoring your VOYAGO session...
                    </p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: location }}
            />
        );
    }

    return children || <Outlet />;
}

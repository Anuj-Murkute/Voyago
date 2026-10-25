
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((current) => ({
            ...current,
            [name]: value,
        }));

        if (message) setMessage("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (loading) return;

        setMessage("");
        setLoading(true);

        try {
            const data = await loginUser({
                email: formData.email.trim(),
                password: formData.password,
            });

            if (!data?.token || !data?.user) {
                throw new Error(
                    "The server returned an unexpected response. Please try again."
                );
            }

            login(data);
            navigate("/dashboard", { replace: true });
        } catch (error) {
            setMessage(
                error?.message || "Unable to sign in. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="login-page">
            <section className="login-card" aria-labelledby="login-heading">
                <div className="logo">VOYAGO</div>

                <h1 className="login-title" id="login-heading">
                    Welcome Back
                </h1>

                <p className="login-subtitle">
                    Sign in to continue your journey
                </p>

                <form className="login-form" onSubmit={handleSubmit}>
                    <label htmlFor="login-email">Email</label>

                    <input
                        id="login-email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        autoComplete="email"
                        maxLength={254}
                        required
                    />

                    <label htmlFor="login-password">Password</label>

                    <input
                        id="login-password"
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        required
                    />

                    <button
                        className="login-button"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? "Signing In..." : "Sign In"}
                    </button>
                </form>

                {message && (
                    <p className="login-message" role="alert">
                        {message}
                    </p>
                )}

                <div className="login-footer">
                    Don't have an account?{" "}
                    <Link to="/register">Create Account</Link>
                </div>
            </section>
        </main>
    );
}

export default Login;

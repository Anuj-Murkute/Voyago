
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../services/api";
import { useAuth } from "../context/AuthContext";

function Register() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: ""
    });

    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));

        if (message) setMessage("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");

        const name = formData.name.trim();
        const email = formData.email.trim();

        if (!name || !email || !formData.password) {
            setMessage("Please complete all fields.");
            return;
        }

        if (formData.password.length < 6) {
            setMessage("Password must contain at least 6 characters.");
            return;
        }

        setLoading(true);

        try {
            const data = await registerUser({
                name,
                email,
                password: formData.password
            });

            // This assumes the API returns { token, user }.
            if (!data?.token || !data?.user) {
                throw new Error(
                    "Registration response was incomplete. Please check your API response."
                );
            }

            login(data);
            navigate("/dashboard", { replace: true });
        } catch (error) {
            setMessage(
                error?.message || "Unable to create your account. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="register-page">
            <section className="register-card">
                <Link to="/" className="register-logo" aria-label="Voyago home">
                    VOYAGO<span>.</span>
                </Link>

                <h1>Create your account</h1>
                <p className="register-subtitle">
                    Start planning smarter journeys.
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="register-field">
                        <label htmlFor="register-name">Full name</label>
                        <input
                            id="register-name"
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter your full name"
                            autoComplete="name"
                            maxLength={100}
                            required
                        />
                    </div>

                    <div className="register-field">
                        <label htmlFor="register-email">Email address</label>
                        <input
                            id="register-email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            autoComplete="email"
                            required
                        />
                    </div>

                    <div className="register-field">
                        <label htmlFor="register-password">Password</label>
                        <input
                            id="register-password"
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="At least 6 characters"
                            autoComplete="new-password"
                            minLength={6}
                            maxLength={128}
                            required
                        />
                        <small>Use at least 6 characters.</small>
                    </div>

                    {message && (
                        <div className="register-message" role="alert">
                            {message}
                        </div>
                    )}

                    <button
                        className="register-submit"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? "Creating account..." : "Create account"}
                    </button>
                </form>

                <p className="register-footer">
                    Already have an account?{" "}
                    <Link to="/login">Sign in</Link>
                </p>

                <p className="register-legal">
                    Your journey starts with a single step.
                </p>
            </section>

            <style>{`
                .register-page {
                    min-height: 100vh;
                    box-sizing: border-box;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 32px 18px;
                    background:
                        radial-gradient(ellipse at top left, rgba(59,130,246,.10), transparent 42%),
                        var(--bg);
                    color: var(--text);
                }

                .register-card {
                    box-sizing: border-box;
                    width: 100%;
                    max-width: 440px;
                    padding: clamp(24px, 5vw, 42px);
                    background: var(--surface);
                    border: 1px solid var(--border);
                    border-radius: 24px;
                    box-shadow: 0 24px 70px var(--shadow);
                }

                .register-logo {
                    display: block;
                    margin-bottom: 28px;
                    color: var(--text);
                    text-align: center;
                    text-decoration: none;
                    font-size: 29px;
                    font-weight: 900;
                    letter-spacing: 2px;
                }

                .register-logo span {
                    color: #3b82f6;
                }

                .register-card h1 {
                    margin: 0;
                    text-align: center;
                    font-size: clamp(25px, 5vw, 31px);
                    letter-spacing: -1px;
                }

                .register-subtitle {
                    margin: 10px 0 28px;
                    color: var(--muted);
                    text-align: center;
                    font-size: 14px;
                    line-height: 1.6;
                }

                .register-field {
                    margin-bottom: 19px;
                }

                .register-field label {
                    display: block;
                    margin-bottom: 8px;
                    color: var(--text);
                    font-size: 13px;
                    font-weight: 700;
                }

                .register-field input {
                    display: block;
                    box-sizing: border-box;
                    width: 100%;
                    min-height: 48px;
                    padding: 12px 14px;
                    background: var(--input-bg);
                    color: var(--input-text);
                    border: 1px solid var(--border);
                    border-radius: 11px;
                    font: inherit;
                    font-size: 14px;
                    outline: none;
                    transition: border-color .2s, box-shadow .2s;
                }

                .register-field input::placeholder {
                    color: var(--input-placeholder);
                }

                .register-field input:focus {
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59,130,246,.15);
                }

                .register-field small {
                    display: block;
                    margin-top: 7px;
                    color: var(--muted);
                    font-size: 11px;
                }

                .register-submit {
                    width: 100%;
                    min-height: 49px;
                    margin-top: 5px;
                    padding: 13px 16px;
                    background: #2563eb;
                    color: #fff;
                    border: 1px solid #2563eb;
                    border-radius: 11px;
                    font: inherit;
                    font-size: 14px;
                    font-weight: 800;
                    cursor: pointer;
                    transition: background .2s, transform .2s, opacity .2s;
                }

                .register-submit:hover:not(:disabled) {
                    background: #1d4ed8;
                    transform: translateY(-1px);
                }

                .register-submit:disabled {
                    cursor: wait;
                    opacity: .65;
                }

                .register-message {
                    margin: 0 0 16px;
                    padding: 12px;
                    background: rgba(220,38,38,.08);
                    color: #dc2626;
                    border: 1px solid rgba(220,38,38,.25);
                    border-radius: 10px;
                    font-size: 13px;
                    line-height: 1.5;
                }

                .register-footer {
                    margin: 24px 0 0;
                    color: var(--muted);
                    text-align: center;
                    font-size: 13px;
                }

                .register-footer a {
                    color: #3b82f6;
                    font-weight: 800;
                    text-decoration: none;
                }

                .register-footer a:hover {
                    text-decoration: underline;
                }

                .register-legal {
                    margin: 24px 0 0;
                    padding-top: 18px;
                    border-top: 1px solid var(--border);
                    color: var(--muted);
                    text-align: center;
                    font-size: 11px;
                }

                .register-submit:focus-visible,
                .register-logo:focus-visible,
                .register-footer a:focus-visible {
                    outline: 3px solid #60a5fa;
                    outline-offset: 3px;
                }

                @media (prefers-reduced-motion: reduce) {
                    .register-field input,
                    .register-submit {
                        transition: none;
                    }
                }
            `}</style>
        </main>
    );
}

export default Register;

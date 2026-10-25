
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Home.css";

const destinations = [
    {
        name: "The Maldives",
        country: "Indian Ocean",
        category: "ISLAND ESCAPE",
        description: "Turquoise waters. Private island moments.",
        image:
            "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1200&q=85",
        size: "destination-card-large",
        duration: "5–7 days",
    },
    {
        name: "Swiss Alps",
        country: "Switzerland",
        category: "MOUNTAIN RETREAT",
        description: "Find your quiet above the clouds.",
        image:
            "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1000&q=85",
        size: "",
        duration: "4–6 days",
    },
    {
        name: "Kyoto",
        country: "Japan",
        category: "CULTURE & HERITAGE",
        description: "Ancient streets. Timeless discoveries.",
        image:
            "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1000&q=85",
        size: "",
        duration: "3–5 days",
    },
    {
        name: "Amalfi Coast",
        country: "Italy",
        category: "COASTAL GETAWAY",
        description: "A slower kind of Mediterranean living.",
        image:
            "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1000&q=85",
        size: "",
        duration: "4–6 days",
    },
];

const travelServices = [
    { icon: "✈", label: "Flights", description: "Find your route", path: "/flights" },
    { icon: "⌂", label: "Hotels", description: "Find your stay", path: "/hotels" },
    { icon: "▰", label: "Trains", description: "Travel by rail", path: "/trains" },
    { icon: "▤", label: "Buses", description: "Explore bus routes", path: "/buses" },
    { icon: "⌁", label: "Cruises", description: "Sail somewhere new", path: "/cruises" },
];

const travelFeatures = [
    {
        icon: "✦",
        title: "AI-crafted itineraries",
        description:
            "Turn your destination, interests, and travel style into a personalized day-by-day plan.",
    },
    {
        icon: "◎",
        title: "One place to plan",
        description:
            "Keep trip planning, travel options, and your saved journeys together in VOYAGO.",
    },
    {
        icon: "◇",
        title: "Discover differently",
        description:
            "Find inspiration for your next escape, from mountain retreats to faraway coastlines.",
    },
];

function Home() {
    const { user, isAuthenticated } = useAuth();
    const loggedIn = Boolean(isAuthenticated ?? user);

    return (
        <main className="home-page">
            <section className="explore-hero">
                <div className="explore-hero-image" aria-hidden="true" />
                <div className="explore-hero-shade" aria-hidden="true" />

                <div className="explore-hero-content">
                    <div className="explore-eyebrow">
                        <span className="explore-eyebrow-star">✦</span>
                        YOUR NEXT CHAPTER STARTS HERE
                    </div>

                    <h1>
                        The world
                        <br />
                        is <span>yours</span>
                        <br />
                        to discover.
                    </h1>

                    <p className="explore-hero-description">
                        Extraordinary places. Thoughtfully planned journeys.
                        Your next unforgettable story begins with VOYAGO.
                    </p>

                    <div className="explore-hero-actions">
                        <Link to="/plan-trip" className="explore-primary-button">
                            Start your journey <span aria-hidden="true">↗</span>
                        </Link>

                        <a href="#destinations" className="explore-text-link">
                            Discover destinations <span aria-hidden="true">↓</span>
                        </a>
                    </div>

                    <div className="explore-hero-note">
                        <span className="explore-live-dot" />
                        YOUR JOURNEY. YOUR WAY.
                    </div>
                </div>

                <div className="explore-hero-caption">
                    <span>01 / FIND YOUR ELSEWHERE</span>
                    <span>Somewhere beyond the ordinary</span>
                </div>

                <a
                    href="#travel-services"
                    className="explore-scroll-cue"
                    aria-label="Scroll to travel services"
                >
                    <span />
                </a>
            </section>

            <section
                className="explore-services"
                id="travel-services"
                aria-label="Explore travel services"
            >
                <div className="explore-services-intro">
                    <span className="explore-kicker">YOUR JOURNEY, SIMPLIFIED</span>
                    <h2>Where to next?</h2>
                </div>

                <div className="explore-services-grid">
                    {travelServices.map((service) => (
                        <Link
                            to={service.path}
                            className="explore-service"
                            key={service.label}
                        >
                            <span className="explore-service-icon" aria-hidden="true">
                                {service.icon}
                            </span>
                            <span className="explore-service-copy">
                                <strong>{service.label}</strong>
                                <small>{service.description}</small>
                            </span>
                            <span className="explore-service-arrow" aria-hidden="true">
                                ↗
                            </span>
                        </Link>
                    ))}
                </div>
            </section>

            <section className="explore-destinations" id="destinations">
                <div className="explore-section-heading">
                    <div>
                        <span className="explore-kicker">THE WORLD, CURATED</span>
                        <h2>
                            Places that
                            <br />
                            stay with you<span>.</span>
                        </h2>
                    </div>
                    <p>
                        From far-flung islands to mountain hideaways, discover
                        the places that make you want to pack your bags.
                    </p>
                </div>

                <div className="explore-destination-grid">
                    {destinations.map((destination, index) => (
                        <Link
                            to="/plan-trip"
                            className={`explore-destination-card ${destination.size}`}
                            key={destination.name}
                            aria-label={`Plan a trip to ${destination.name}, ${destination.country}`}
                        >
                            <img
                                src={destination.image}
                                alt={`${destination.name}, ${destination.country}`}
                                loading={index === 0 ? "eager" : "lazy"}
                            />
                            <span className="explore-destination-shade" />
                            <span className="explore-destination-index">
                                0{index + 1}
                            </span>

                            <span className="explore-destination-content">
                                <span className="explore-destination-category">
                                    {destination.category}
                                </span>
                                <strong className="explore-destination-name">
                                    {destination.name}
                                </strong>
                                <span className="explore-destination-country">
                                    {destination.country}
                                </span>
                                <span className="explore-destination-description">
                                    {destination.description}
                                </span>
                                <span className="explore-destination-footer">
                                    <span>{destination.duration}</span>
                                    <span className="explore-destination-cta">
                                        Explore <span aria-hidden="true">↗</span>
                                    </span>
                                </span>
                            </span>
                        </Link>
                    ))}
                </div>

                <p className="explore-destination-disclaimer">
                    Destination inspiration only. Choose a destination to start
                    creating your own itinerary.
                </p>
            </section>

            <section className="explore-ai-section" id="ai-planner">
                <div
                    className="explore-ai-orbit explore-ai-orbit-one"
                    aria-hidden="true"
                />
                <div
                    className="explore-ai-orbit explore-ai-orbit-two"
                    aria-hidden="true"
                />

                <div className="explore-ai-content">
                    <span className="explore-kicker">
                        <span className="explore-ai-sparkle">✦</span>
                        INTRODUCING YOUR TRAVEL CONCIERGE
                    </span>

                    <h2>
                        Big dreams.
                        <br />
                        <span>Beautifully planned.</span>
                    </h2>

                    <p>
                        Tell VOYAGO where you want to go, what inspires you,
                        and how you love to travel. Let AI help turn those
                        ideas into a journey shaped around you.
                    </p>

                    <div className="explore-ai-benefits">
                        <span><i>✓</i> Personalized day-by-day plans</span>
                        <span><i>✓</i> Ideas tailored to your interests</span>
                        <span><i>✓</i> Your trip, organized in one place</span>
                    </div>

                    <Link to="/plan-trip" className="explore-primary-button">
                        Create my itinerary <span aria-hidden="true">↗</span>
                    </Link>

                    <small className="explore-ai-footnote">
                        AI-generated suggestions may need verification before travel.
                    </small>
                </div>

                <div className="explore-ai-visual" aria-hidden="true">
                    <div className="explore-ai-glow" />
                    <div className="explore-ai-emblem">
                        <span className="explore-ai-emblem-ring">
                            <span className="explore-ai-emblem-star">✦</span>
                        </span>
                        <span className="explore-ai-emblem-label">VOYAGO AI</span>
                    </div>

                    <div className="explore-ai-floating explore-ai-floating-top">
                        <span>✧</span>
                        <div>
                            <small>YOUR NEXT ADVENTURE</small>
                            <strong>Made for you</strong>
                        </div>
                    </div>

                    <div className="explore-ai-floating explore-ai-floating-bottom">
                        <span>◎</span>
                        <div>
                            <small>TRAVEL STYLE</small>
                            <strong>Uniquely yours</strong>
                        </div>
                    </div>
                </div>
            </section>

            <section className="explore-why">
                <div className="explore-why-heading">
                    <span className="explore-kicker">A BETTER WAY TO GET AWAY</span>
                    <h2>
                        Less planning stress.
                        <br />
                        <span>More living the journey.</span>
                    </h2>
                </div>

                <div className="explore-features-grid">
                    {travelFeatures.map((feature, index) => (
                        <article className="explore-feature" key={feature.title}>
                            <div className="explore-feature-top">
                                <span className="explore-feature-icon" aria-hidden="true">
                                    {feature.icon}
                                </span>
                                <span className="explore-feature-number">
                                    0{index + 1}
                                </span>
                            </div>
                            <h3>{feature.title}</h3>
                            <p>{feature.description}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="explore-final-cta">
                <div className="explore-final-cta-image" aria-hidden="true" />
                <div className="explore-final-cta-content">
                    <span className="explore-kicker">YOUR NEXT CHAPTER AWAITS</span>
                    <h2>
                        Somewhere is
                        <br />
                        calling <span>you.</span>
                    </h2>
                    <p>
                        Your next favorite place is out there. Let’s make
                        getting there part of the adventure.
                    </p>

                    <div className="explore-hero-actions">
                        <Link to="/plan-trip" className="explore-primary-button">
                            Plan my trip <span aria-hidden="true">↗</span>
                        </Link>

                        {loggedIn ? (
                            <Link to="/dashboard" className="explore-secondary-button">
                                My travel space
                            </Link>
                        ) : (
                            <Link to="/register" className="explore-secondary-button">
                                Create an account
                            </Link>
                        )}
                    </div>

                    {!loggedIn && (
                        <p className="explore-login-prompt">
                            Already have an account? <Link to="/login">Sign in</Link>
                        </p>
                    )}

                    {loggedIn && user?.name && (
                        <p className="explore-login-prompt">
                            Welcome to your next adventure, {user.name}.
                        </p>
                    )}
                </div>
            </section>
        </main>
    );
}

export default Home;

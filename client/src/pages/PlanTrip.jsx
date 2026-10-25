import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    ArrowRight,
    CalendarDays,
    Check,
    Compass,
    Landmark,
    MapPin,
    Mountain,
    Moon,
    PlaneTakeoff,
    Plus,
    Minus,
    ShoppingBag,
    Sparkles,
    Trees,
    Utensils,
    Users,
    Wallet,
    Waves,
    LoaderCircle,
} from "lucide-react";
import { createTrip } from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./PlanTrip.css";

function getToday() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

const INTERESTS = [
    { name: "Adventure", description: "Get your adrenaline going", Icon: Mountain },
    { name: "Beaches", description: "Slow days by the sea", Icon: Waves },
    { name: "Culture", description: "Local life and traditions", Icon: Landmark },
    { name: "Food", description: "Taste something memorable", Icon: Utensils },
    { name: "History", description: "Stories from the past", Icon: Compass },
    { name: "Nature", description: "Find your outdoor escape", Icon: Trees },
    { name: "Nightlife", description: "See the city after dark", Icon: Moon },
    { name: "Shopping", description: "Markets and local finds", Icon: ShoppingBag },
];

const BUDGETS = [
    { value: "budget", name: "Budget", amount: "Keep it easy", detail: "Smart stays & local gems" },
    { value: "moderate", name: "Moderate", amount: "A little of everything", detail: "Comfort with a few splurges", popular: true },
    { value: "luxury", name: "Luxury", amount: "Make it exceptional", detail: "Premium stays & experiences" },
];

function PlanTrip() {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [formData, setFormData] = useState({
        destination: "",
        startDate: "",
        endDate: "",
        travelers: 1,
        budget: "moderate",
        interests: [],
    });
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("error");
    const [loading, setLoading] = useState(false);
    const today = getToday();

    const tripLength = useMemo(() => {
        if (!formData.startDate || !formData.endDate || formData.endDate < formData.startDate) return 0;
        const start = new Date(`${formData.startDate}T00:00:00`);
        const end = new Date(`${formData.endDate}T00:00:00`);
        return Math.round((end - start) / 86400000) + 1;
    }, [formData.startDate, formData.endDate]);

    const updateField = (name, value) => {
        setFormData((previous) => ({ ...previous, [name]: value }));
        if (message) setMessage("");
    };

    const handleChange = (event) => updateField(event.target.name, event.target.value);

    const toggleInterest = (interest) => {
        setFormData((previous) => ({
            ...previous,
            interests: previous.interests.includes(interest)
                ? previous.interests.filter((item) => item !== interest)
                : [...previous.interests, interest],
        }));
        if (message) setMessage("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage("");

        if (!token) {
            setMessageType("error");
            setMessage("Please sign in before creating a trip.");
            return;
        }
        const destination = formData.destination.trim();
        const travelers = Number(formData.travelers);

        if (!destination) {
            setMessageType("error");
            setMessage("Add a destination to start planning your trip.");
            return;
        }
        if (!formData.startDate || !formData.endDate || formData.endDate < formData.startDate) {
            setMessageType("error");
            setMessage("Choose a valid start and end date for your trip.");
            return;
        }
        if (formData.startDate < today) {
            setMessageType("error");
            setMessage("Your trip start date cannot be in the past.");
            return;
        }
        if (!Number.isInteger(travelers) || travelers < 1 || travelers > 20) {
            setMessageType("error");
            setMessage("Choose between 1 and 20 travelers.");
            return;
        }
        if (!formData.budget) {
            setMessageType("error");
            setMessage("Choose the travel style that suits you.");
            return;
        }

        setLoading(true);
        try {
            await createTrip({ ...formData, destination, travelers }, token);
            setMessageType("success");
            setMessage("Your trip is ready! Taking you to your dashboard…");
            window.setTimeout(() => navigate("/dashboard", { replace: true }), 800);
        } catch (error) {
            setMessageType("error");
            setMessage(error?.message || "We couldn't create your trip. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="plan-page">
            <div className="plan-shell">
                <button className="plan-back" type="button" onClick={() => navigate("/dashboard")}>
                    <ArrowLeft size={17} aria-hidden="true" />
                    <span>Back to dashboard</span>
                </button>

                <section className="plan-hero" aria-labelledby="plan-title">
                    <div className="plan-hero-copy">
                        <div className="plan-eyebrow"><span className="eyebrow-sparkle"><Sparkles size={14} /></span> YOUR NEXT CHAPTER STARTS HERE</div>
                        <h1 id="plan-title">Let’s make your<br /><em>next trip</em> unforgettable.</h1>
                        <p>A few little details. A world of possibilities. Tell us what you’re dreaming of and we’ll help you shape the journey.</p>
                        <div className="plan-hero-note"><span className="plan-note-icon"><Compass size={18} /></span><span><strong>Your trip, your way.</strong><small>Build around your dates, pace, and passions.</small></span></div>
                    </div>
                    <div className="plan-hero-art" aria-hidden="true">
                        <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
                        <div className="hero-glow" />
                        <div className="hero-art-card">
                            <div className="art-card-top"><span className="art-live-dot" /> THE WORLD IS YOURS</div>
                            <div className="art-globe"><Compass size={90} strokeWidth={0.8} /></div>
                            <div className="art-route"><span /><span /><span /></div>
                            <div className="art-card-bottom"><PlaneTakeoff size={18} /><span>Somewhere wonderful awaits.</span></div>
                        </div>
                        <div className="floating-chip chip-top"><Sparkles size={14} /> Made for you</div>
                        <div className="floating-chip chip-bottom"><MapPin size={15} /> New memories ahead</div>
                    </div>
                </section>

                <div className="plan-workspace">
                    <div className="plan-form-heading">
                        <div><span className="section-kicker">THE DETAILS</span><h2>Plan your escape</h2><p>There’s no wrong way to travel. Start with the basics.</p></div>
                        <div className="step-pill"><span>01</span> TRIP BASICS</div>
                    </div>

                    <form className="trip-form" onSubmit={handleSubmit}>
                        <section className="form-section destination-section">
                            <div className="section-icon"><MapPin size={20} /></div>
                            <div className="section-content">
                                <div className="section-title-row"><div><h3>Where are you going?</h3><p>Pick the place that’s calling your name.</p></div><span className="field-number">01</span></div>
                                <label htmlFor="trip-destination">Destination</label>
                                <div className="input-with-icon"><MapPin size={18} aria-hidden="true" /><input id="trip-destination" type="text" name="destination" value={formData.destination} onChange={handleChange} placeholder="e.g. Goa, India or Kyoto, Japan" maxLength={150} autoComplete="off" required /></div>
                                <div className="field-hint">A city, region, or country — wherever you want to go.</div>
                            </div>
                        </section>

                        <section className="form-section">
                            <div className="section-icon"><CalendarDays size={20} /></div>
                            <div className="section-content">
                                <div className="section-title-row"><div><h3>When are you travelling?</h3><p>Every great adventure starts with a date.</p></div><span className="field-number">02</span></div>
                                <div className="date-grid">
                                    <div className="field-group"><label htmlFor="trip-start-date">Start date</label><input id="trip-start-date" type="date" name="startDate" value={formData.startDate} min={today} onChange={handleChange} required /></div>
                                    <div className="field-group"><label htmlFor="trip-end-date">End date</label><input id="trip-end-date" type="date" name="endDate" value={formData.endDate} min={formData.startDate || today} onChange={handleChange} required /></div>
                                </div>
                                <div className={`trip-duration${tripLength ? " has-duration" : ""}`}><CalendarDays size={15} />{tripLength ? `${tripLength} ${tripLength === 1 ? "day" : "days"} planned` : "Your dates will appear here"}</div>
                            </div>
                        </section>

                        <section className="form-section">
                            <div className="section-icon"><Users size={20} /></div>
                            <div className="section-content">
                                <div className="section-title-row"><div><h3>Who’s coming along?</h3><p>Good company makes a great trip.</p></div><span className="field-number">03</span></div>
                                <div className="traveller-control-wrap"><div><label htmlFor="trip-travelers">Number of travelers</label><small>Including you</small></div><div className="traveller-control"><button type="button" aria-label="Remove one traveler" disabled={Number(formData.travelers) <= 1} onClick={() => updateField("travelers", Math.max(1, Number(formData.travelers) - 1))}><Minus size={16} /></button><input id="trip-travelers" type="number" name="travelers" min="1" max="20" step="1" value={formData.travelers} onChange={handleChange} required /><button type="button" aria-label="Add one traveler" disabled={Number(formData.travelers) >= 20} onClick={() => updateField("travelers", Math.min(20, Number(formData.travelers) + 1))}><Plus size={16} /></button></div></div>
                            </div>
                        </section>

                        <section className="form-section">
                            <div className="section-icon"><Wallet size={20} /></div>
                            <div className="section-content">
                                <div className="section-title-row"><div><h3>What’s your travel style?</h3><p>Choose the budget that feels right for you.</p></div><span className="field-number">04</span></div>
                                <div className="budget-grid" role="radiogroup" aria-label="Travel budget">
                                    {BUDGETS.map((budget) => <button key={budget.value} type="button" role="radio" aria-checked={formData.budget === budget.value} className={`budget-card${formData.budget === budget.value ? " is-selected" : ""}`} onClick={() => updateField("budget", budget.value)}>
                                        {budget.popular && <span className="budget-popular">MOST POPULAR</span>}
                                        <span className="budget-card-top"><span className="budget-radio">{formData.budget === budget.value && <span />}</span><strong>{budget.name}</strong>{formData.budget === budget.value && <Check className="budget-check" size={17} />}</span>
                                        <span className="budget-amount">{budget.amount}</span><span className="budget-detail">{budget.detail}</span>
                                    </button>)}
                                </div>
                            </div>
                        </section>

                        <section className="form-section interests-section">
                            <div className="section-icon"><Sparkles size={20} /></div>
                            <div className="section-content">
                                <div className="section-title-row"><div><h3>What are you into?</h3><p>Choose the experiences that make a trip feel like yours.</p></div><span className="field-number">05</span></div>
                                <div className="interest-count">{formData.interests.length ? `${formData.interests.length} selected` : "PICK AS MANY AS YOU LIKE"}</div>
                                <div className="interests-grid">
                                    {INTERESTS.map(({ name, description, Icon }) => {
                                        const selected = formData.interests.includes(name);
                                        return <button type="button" key={name} className={`interest-card${selected ? " selected" : ""}`} aria-pressed={selected} onClick={() => toggleInterest(name)}>
                                            <span className="interest-icon"><Icon size={19} /></span><span className="interest-copy"><strong>{name}</strong><small>{description}</small></span><span className="interest-check">{selected && <Check size={14} />}</span>
                                        </button>;
                                    })}
                                </div>
                            </div>
                        </section>

                        {message && <div className={`plan-message ${messageType}`} role={messageType === "error" ? "alert" : "status"}>{messageType === "success" ? <Check size={18} /> : <Sparkles size={18} />}{message}</div>}

                        <div className="plan-submit-area"><div className="submit-reassurance"><span className="submit-icon"><Sparkles size={17} /></span><span><strong>Ready when you are</strong><small>You can fine-tune the details as you go.</small></span></div><button className="generate-button" type="submit" disabled={loading}>{loading ? <><LoaderCircle className="button-spinner" size={19} /> Creating your trip…</> : <>Create my trip <ArrowRight size={19} /></>}</button></div>
                    </form>
                </div>
                <footer className="plan-footer"><span>VOYAGO</span><span>Go where you feel most alive.</span><span><Sparkles size={13} /> Made for curious souls</span></footer>
            </div>
        </main>
    );
}

export default PlanTrip;

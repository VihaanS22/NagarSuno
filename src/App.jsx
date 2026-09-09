import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  Camera,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Construction,
  Droplets,
  Home,
  ImagePlus,
  Lightbulb,
  MapPin,
  Plus,
  ShieldCheck,
  Trash2,
  Upload,
  X,
  LockKeyhole,
LogOut,
} from "lucide-react";

import "./index.css";

import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { auth, db } from "./firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

const ISSUE_CATEGORIES = [
  { id: "road", label: "Road damage", icon: Construction },
  { id: "garbage", label: "Garbage", icon: Trash2 },
  { id: "water", label: "Water / drainage", icon: Droplets },
  { id: "streetlight", label: "Streetlight", icon: Lightbulb },
  { id: "other", label: "Other", icon: AlertTriangle },
];

const STATUS_OPTIONS = [
  "Submitted",
  "Assigned",
  "In Progress",
  "Resolved",
];

const CITIES = [
  "Bengaluru",
  "Mumbai",
  "Delhi",
  "Kolkata",
  "Hyderabad",
  "Chennai",
  "Pune",
  "Ahmedabad",
  "Jaipur",
  "Lucknow",
  "Chandigarh",
  "Bhopal",
  "Patna",
  "Kochi",
  "Guwahati",
];

function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [issues, setIssues] = useState([]);
  const [authorityUser, setAuthorityUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [selectedCity, setSelectedCity] = useState(() =>
    localStorage.getItem("nagarsuno-city") || "Bengaluru"
  );

  useEffect(() => {
    const complaintsQuery = query(
      collection(db, "complaints"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      complaintsQuery,
      (snapshot) => {
        const complaintData = snapshot.docs.map((document) => {
          const data = document.data();

          const createdAtDate = data.createdAt?.toDate
            ? data.createdAt.toDate()
            : null;

          return {
            firestoreId: document.id,
            ...data,
            createdAtDate,
            createdAt: createdAtDate
              ? new Intl.DateTimeFormat("en-IN", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(createdAtDate)
              : "Just now",
          };
        });

        setIssues(complaintData);
      },
      (error) => {
        console.error("Error loading complaints:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthorityUser(user);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem("nagarsuno-city", selectedCity);
  }, [selectedCity]);

  const tabs = [
    { id: "home", label: "Home", icon: Home },
    { id: "report", label: "Report", icon: Plus },
    { id: "registered", label: "Registered", icon: ClipboardList },
    { id: "resolved", label: "Resolved", icon: CheckCircle2 },
    { id: "admin", label: "Authority", icon: ShieldCheck },
  ];

  const cityIssues = useMemo(
    () =>
      issues.filter((issue) => {
        const issueCity = issue.city || "Bengaluru";
        return issueCity === selectedCity;
      }),
    [issues, selectedCity]
  );

  const registeredIssues = useMemo(
    () => cityIssues.filter((issue) => issue.status !== "Resolved"),
    [cityIssues]
  );

  const resolvedIssues = useMemo(
    () => cityIssues.filter((issue) => issue.status === "Resolved"),
    [cityIssues]
  );

  const issuesThisMonth = useMemo(() => {
    const now = new Date();

    return cityIssues.filter((issue) => {
      if (!issue.createdAtDate) return false;

      return (
        issue.createdAtDate.getMonth() === now.getMonth() &&
        issue.createdAtDate.getFullYear() === now.getFullYear()
      );
    }).length;
  }, [cityIssues]);

  const resolvedCount = resolvedIssues.length;

  const navigate = (tab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="app">
      <main className="main-content">
        {activeTab === "home" && (
          <HomePage
            onReport={() => navigate("report")}
            issuesThisMonth={issuesThisMonth}
            resolvedCount={resolvedCount}
            selectedCity={selectedCity}
          />
        )}

        {activeTab === "report" && (
          <ReportPage
            onBack={() => navigate("home")}
            onSubmitted={() => navigate("registered")}
            selectedCity={selectedCity}
          />
        )}

        {activeTab === "detail" && selectedIssue && (
          <IssueDetailPage
            issue={
              issues.find(
                (issue) => issue.firestoreId === selectedIssue.firestoreId
              ) || selectedIssue
            }
            onBack={() =>
              navigate(
                selectedIssue.status === "Resolved" ? "resolved" : "registered"
              )
            }
          />
        )}

        {activeTab === "registered" && (
          <IssueListPage
            eyebrow="OPEN COMPLAINTS"
            title="Registered issues."
            description="Every report stays visible here while the city works on it."
            issues={registeredIssues}
            emptyTitle="No open complaints yet."
            emptyText="Report an issue and it will appear here with its tracking ID."
            onReport={() => navigate("report")}
            onOpenIssue={(issue) => {
              setSelectedIssue(issue);
              navigate("detail");
            }}
          />
        )}

        {activeTab === "resolved" && (
          <IssueListPage
            eyebrow="COMPLETED"
            title="Resolved issues."
            description="A record of problems that have been fixed and closed."
            issues={resolvedIssues}
            emptyTitle="Nothing resolved yet."
            emptyText="Resolved complaints will appear here automatically."
            onReport={() => navigate("report")}
            onOpenIssue={(issue) => {
              setSelectedIssue(issue);
              navigate("detail");
            }}
          />
        )}

        {activeTab === "admin" && (
          authLoading ? (
            <section className="page-shell">
              <div className="auth-loading">Checking authority access...</div>
            </section>
          ) : authorityUser ? (
            <AuthorityPage
              issues={issues}
              user={authorityUser}
              onLogout={async () => {
                await signOut(auth);
                navigate("home");
              }}
            />
          ) : (
            <AuthorityLogin />
          )
        )}
      </main>

      <BottomNav
        tabs={tabs}
        activeTab={activeTab}
        onNavigate={navigate}
        selectedCity={selectedCity}
        onCityChange={setSelectedCity}
      />
    </div>
  );
}

function HomePage({
  onReport,
  issuesThisMonth,
  resolvedCount,
  selectedCity,
}) {
  return (
    <>
      <section className="hero">
        <div className="hero-text">
          <p className="eyebrow">
            YOUR CITY. YOUR VOICE.
          </p>

          <h1>
            Fix what
            <br />
            <span>matters.</span>
          </h1>

          <p className="hero-description">
            See something that needs attention?
            Report it. Track it. Help make your
            neighbourhood better.
          </p>

          <button
            className="primary-button"
            onClick={onReport}
          >
            Report an issue
            <ArrowUpRight size={19} />
          </button>
        </div>

        <div className="hero-mark">
          <div className="wheel">
            <div className="wheel-inner">
              NS
            </div>
          </div>

          <p>NAGARSUNO</p>
        </div>
      </section>

      <section className="stats">
        <div className="stat">
          <span>01</span>
          <strong>Report</strong>
          <p>Tell us what needs fixing.</p>
        </div>

        <div className="stat">
          <span>02</span>
          <strong>Track</strong>
          <p>Follow your complaint.</p>
        </div>

        <div className="stat">
          <span>03</span>
          <strong>Resolve</strong>
          <p>See your city improve.</p>
        </div>
      </section>

      <section className="status-section">
        <div>
          <p className="eyebrow">
            CITY STATUS
          </p>

          <h2>
            What's happening in {selectedCity}.
          </h2>
        </div>

        <div className="status-card">
          <div className="status-icon">
            <AlertTriangle size={22} />
          </div>

          <div>
            <strong>Issues reported</strong>

            <p>
              {issuesThisMonth}{" "}
              {issuesThisMonth === 1
                ? "complaint"
                : "complaints"}{" "}
              this month
            </p>
          </div>

          <span className="status-number">
            {issuesThisMonth}
          </span>
        </div>

        <div className="status-card">
          <div className="status-icon resolved">
            <CheckCircle2 size={22} />
          </div>

          <div>
            <strong>Issues resolved</strong>

            <p>
              {resolvedCount}{" "}
              {resolvedCount === 1
                ? "problem fixed"
                : "problems fixed"}
            </p>
          </div>

          <span className="status-number">
            {resolvedCount}
          </span>
        </div>
      </section>

      <section className="location-section">
        <MapPin size={20} />

        <div>
          <p className="eyebrow">
            YOUR AREA
          </p>

          <h3>
            Find problems in {selectedCity}. Make a difference.
          </h3>
        </div>
      </section>
    </>
  );
}

function ReportPage({
  onBack,
  onSubmitted,
  selectedCity,
}) {
  const [category, setCategory] =
    useState("");

  const [description, setDescription] =
    useState("");


  const [location, setLocation] =
    useState("");

  const [landmark, setLandmark] =
    useState("");

  const [image, setImage] =
    useState(null);

  const [imageName, setImageName] =
    useState("");

  const [errors, setErrors] =
    useState({});

  const [submitting, setSubmitting] =
    useState(false);

  const handleImage = (event) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    setImageName(file.name);

    const reader = new FileReader();

    reader.onload = () =>
      setImage(reader.result);

    reader.readAsDataURL(file);
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    const nextErrors = {};

    if (!category) {
      nextErrors.category =
        "Choose an issue category.";
    }

    if (
      description.trim().length < 12
    ) {
      nextErrors.description =
        "Add a little more detail so the issue can be understood.";
    }

    if (!location.trim()) {
      nextErrors.location =
        "Add the location of the issue.";
    }

    setErrors(nextErrors);

    if (
      Object.keys(nextErrors).length
    ) {
      return;
    }

    const categoryLabel =
      ISSUE_CATEGORIES.find(
        (item) =>
          item.id === category
      )?.label || "Other";

    const ticket = `NS-${Math.floor(
      10000 +
        Math.random() * 89999
    )}`;

    const issueData = {
      id: ticket,

      category: categoryLabel,

      description:
        description.trim(),

      city: selectedCity,

      location: landmark.trim()
        ? `${location.trim()} · ${landmark.trim()}`
        : location.trim(),

      landmark: landmark.trim(),

      status: "Submitted",

      createdAt:
        serverTimestamp(),

      updatedAt:
        serverTimestamp(),
    };

    try {
      setSubmitting(true);

      await addDoc(
        collection(
          db,
          "complaints"
        ),
        issueData
      );

      onSubmitted();
    } catch (error) {
      console.error(
        "Error submitting complaint:",
        error
      );

      alert(
        "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="page-shell report-page">
      <button
        className="text-button"
        onClick={onBack}
      >
        <ArrowLeft size={17} />
        Back home
      </button>

      <div className="page-heading">
        <p className="eyebrow">
          REPORT AN ISSUE
        </p>

        <h2>
          Tell us what needs{" "}
          <span>fixing.</span>
        </h2>

        <p>
          Give the city enough
          information to locate,
          understand and act on the
          problem.
        </p>
      </div>

      <form
        className="report-form"
        onSubmit={handleSubmit}
      >
        <div className="form-section">
          <div className="form-step">
            <span>01</span>

            <div>
              <h3>
                What happened?
              </h3>

              <p>
                Select the closest
                category.
              </p>
            </div>
          </div>

          <div className="form-controls">
            <div className="category-grid">
              {ISSUE_CATEGORIES.map(
                ({
                  id,
                  label,
                  icon: Icon,
                }) => (
                  <button
                    key={id}
                    type="button"
                    className={`category-card ${
                      category === id
                        ? "selected"
                        : ""
                    }`}
                    onClick={() => {
                      setCategory(id);

                      setErrors(
                        (old) => ({
                          ...old,
                          category: "",
                        })
                      );
                    }}
                  >
                    <Icon size={22} />

                    <span>
                      {label}
                    </span>

                    {category ===
                      id && (
                      <CheckCircle2
                        size={17}
                        className="category-check"
                      />
                    )}
                  </button>
                )
              )}
            </div>

            {errors.category && (
              <p className="field-error">
                {errors.category}
              </p>
            )}
          </div>
        </div>

        <div className="form-section">
          <div className="form-step">
            <span>02</span>

            <div>
              <h3>
                Describe the problem.
              </h3>

              <p>
                Be specific, but keep
                it simple.
              </p>
            </div>
          </div>

          <div className="form-controls">
            <label
              className="field-label"
              htmlFor="description"
            >
              Issue description
            </label>

            <textarea
              id="description"
              value={description}
              onChange={(event) => {
                setDescription(
                  event.target.value
                );

                setErrors(
                  (old) => ({
                    ...old,
                    description: "",
                  })
                );
              }}
              placeholder="Example: A deep pothole has formed near the bus stop..."
              maxLength={500}
            />

            <div className="field-meta">
              <span>
                {errors.description ||
                  "Include size, severity or how long it has been there."}
              </span>

              <span>
                {description.length}
                /500
              </span>
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-step">
            <span>03</span>

            <div>
              <h3>Where is it?</h3>

              <p>
                Help the team find
                the exact spot.
              </p>
            </div>
          </div>

          <div className="form-controls">
            <div style={{ marginBottom: "18px" }}>
              <label className="field-label">City</label>
              <div
                style={{
                  marginTop: "8px",
                  padding: "14px 16px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255, 255, 255, 0.18)",
                  background: "#241b16",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <MapPin size={17} />
                <strong>{selectedCity}</strong>
              </div>
            </div>

            <div className="field-grid">
              <div>
                <label
                  className="field-label"
                  htmlFor="location"
                >
                  Area / address
                </label>

                <div className="input-with-icon">
                  <MapPin size={18} />

                  <input
                    id="location"
                    value={location}
                    onChange={(
                      event
                    ) => {
                      setLocation(
                        event.target
                          .value
                      );

                      setErrors(
                        (old) => ({
                          ...old,
                          location: "",
                        })
                      );
                    }}
                    placeholder={`Area / address in ${selectedCity}`}
                  />
                </div>

                {errors.location && (
                  <p className="field-error">
                    {
                      errors.location
                    }
                  </p>
                )}
              </div>

              <div>
                <label
                  className="field-label"
                  htmlFor="landmark"
                >
                  Nearby landmark{" "}
                  <span>
                    optional
                  </span>
                </label>

                <input
                  id="landmark"
                  value={landmark}
                  onChange={(
                    event
                  ) =>
                    setLandmark(
                      event.target
                        .value
                    )
                  }
                  placeholder="Near Metro Gate 2"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-step">
            <span>04</span>

            <div>
              <h3>Add a photo.</h3>

              <p>
                Optional, but useful
                for faster
                verification.
              </p>
            </div>
          </div>

          <div className="form-controls">
            {!image ? (
              <label className="upload-box">
                <input
                  type="file"
                  accept="image/*"
                  onChange={
                    handleImage
                  }
                />

                <div className="upload-icon">
                  <ImagePlus
                    size={23}
                  />
                </div>

                <strong>
                  Upload a photo
                </strong>

                <span>
                  JPG, PNG or WEBP
                </span>

                <div className="upload-action">
                  <Upload
                    size={16}
                  />
                  Choose file
                </div>
              </label>
            ) : (
              <div className="image-preview">
                <img
                  src={image}
                  alt="Issue preview"
                />

                <div>
                  <Camera
                    size={18}
                  />

                  <span>
                    {imageName}
                  </span>
                </div>

                <button
                  type="button"
                  aria-label="Remove image"
                  onClick={() => {
                    setImage(null);

                    setImageName(
                      ""
                    );
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="submit-panel">
          <div>
            <p className="eyebrow">
              READY TO SEND?
            </p>

            <h3>
              Your report will get a
              unique tracking ID.
            </h3>
          </div>

          <button
            className="primary-button submit-button"
            type="submit"
            disabled={submitting}
          >
            {submitting
              ? "Submitting..."
              : "Submit report"}

            {!submitting && (
              <ArrowUpRight
                size={19}
              />
            )}
          </button>
        </div>
      </form>
    </section>
  );
}

function IssueListPage({
  eyebrow,
  title,
  description,
  issues,
  emptyTitle,
  emptyText,
  onReport,
  onOpenIssue,
}) {
  return (
    <section className="page-shell issues-page">
      <div className="page-heading compact-heading">
        <p className="eyebrow">
          {eyebrow}
        </p>

        <h2>{title}</h2>

        <p>{description}</p>
      </div>

      {issues.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <ClipboardList
              size={25}
            />
          </div>

          <h3>{emptyTitle}</h3>

          <p>{emptyText}</p>

          <button
            className="primary-button"
            onClick={onReport}
          >
            Report an issue
            <ArrowUpRight
              size={18}
            />
          </button>
        </div>
      ) : (
        <div className="issue-list">
          {issues.map(
            (issue) => (
              <article
                className="issue-card"
                key={
                  issue.firestoreId ||
                  issue.id
                }
                role="button"
                tabIndex={0}
                onClick={() => onOpenIssue?.(issue)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onOpenIssue?.(issue);
                  }
                }}
                style={{ cursor: "pointer" }}
              >
                {issue.image && (
                  <img
                    className="issue-thumb"
                    src={issue.image}
                    alt="Reported issue"
                  />
                )}

                <div className="issue-main">
                  <div className="issue-topline">
                    <span className="issue-id">
                      {issue.id}
                    </span>

                    <StatusPill
                      status={
                        issue.status ||
                        "Submitted"
                      }
                    />
                  </div>

                  <h3>
                    {issue.category}
                  </h3>

                  <p>
                    {
                      issue.description
                    }
                  </p>

                  <div className="issue-meta">
                    <span>
                      <MapPin
                        size={14}
                      />

                      {issue.city
                        ? `${issue.city} · ${issue.location}`
                        : issue.location}
                    </span>

                    <span>
                      {
                        issue.createdAt
                      }
                    </span>
                  </div>
                </div>

                <ChevronRight
                  size={20}
                  className="issue-arrow"
                />
              </article>
            )
          )}
        </div>
      )}
    </section>
  );
}


function IssueDetailPage({ issue, onBack }) {
  const statusSteps = ["Submitted", "Assigned", "In Progress", "Resolved"];
  const currentStatus = issue.status || "Submitted";
  const currentStep = Math.max(statusSteps.indexOf(currentStatus), 0);

  return (
    <section className="page-shell issues-page">
      <button className="text-button" onClick={onBack}>
        <ArrowLeft size={17} />
        Back to complaints
      </button>

      <div className="page-heading compact-heading">
        <p className="eyebrow">TRACK COMPLAINT</p>
        <h2>{issue.id}</h2>
        <p>Follow the current progress of this civic issue.</p>
      </div>

      <article
        className="issue-card"
        style={{
          display: "block",
          cursor: "default",
          padding: "28px",
          marginBottom: "24px",
        }}
      >
        <div className="issue-topline">
          <span className="issue-id">{issue.id}</span>
          <StatusPill status={currentStatus} />
        </div>

        <h3 style={{ marginTop: "18px" }}>{issue.category}</h3>
        <p>{issue.description}</p>

        <div
          className="issue-meta"
          style={{
            marginTop: "18px",
            display: "flex",
            gap: "18px",
            flexWrap: "wrap",
          }}
        >
          <span>
            <MapPin size={14} />
            {issue.city ? `${issue.city} · ${issue.location}` : issue.location}
          </span>
          <span>Reported {issue.createdAt}</span>
        </div>
      </article>

      <div
        style={{
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "18px",
          padding: "26px",
        }}
      >
        <p className="eyebrow">PROGRESS</p>
        <h3 style={{ marginBottom: "24px" }}>Complaint status</h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: "12px",
          }}
        >
          {statusSteps.map((status, index) => {
            const completed = index <= currentStep;

            return (
              <div
                key={status}
                style={{
                  padding: "16px 12px",
                  borderRadius: "12px",
                  border: completed
                    ? "1px solid currentColor"
                    : "1px solid rgba(255, 255, 255, 0.12)",
                  opacity: completed ? 1 : 0.45,
                  textAlign: "center",
                }}
              >
                <CheckCircle2 size={18} style={{ marginBottom: "8px" }} />
                <strong style={{ display: "block", fontSize: "13px" }}>
                  {status}
                </strong>
              </div>
            );
          })}
        </div>

        <p style={{ marginTop: "20px", opacity: 0.7 }}>
          Current status: <strong>{currentStatus}</strong>
        </p>
      </div>
    </section>
  );
}

function AuthorityLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError("Enter your authority email and password.");
      return;
    }

    try {
      setLoggingIn(true);
      setError("");

      await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
    } catch (error) {
      console.error("Authority login failed:", error);
      setError("Unable to sign in. Check your email and password.");
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <section className="page-shell authority-login-page">
      <div className="authority-login-card">
        <div className="authority-login-icon">
          <LockKeyhole size={28} />
        </div>

        <p className="eyebrow">RESTRICTED ACCESS</p>

        <h2>
          Authority <span>login.</span>
        </h2>

        <p className="authority-login-description">
          Sign in with an authorised NagarSuno account to review complaints
          and update their progress.
        </p>

        <div className="demo-access-box">
          <strong>Demo Access</strong>

          <p>
            The dedicated NagarSuno Authority Portal is currently under
            development. For demonstration and testing purposes, please use
            the temporary credentials below.
          </p>

          <div className="demo-credentials">
            <span>
              Email: <strong>head@cf.com</strong>
            </span>

            <span>
              Password: <strong>admin1</strong>
            </span>
          </div>
        </div>

        <form className="authority-login-form" onSubmit={handleLogin}>
          <div>
            <label className="field-label" htmlFor="authority-email">
              Email address
            </label>

            <input
              id="authority-email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError("");
              }}
              placeholder="head@cf.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="field-label" htmlFor="authority-password">
              Password
            </label>

            <input
              id="authority-password"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </div>

          {error && <p className="field-error">{error}</p>}

          <button
            className="primary-button authority-login-button"
            type="submit"
            disabled={loggingIn}
          >
            {loggingIn ? "Signing in..." : "Sign in to Authority"}
            {!loggingIn && <ArrowUpRight size={18} />}
          </button>
        </form>
      </div>
    </section>
  );
}

/* AUTHORITY DASHBOARD */

function AuthorityPage({ issues, user, onLogout }) {
  const [updatingId, setUpdatingId] =
    useState(null);

  const changeStatus = async (
    issue,
    newStatus
  ) => {
    if (
      !issue.firestoreId ||
      issue.status === newStatus
    ) {
      return;
    }

    try {
      setUpdatingId(
        issue.firestoreId
      );

      const complaintRef = doc(
        db,
        "complaints",
        issue.firestoreId
      );

      await updateDoc(
        complaintRef,
        {
          status: newStatus,
          updatedAt:
            serverTimestamp(),
        }
      );
    } catch (error) {
      console.error(
        "Error updating status:",
        error
      );

      alert(
        "Could not update complaint status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <section className="page-shell issues-page">
      <div className="authority-user-bar">
        <div>
          <ShieldCheck size={18} />
          <span>
            Signed in as <strong>{user.email}</strong>
          </span>
        </div>

        <button className="text-button" onClick={onLogout}>
          <LogOut size={16} />
          Log out
        </button>
      </div>
      <div className="page-heading compact-heading">
        <p className="eyebrow">
          AUTHORITY PORTAL
        </p>

        <h2>
          Complaint management.
        </h2>

        <p>
          Review civic reports and
          update their progress.
        </p>
      </div>

      <div className="authority-summary">
        <div>
          <span>
            {issues.length}
          </span>

          <p>
            Total complaints
          </p>
        </div>

        <div>
          <span>
            {
              issues.filter(
                (issue) =>
                  issue.status ===
                  "Submitted"
              ).length
            }
          </span>

          <p>New</p>
        </div>

        <div>
          <span>
            {
              issues.filter(
                (issue) =>
                  issue.status ===
                  "In Progress"
              ).length
            }
          </span>

          <p>In progress</p>
        </div>

        <div>
          <span>
            {
              issues.filter(
                (issue) =>
                  issue.status ===
                  "Resolved"
              ).length
            }
          </span>

          <p>Resolved</p>
        </div>
      </div>

      {issues.length === 0 ? (
        <div className="empty-state">
          <ShieldCheck
            size={28}
          />

          <h3>
            No complaints yet.
          </h3>

          <p>
            Submitted reports will
            appear here.
          </p>
        </div>
      ) : (
        <div className="authority-list">
          {issues.map(
            (issue) => (
              <article
                className="authority-card"
                key={
                  issue.firestoreId
                }
              >
                <div className="authority-card-main">
                  <div className="issue-topline">
                    <span className="issue-id">
                      {issue.id}
                    </span>

                    <StatusPill
                      status={
                        issue.status ||
                        "Submitted"
                      }
                    />
                  </div>

                  <h3>
                    {issue.category}
                  </h3>

                  <p>
                    {
                      issue.description
                    }
                  </p>

                  <div className="issue-meta">
                    <span>
                      <MapPin
                        size={14}
                      />

                      {issue.city
                        ? `${issue.city} · ${issue.location}`
                        : issue.location}
                    </span>

                    <span>
                      {
                        issue.createdAt
                      }
                    </span>
                  </div>
                </div>

                <div className="authority-control">
                  <label>
                    Status
                  </label>

                  <select
                    value={
                      issue.status ||
                      "Submitted"
                    }
                    disabled={
                      updatingId ===
                      issue.firestoreId
                    }
                    onChange={(
                      event
                    ) =>
                      changeStatus(
                        issue,
                        event.target
                          .value
                      )
                    }
                  >
                    {STATUS_OPTIONS.map(
                      (status) => (
                        <option
                          key={
                            status
                          }
                          value={
                            status
                          }
                        >
                          {
                            status
                          }
                        </option>
                      )
                    )}
                  </select>

                  {updatingId ===
                    issue.firestoreId && (
                    <small>
                      Updating...
                    </small>
                  )}
                </div>
              </article>
            )
          )}
        </div>
      )}
    </section>
  );
}

function StatusPill({ status }) {
  const safeStatus =
    status || "Submitted";

  const className =
    safeStatus
      .toLowerCase()
      .replaceAll(
        " ",
        "-"
      );

  return (
    <span
      className={`status-pill ${className}`}
    >
      {safeStatus}
    </span>
  );
}

function BottomNav({
  tabs,
  activeTab,
  onNavigate,
  selectedCity,
  onCityChange,
}) {
  return (
    <nav className="bottom-nav">
      <div className="nav-brand">
        <span className="brand-dot" />
        NAGARSUNO
      </div>

      <div className="nav-tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              className={`nav-tab ${
                activeTab ===
                tab.id
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                onNavigate(tab.id)
              }
            >
              <Icon size={19} />

              <span>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="nav-location">
        <MapPin size={16} />
        <select
          value={selectedCity}
          onChange={(event) => onCityChange(event.target.value)}
          aria-label="Select city"
          style={{
            background: "transparent",
            border: "none",
            color: "inherit",
            font: "inherit",
            cursor: "pointer",
            outline: "none",
          }}
        >
          {CITIES.map((cityName) => (
            <option key={cityName} value={cityName} style={{ color: "#241b16" }}>
              {cityName}
            </option>
          ))}
        </select>
      </div>
    </nav>
  );
}

export default App;
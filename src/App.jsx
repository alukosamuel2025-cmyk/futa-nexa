import React, { useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  inMemoryPersistence,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { auth, db } from "./firebase.js";
import {
  Search, Home, GraduationCap, Church, Info, Moon, Sun, Plus, X,
  BookOpen, Calendar, FileText, LogOut, ChevronRight, Megaphone,
} from "lucide-react";

/* Force a fresh login every visit — session lives only in memory, not across reloads */
setPersistence(auth, inMemoryPersistence);

const DEPARTMENTS = [
  "Agricultural Extension & Communication Technology", "Agricultural & Resource Economics",
  "Animal Production & Health", "Crop, Soil & Pest Management", "Fisheries & Aquaculture Technology",
  "Ecotourism & Wildlife Management", "Forestry & Wood Technology", "Food Science & Technology",
  "Nutrition and Dietetics", "Agricultural Engineering", "Biomedical Engineering", "Chemical Engineering",
  "Civil Engineering", "Computer Engineering", "Electrical & Electronics Engineering",
  "Industrial & Production Engineering", "Mechanical Engineering", "Metallurgical & Materials Engineering",
  "Mining Engineering", "Applied Geophysics", "Applied Geology", "Meteorology",
  "Marine Science & Technology", "Remote Sensing & Geoscience Information Systems", "Architecture",
  "Building Technology", "Estate Management", "Industrial Design", "Quantity Surveying",
  "Urban & Regional Planning", "Surveying & Geoinformatics", "Project Management Technology",
  "Transport Management Technology", "Library & Information Science", "Entrepreneurship Management Technology",
  "Biochemistry", "Biology", "Chemistry", "Mathematics", "Industrial Chemistry", "Microbiology",
  "Physics", "Statistics", "Computer Science", "Cyber Security", "Software Engineering",
  "Information Technology", "Information Systems", "Anatomy", "Biomedical Technology",
  "Medical Laboratory Science", "Medicine and Surgery", "Physiology",
];

function usernameToEmail(username) {
  return `${username.trim().toLowerCase().replace(/\s+/g, "_")}@futa-nexa.local`;
}

export default function App() {
  const [screen, setScreen] = useState("login"); // login | app
  const [username, setUsername] = useState("");
  const [inputName, setInputName] = useState("");
  const [inputPass, setInputPass] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [uid, setUid] = useState(null);

  const [mode, setMode] = useState("student");
  const [page, setPage] = useState("home");
  const [dark, setDark] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState(null);

  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const [showComposer, setShowComposer] = useState(false);
  const [composerType, setComposerType] = useState("announcement");
  const [composerText, setComposerText] = useState("");
  const [composerTitle, setComposerTitle] = useState("");
  const [composerDate, setComposerDate] = useState("");

  const [showCourseComposer, setShowCourseComposer] = useState(false);
  const [courseCode, setCourseCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [courseSemester, setCourseSemester] = useState("Harmattan");
  const [resourceDrafts, setResourceDrafts] = useState({});

  const loggedIn = screen === "app";

  // Live listeners once logged in
  useEffect(() => {
    if (!loggedIn) return;
    setLoadingData(true);
    const unsubA = onSnapshot(query(collection(db, "announcements"), orderBy("createdAt", "desc")), snap => {
      setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoadingData(false);
    });
    const unsubE = onSnapshot(query(collection(db, "events"), orderBy("date", "asc")), snap => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubC = onSnapshot(collection(db, "courses"), snap => {
      setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubA(); unsubE(); unsubC(); };
  }, [loggedIn]);

  const theme = {
    bg: dark ? "#0F1115" : "#F6F5F1",
    surface: dark ? "#171A21" : "#FFFFFF",
    surfaceAlt: dark ? "#1F232C" : "#EFEDE7",
    text: dark ? "#EDEDEE" : "#171A21",
    textDim: dark ? "#9AA0AC" : "#6B6F76",
    border: dark ? "#282C36" : "#E2DFD7",
    accent: mode === "student" ? "#5B6EE8" : "#B8850F",
    accentSoft: mode === "student" ? "rgba(91,110,232,0.14)" : "rgba(184,133,15,0.14)",
  };

  async function handleLogin(e) {
    if (e && e.preventDefault) e.preventDefault();
    const name = inputName.trim();
    const pass = inputPass;
    setLoginError("");
    if (!name || !pass) { setLoginError("Enter both username and password."); return; }
    setLoginBusy(true);
    const email = usernameToEmail(name);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const snap = await getDoc(doc(db, "users", cred.user.uid));
      const data = snap.exists() ? snap.data() : { username: name, isAdmin: false };
      setIsAdmin(!!data.isAdmin);
      setUid(cred.user.uid);
      setUsername(data.username || name);
      setScreen("app");
    } catch (err) {
      if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
        // Try creating a new account with this username/password
        try {
          const cred = await createUserWithEmailAndPassword(auth, email, pass);
          const adminFlag = name.toLowerCase() === "admin";
          await setDoc(doc(db, "users", cred.user.uid), { username: name, isAdmin: adminFlag });
          setIsAdmin(adminFlag);
          setUid(cred.user.uid);
          setUsername(name);
          setScreen("app");
        } catch (createErr) {
          setLoginError(createErr.message.replace("Firebase: ", ""));
        }
      } else if (err.code === "auth/wrong-password") {
        setLoginError("Incorrect password.");
      } else {
        setLoginError(err.message.replace("Firebase: ", ""));
      }
    }
    setLoginBusy(false);
    setInputPass("");
  }

  async function handleLogout() {
    await signOut(auth);
    setScreen("login");
    setInputName("");
    setInputPass("");
    setLoginError("");
    setUsername("");
    setIsAdmin(false);
    setUid(null);
    setPage("home");
    setSelectedDept(null);
  }

  async function submitPost() {
    if (!composerTitle.trim()) return;
    if (composerType === "announcement") {
      if (!composerText.trim()) return;
      await addDoc(collection(db, "announcements"), {
        mode, title: composerTitle, body: composerText, author: username,
        date: new Date().toLocaleDateString(), createdAt: Date.now(),
      });
    } else {
      if (!composerDate) return;
      await addDoc(collection(db, "events"), {
        mode, title: composerTitle, description: composerText, date: composerDate, createdAt: Date.now(),
      });
    }
    setComposerTitle(""); setComposerText(""); setComposerDate(""); setShowComposer(false);
  }

  async function addCourse(dept) {
    if (!courseCode.trim() || !courseName.trim()) return;
    await addDoc(collection(db, "courses"), {
      department: dept, code: courseCode, name: courseName, semester: courseSemester, materials: [],
    });
    setCourseCode(""); setCourseName(""); setShowCourseComposer(false);
  }

  async function addResource(courseId) {
    const draft = resourceDrafts[courseId];
    if (!draft || !draft.title || !draft.title.trim()) return;
    const course = courses.find(c => c.id === courseId);
    const updatedMaterials = [...(course.materials || []), { title: draft.title, url: draft.url || "" }];
    await updateDoc(doc(db, "courses", courseId), { materials: updatedMaterials });
    setResourceDrafts({ ...resourceDrafts, [courseId]: { title: "", url: "" } });
  }

  const filteredDepts = DEPARTMENTS.filter(d => d.toLowerCase().includes(query.toLowerCase()));
  const modeAnnouncements = announcements.filter(a => a.mode === mode);
  const modeEvents = events.filter(e => e.mode === mode);
  const churchAnnouncements = announcements.filter(a => a.mode === "church");
  const churchEvents = events.filter(e => e.mode === "church");
  const deptCourses = selectedDept ? courses.filter(c => c.department === selectedDept) : [];

  return (
    <div style={{ minHeight: "100vh", background: theme.bg, color: theme.text, fontFamily: "system-ui, sans-serif", transition: "background 0.3s" }}>
      <style>{globalCSS}</style>

      <div style={{ position: "sticky", top: 0, zIndex: 10, background: theme.surface, borderBottom: `1px solid ${theme.border}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: theme.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "Georgia, serif", fontSize: 13, fontWeight: 700 }}>FC</div>
            <span style={{ fontFamily: "Georgia, serif", fontWeight: 600, fontSize: 16 }}>Hub</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => setDark(d => !d)} style={iconBtnStyle(theme)}>{dark ? <Sun size={17} /> : <Moon size={17} />}</button>
            {loggedIn && <button onClick={handleLogout} style={iconBtnStyle(theme)}><LogOut size={16} /></button>}
          </div>
        </div>

        {loggedIn && (
          <>
            <div style={{ padding: "0 16px 12px" }}>
              <div style={{ display: "flex", background: theme.surfaceAlt, borderRadius: 12, padding: 4, gap: 4 }}>
                {["student", "church"].map(m => (
                  <button key={m} onClick={() => { setMode(m); setPage("home"); }} style={{
                    flex: 1, padding: "9px 0", borderRadius: 9, border: "none", cursor: "pointer",
                    background: mode === m ? (m === "student" ? "#5B6EE8" : "#B8850F") : "transparent",
                    color: mode === m ? "#fff" : theme.textDim, fontWeight: 600, fontSize: 13,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.25s",
                  }}>
                    {m === "student" ? <GraduationCap size={15} /> : <Church size={15} />}
                    {m === "student" ? "Student Mode" : "Church Mode"}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", padding: "0 8px", borderTop: `1px solid ${theme.border}` }}>
              {[{ id: "home", label: "Home", icon: Home }, { id: "hub", label: "Student Hub", icon: GraduationCap },
                { id: "church", label: "Church", icon: Church }, { id: "about", label: "About", icon: Info }].map(n => (
                <button key={n.id} onClick={() => setPage(n.id)} style={{
                  flex: 1, background: "none", border: "none", padding: "10px 4px", cursor: "pointer",
                  color: page === n.id ? theme.accent : theme.textDim, display: "flex", flexDirection: "column",
                  alignItems: "center", gap: 3, borderBottom: page === n.id ? `2px solid ${theme.accent}` : "2px solid transparent", fontSize: 11,
                }}>
                  <n.icon size={16} />{n.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 16px 90px" }}>
        {!loggedIn ? (
          <LoginSection theme={theme} inputName={inputName} setInputName={setInputName}
            inputPass={inputPass} setInputPass={setInputPass} loginError={loginError}
            loginBusy={loginBusy} handleLogin={handleLogin} />
        ) : loadingData ? (
          <p style={{ color: theme.textDim, textAlign: "center", marginTop: 40 }}>Loading…</p>
        ) : page === "home" ? (
          <HomePage theme={theme} mode={mode} username={username} query={query} setQuery={setQuery}
            filteredDepts={filteredDepts} setSelectedDept={setSelectedDept} setPage={setPage}
            announcements={modeAnnouncements} events={modeEvents} />
        ) : page === "hub" ? (
          <DeptPage theme={theme} selectedDept={selectedDept} setSelectedDept={setSelectedDept}
            query={query} setQuery={setQuery} filteredDepts={filteredDepts} deptCourses={deptCourses}
            isAdmin={isAdmin} showCourseComposer={showCourseComposer} setShowCourseComposer={setShowCourseComposer}
            courseCode={courseCode} setCourseCode={setCourseCode} courseName={courseName} setCourseName={setCourseName}
            courseSemester={courseSemester} setCourseSemester={setCourseSemester} addCourse={addCourse}
            resourceDrafts={resourceDrafts} setResourceDrafts={setResourceDrafts} addResource={addResource} />
        ) : page === "church" ? (
          <ChurchPage theme={theme} announcements={churchAnnouncements} events={churchEvents} />
        ) : (
          <AboutPage theme={theme} />
        )}
      </div>

      {loggedIn && isAdmin && (page === "home" || page === "church") && (
        <button onClick={() => { setComposerType("announcement"); setShowComposer(true); }} style={{
          position: "fixed", bottom: 24, right: 20, width: 54, height: 54, borderRadius: 27,
          background: theme.accent, border: "none", color: "#fff", display: "flex", alignItems: "center",
          justifyContent: "center", boxShadow: "0 8px 24px rgba(0,0,0,0.35)", cursor: "pointer",
        }}>
          <Plus size={24} />
        </button>
      )}

      {showComposer && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end", zIndex: 20 }} onClick={() => setShowComposer(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: theme.surface, width: "100%", borderRadius: "20px 20px 0 0", padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontWeight: 600, fontFamily: "Georgia, serif", fontSize: 17 }}>New post — {mode === "student" ? "Student Hub" : "Church"}</span>
              <button onClick={() => setShowComposer(false)} style={{ background: "none", border: "none", color: theme.textDim, cursor: "pointer" }}><X size={20} /></button>
            </div>
            <div style={{ display: "flex", background: theme.surfaceAlt, borderRadius: 10, padding: 3, marginBottom: 14, gap: 3 }}>
              {["announcement", "event"].map(t => (
                <button key={t} onClick={() => setComposerType(t)} style={{
                  flex: 1, padding: "8px 0", borderRadius: 7, border: "none", cursor: "pointer",
                  background: composerType === t ? theme.accent : "transparent",
                  color: composerType === t ? "#fff" : theme.textDim, fontWeight: 600, fontSize: 13, textTransform: "capitalize",
                }}>{t}</button>
              ))}
            </div>
            <input value={composerTitle} onChange={e => setComposerTitle(e.target.value)} placeholder="Title" style={inputStyle(theme)} />
            {composerType === "event" && (
              <input type="date" value={composerDate} onChange={e => setComposerDate(e.target.value)} style={{ ...inputStyle(theme), marginTop: 10 }} />
            )}
            <textarea value={composerText} onChange={e => setComposerText(e.target.value)} placeholder={composerType === "announcement" ? "Write your announcement…" : "Event details (optional)"} rows={4} style={{ ...inputStyle(theme), marginTop: 10, resize: "vertical" }} />
            <button onClick={submitPost} style={{ width: "100%", marginTop: 14, padding: "13px 0", borderRadius: 12, border: "none", background: theme.accent, color: "#fff", fontWeight: 600, cursor: "pointer" }}>Post</button>
          </div>
        </div>
      )}
    </div>
  );
}

function LoginSection({ theme, inputName, setInputName, inputPass, setInputPass, loginError, loginBusy, handleLogin }) {
  return (
    <div style={{ animation: "fadeUp 0.4s ease", maxWidth: 380, margin: "30px auto 0" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ width: 52, height: 52, borderRadius: 15, margin: "0 auto 16px", background: "linear-gradient(135deg,#5B6EE8,#B8850F)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, color: "#fff", fontFamily: "Georgia, serif" }}>FC</div>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 22, margin: 0, fontWeight: 600, color: theme.text }}>FUTA & Church Hub</h1>
        <p style={{ color: theme.textDim, fontSize: 13, marginTop: 8 }}>Sign in to continue — one home for lecture halls and Sunday service.</p>
      </div>
      <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 18, padding: 22 }}>
        <label style={{ color: theme.textDim, fontSize: 12, letterSpacing: 0.4, textTransform: "uppercase" }}>Username</label>
        <input autoFocus value={inputName} onChange={e => setInputName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleLogin(e)} placeholder="e.g. tosin_ade"
          style={{ ...inputStyle(theme), marginTop: 8, marginBottom: 16 }} />
        <label style={{ color: theme.textDim, fontSize: 12, letterSpacing: 0.4, textTransform: "uppercase" }}>Password</label>
        <input type="password" value={inputPass} onChange={e => setInputPass(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleLogin(e)} placeholder="••••••••" style={{ ...inputStyle(theme), marginTop: 8 }} />
        {loginError && <p style={{ color: "#E0785A", fontSize: 12, marginTop: 10, marginBottom: 0 }}>{loginError}</p>}
        <button onClick={handleLogin} disabled={loginBusy} style={{ width: "100%", marginTop: 18, padding: "13px 0", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#5B6EE8,#B8850F)", color: "#fff", fontWeight: 600, fontSize: 15, cursor: loginBusy ? "default" : "pointer", opacity: loginBusy ? 0.7 : 1 }}>
          {loginBusy ? "Signing in…" : "Enter"}
        </button>
        <p style={{ color: theme.textDim, fontSize: 12, textAlign: "center", marginTop: 14, marginBottom: 0 }}>
          New username? An account is created automatically. Password must be at least 6 characters.
        </p>
      </div>
    </div>
  );
}

function HomePage({ theme, mode, username, query, setQuery, filteredDepts, setSelectedDept, setPage, announcements, events }) {
  return (
    <div style={{ animation: "fadeUp 0.4s ease" }}>
      <h1 style={{ fontFamily: "Georgia, serif", fontSize: 24, marginBottom: 4 }}>Welcome, {username}</h1>
      <p style={{ color: theme.textDim, fontSize: 14, marginBottom: 20 }}>
        {mode === "student" ? "Find your department to see this semester's courses." : "Announcements and events from the church."}
      </p>
      {mode === "student" && (
        <div style={{ position: "relative", marginBottom: 22 }}>
          <Search size={16} style={{ position: "absolute", left: 14, top: 14, color: theme.textDim }} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search your department…"
            style={{ ...inputStyle(theme), paddingLeft: 38 }} onFocus={() => setPage("hub")} />
        </div>
      )}
      <SectionLabel theme={theme} icon={Megaphone} text="Announcements" />
      {announcements.length === 0 ? <EmptyCard theme={theme} text="No announcements yet." /> : announcements.slice(0, 3).map(a => <PostCard key={a.id} theme={theme} post={a} />)}
      <SectionLabel theme={theme} icon={Calendar} text="Upcoming" />
      {events.length === 0 ? <EmptyCard theme={theme} text="No events scheduled yet." /> : events.slice(0, 3).map(ev => <EventCard key={ev.id} theme={theme} event={ev} />)}
    </div>
  );
}

function DeptPage({ theme, selectedDept, setSelectedDept, query, setQuery, filteredDepts, deptCourses, isAdmin,
  showCourseComposer, setShowCourseComposer, courseCode, setCourseCode, courseName, setCourseName,
  courseSemester, setCourseSemester, addCourse, resourceDrafts, setResourceDrafts, addResource }) {

  if (selectedDept) {
    return (
      <div style={{ animation: "fadeUp 0.4s ease" }}>
        <button onClick={() => setSelectedDept(null)} style={{ background: "none", border: "none", color: theme.accent, fontSize: 13, cursor: "pointer", marginBottom: 12, padding: 0 }}>← Back to departments</button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 22, marginBottom: 4 }}>{selectedDept}</h1>
            <p style={{ color: theme.textDim, fontSize: 13, marginBottom: 18 }}>This semester's courses</p>
          </div>
          {isAdmin && (
            <button onClick={() => setShowCourseComposer(true)} style={{ display: "flex", alignItems: "center", gap: 4, background: theme.accentSoft, color: theme.accent, border: "none", borderRadius: 10, padding: "8px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
              <Plus size={14} /> Course
            </button>
          )}
        </div>

        {deptCourses.length === 0 ? (
          <EmptyCard theme={theme} text="No courses added for this department yet." />
        ) : deptCourses.map(c => {
          const draft = resourceDrafts[c.id] || { title: "", url: "" };
          return (
            <div key={c.id} style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 14, padding: 16, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontFamily: "monospace", fontSize: 12, color: theme.accent, fontWeight: 700 }}>{c.code}</span>
                  <h3 style={{ margin: "4px 0 0", fontSize: 16 }}>{c.name}</h3>
                </div>
                <span style={{ fontSize: 11, color: theme.textDim, background: theme.surfaceAlt, padding: "3px 8px", borderRadius: 8 }}>{c.semester}</span>
              </div>
              <div style={{ marginTop: 10 }}>
                {(!c.materials || c.materials.length === 0) ? (
                  <p style={{ fontSize: 12, color: theme.textDim, margin: "6px 0" }}>No materials uploaded yet.</p>
                ) : c.materials.map((m, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", color: theme.textDim, fontSize: 13, borderTop: i > 0 ? `1px solid ${theme.border}` : "none" }}>
                    <FileText size={14} />
                    {m.url ? <a href={m.url} target="_blank" rel="noopener noreferrer" style={{ color: theme.accent, textDecoration: "none" }}>{m.title}</a> : <span>{m.title}</span>}
                  </div>
                ))}
              </div>
              {isAdmin && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${theme.border}` }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input value={draft.title} onChange={e => setResourceDrafts({ ...resourceDrafts, [c.id]: { ...draft, title: e.target.value } })}
                      placeholder="Resource title" style={{ ...inputStyle(theme), padding: "8px 10px", fontSize: 12, flex: 1 }} />
                    <input value={draft.url} onChange={e => setResourceDrafts({ ...resourceDrafts, [c.id]: { ...draft, url: e.target.value } })}
                      placeholder="Link (optional)" style={{ ...inputStyle(theme), padding: "8px 10px", fontSize: 12, flex: 1 }} />
                    <button onClick={() => addResource(c.id)} style={{ background: theme.accent, border: "none", color: "#fff", borderRadius: 8, padding: "0 12px", cursor: "pointer" }}><Plus size={14} /></button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {showCourseComposer && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end", zIndex: 20 }} onClick={() => setShowCourseComposer(false)}>
            <div onClick={e => e.stopPropagation()} style={{ background: theme.surface, width: "100%", borderRadius: "20px 20px 0 0", padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ fontWeight: 600, fontFamily: "Georgia, serif", fontSize: 17 }}>Add course — {selectedDept}</span>
                <button onClick={() => setShowCourseComposer(false)} style={{ background: "none", border: "none", color: theme.textDim, cursor: "pointer" }}><X size={20} /></button>
              </div>
              <input value={courseCode} onChange={e => setCourseCode(e.target.value)} placeholder="Course code (e.g. CSC 401)" style={inputStyle(theme)} />
              <input value={courseName} onChange={e => setCourseName(e.target.value)} placeholder="Course name" style={{ ...inputStyle(theme), marginTop: 10 }} />
              <select value={courseSemester} onChange={e => setCourseSemester(e.target.value)} style={{ ...inputStyle(theme), marginTop: 10 }}>
                <option value="Harmattan">Harmattan semester</option>
                <option value="Rain">Rain semester</option>
              </select>
              <button onClick={() => addCourse(selectedDept)} style={{ width: "100%", marginTop: 14, padding: "13px 0", borderRadius: 12, border: "none", background: theme.accent, color: "#fff", fontWeight: 600, cursor: "pointer" }}>Add course</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ animation: "fadeUp 0.4s ease" }}>
      <h1 style={{ fontFamily: "Georgia, serif", fontSize: 22, marginBottom: 14 }}>Student Hub</h1>
      <div style={{ position: "relative", marginBottom: 16 }}>
        <Search size={16} style={{ position: "absolute", left: 14, top: 14, color: theme.textDim }} />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search departments…" style={{ ...inputStyle(theme), paddingLeft: 38 }} autoFocus />
      </div>
      {filteredDepts.length === 0 ? (
        <EmptyCard theme={theme} text="No department matches your search." />
      ) : filteredDepts.map(d => (
        <button key={d} onClick={() => setSelectedDept(d)} style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 12, padding: "14px 16px",
          marginBottom: 8, cursor: "pointer", color: theme.text, fontSize: 14, textAlign: "left",
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}><BookOpen size={16} color={theme.accent} />{d}</span>
          <ChevronRight size={16} color={theme.textDim} />
        </button>
      ))}
    </div>
  );
}

function ChurchPage({ theme, announcements, events }) {
  return (
    <div style={{ animation: "fadeUp 0.4s ease" }}>
      <h1 style={{ fontFamily: "Georgia, serif", fontSize: 22, marginBottom: 14 }}>Church</h1>
      <SectionLabel theme={theme} icon={Megaphone} text="Announcements" />
      {announcements.length === 0 ? <EmptyCard theme={theme} text="No announcements yet." /> : announcements.map(a => <PostCard key={a.id} theme={theme} post={a} />)}
      <SectionLabel theme={theme} icon={Calendar} text="Service & Events" />
      {events.length === 0 ? <EmptyCard theme={theme} text="No events scheduled yet." /> : events.map(ev => <EventCard key={ev.id} theme={theme} event={ev} />)}
    </div>
  );
}

function AboutPage({ theme }) {
  return (
    <div style={{ animation: "fadeUp 0.4s ease" }}>
      <h1 style={{ fontFamily: "Georgia, serif", fontSize: 22, marginBottom: 10 }}>About this Hub</h1>
      <p style={{ color: theme.textDim, fontSize: 14, lineHeight: 1.6 }}>
        One place for FUTA departments and the church community — announcements, resources,
        tutorials, and events, all in a single account. Switch between Student and Church mode
        anytime using the badge at the top.
      </p>
    </div>
  );
}

function SectionLabel({ theme, icon: Icon, text }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, margin: "22px 0 10px" }}>
      <Icon size={14} color={theme.accent} />
      <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", color: theme.textDim }}>{text}</span>
    </div>
  );
}

function EventCard({ theme, event }) {
  return (
    <div style={{ display: "flex", gap: 12, background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 14, padding: 14, marginBottom: 10 }}>
      <div style={{ width: 46, textAlign: "center", flexShrink: 0 }}>
        <div style={{ fontSize: 11, color: theme.textDim, fontWeight: 700, textTransform: "uppercase" }}>
          {new Date(event.date + "T00:00").toLocaleDateString(undefined, { month: "short" })}
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: theme.accent }}>{new Date(event.date + "T00:00").getDate()}</div>
      </div>
      <div>
        <h3 style={{ margin: 0, fontSize: 15 }}>{event.title}</h3>
        {event.description && <p style={{ margin: "4px 0 0", fontSize: 13, color: theme.textDim, lineHeight: 1.5 }}>{event.description}</p>}
      </div>
    </div>
  );
}

function PostCard({ theme, post }) {
  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 14, padding: 15, marginBottom: 10 }}>
      <h3 style={{ margin: 0, fontSize: 15 }}>{post.title}</h3>
      <p style={{ margin: "6px 0 8px", fontSize: 13, color: theme.textDim, lineHeight: 1.5 }}>{post.body}</p>
      <span style={{ fontSize: 11, color: theme.textDim }}>{post.author} · {post.date}</span>
    </div>
  );
}

function EmptyCard({ theme, text }) {
  return (
    <div style={{ border: `1px dashed ${theme.border}`, borderRadius: 14, padding: "22px 16px", textAlign: "center", color: theme.textDim, fontSize: 13 }}>
      {text}
    </div>
  );
}

function iconBtnStyle(theme) {
  return { width: 34, height: 34, borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.surfaceAlt, color: theme.text, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" };
}
function inputStyle(theme) {
  return { width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 12, border: `1px solid ${theme.border}`, background: theme.surfaceAlt, color: theme.text, fontSize: 14, outline: "none", fontFamily: "system-ui, sans-serif" };
}

const globalCSS = `
  @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  input:focus, textarea:focus, select:focus { border-color: #5B6EE8 !important; }
`;

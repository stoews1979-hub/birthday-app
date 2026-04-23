
import { onAuthStateChanged } from "firebase/auth";
import "./App.css";
import { useState, useEffect, useCallback } from "react";
import { db, auth } from "./firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { signInWithEmailAndPassword } from "firebase/auth";
function App() {
  const [error, setError] = useState("");
const [loading, setLoading] = useState(false);
  const isAdminPage = window.location.pathname === "/admin";
  const [search, setSearch] = useState("");
 const [selectedRange, setSelectedRange] = useState(null); 
  const [viewType, setViewType] = useState("people");
  const getCollection = useCallback(() => {
  return collection(db, viewType);
}, [viewType]);const [user, setUser] = useState(null);

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
    setUser(currentUser);
  });

  return () => unsubscribe();
}, []);

  const [name, setName] = useState("");
  const [birthday, setBirthday] = useState("");
const [editingId, setEditingId] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
const [sortType, setSortType] = useState("nextBirthday");
const [birthdays, setBirthdays] = useState([]);
const [anniversaries, setAnniversaries] = useState([]);

const login = async () => {
  setError("");
  setLoading(true);

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    console.error("LOGIN ERROR:", err.code, err.message);

    // Friendly messages
    switch (err.code) {
      case "auth/user-not-found":
        setError("No account found with that email");
        break;
      case "auth/wrong-password":
        setError("Incorrect password");
        break;
      case "auth/invalid-email":
        setError("Invalid email format");
        break;
      case "auth/invalid-login-credentials":
        setError("Invalid email or password");
        break;
      default:
        setError("Login failed. Try again.");
    }
  }

  setLoading(false);
};


const addPerson = async () => {
  if (!name || !birthday) return;

  await addDoc(getCollection(), {
    name,
    birthday
  });

  setName("");
  setBirthday("");
  loadAllData();
};
const updatePerson = async () => {
  console.log("UPDATING ID:", editingId);

  if (!name || !birthday || !editingId) return;

  await updateDoc(doc(db, viewType, editingId), {
    name,
    birthday
  });

  setName("");
  setBirthday("");
  setEditingId(null);
  loadAllData();
};
const deletePerson = async (id) => {
  await deleteDoc(doc(db, viewType, id));
  loadAllData();
};

const sortPeople = (list) => {
  switch (sortType) {
    case "nameAsc":
      return [...list].sort((a, b) =>
        a.name.localeCompare(b.name)
      );

    case "nameDesc":
      return [...list].sort((a, b) =>
        b.name.localeCompare(a.name)
      );

  case "ageDesc":
  return [...list].sort((a, b) => {
    const getValue = (p) =>
      viewType === "people"
        ? getAgeNumber(p.birthday)
        : getYearsMarriedNumber(p.birthday);

    return getValue(b) - getValue(a);
  });

case "ageAsc":
  return [...list].sort((a, b) => {
    const getValue = (p) =>
      viewType === "people"
        ? getAgeNumber(p.birthday)
        : getYearsMarriedNumber(p.birthday);

    return getValue(a) - getValue(b);
  });

    case "nextBirthday":
    default:
      return [...list].sort((a, b) =>
        getNextBirthday(a.birthday) - getNextBirthday(b.birthday)
      );
  }
};
const getGroups = (list, getNumberFn) => {
  const groups = {};

  const numbers = list
    .map(p => getNumberFn(p.birthday))
    .filter(n => !isNaN(n));

  const max = Math.max(...numbers, 0);
  const maxBucket = Math.ceil(max / 10) * 10;

  for (let i = 0; i <= maxBucket; i += 10) {
    const label = `${i}-${i + 9}`;
    groups[label] = 0;
  }

  list.forEach(person => {
    if (!person.birthday) return;

    const num = getNumberFn(person.birthday);
    if (isNaN(num)) return;

    const bucket = Math.floor(num / 10) * 10;
    const label = `${bucket}-${bucket + 9}`;

    groups[label]++;
  });

  return Object.keys(groups).map(key => ({
    range: key,
    count: groups[key]
  }));
};

const getAverageAge = () => {
  if (!birthdays.length) return 0;

  const total = birthdays.reduce((sum, p) => {
    return sum + getAgeNumber(p.birthday);
  }, 0);

  return (total / birthdays.length).toFixed(1);
};
useEffect(() => {
  loadAllData();
}, []);
const loadAllData = async () => {
  try {
    const birthdayData = await getDocs(collection(db, "people"));
    const anniversaryData = await getDocs(collection(db, "anniversaries"));

    setBirthdays(
      birthdayData.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }))
    );

    setAnniversaries(
      anniversaryData.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }))
    );
  } catch (err) {
    console.error("ERROR LOADING ALL DATA:", err);
  }
};
const today = new Date();

const month = String(today.getMonth() + 1).padStart(2, "0");
const day = String(today.getDate()).padStart(2, "0");

const todayString = `${month}-${day}`;

const todaysBirthdays = birthdays.filter(person =>
  person.birthday && person.birthday.slice(5, 10) === todayString
);

const todaysAnniversaries = anniversaries.filter(person =>
  person.birthday && person.birthday.slice(5, 10) === todayString
);
const getNextBirthday = (birthday) => {
  const today = new Date();

  const [, month, day] = birthday.split("-");

  let next = new Date(
    today.getFullYear(),
    month - 1,
    day
  );

  if (next < today) {
    next.setFullYear(today.getFullYear() + 1);
  }

  return next;
};const getDaysUntilBirthday = (birthday) => {
  const today = new Date();

  const [, month, day] = birthday.split("-");
  const bdayThisYear = new Date(
    today.getFullYear(),
    month - 1,
    day
  );

  let nextBirthday = bdayThisYear;

  if (bdayThisYear < today) {
    nextBirthday = new Date(
      today.getFullYear() + 1,
      month - 1,
      day
    );
  }

  const diffTime = nextBirthday - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

const formatDate = (dateString) => {
  const parts = dateString.split("-");
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  return new Date(year, month - 1, day).toLocaleDateString("en-US");
};
const getAgeNumber = (birthday) => {
  const today = new Date();

  const parts = birthday.split("-");
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  let age = today.getFullYear() - year;

  if (
    today.getMonth() < month - 1 ||
    (today.getMonth() === month - 1 && today.getDate() < day)
  ) {
    age--;
  }

  return age;
};
const getYearsMarriedNumber = (date) => {
  const today = new Date();

  const parts = date.split("-");
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  let years = today.getFullYear() - year;

  if (
    today.getMonth() < month - 1 ||
    (today.getMonth() === month - 1 && today.getDate() < day)
  ) {
    years--;
  }

  return years;
};
const getOrdinal = (num) => {
  const mod10 = num % 10;
  const mod100 = num % 100;

  if (mod100 >= 11 && mod100 <= 13) return `${num}th`;

  if (mod10 === 1) return `${num}st`;
  if (mod10 === 2) return `${num}nd`;
  if (mod10 === 3) return `${num}rd`;

  return `${num}th`;
};
const getAgeDisplay = (birthday) => {
  const age = getAgeNumber(birthday);

  if (age === 0) return "newborn 👶";
  if (age === 1) return "1 yr";

  return `${age} yrs`;
};
const getYearsMarried = (date) => {
  const today = new Date();

  const parts = date.split("-");
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  let years = today.getFullYear() - year;

  if (
    today.getMonth() < month - 1 ||
    (today.getMonth() === month - 1 && today.getDate() < day)
  ) {
    years--;
  }

  if (years === 0) return "Just married 🎉";
  if (years === 1) return "1 yr";

  return `${years} yrs`;
};
const getLinePoints = (groups) => {
  const maxCount = Math.max(...groups.map(g => g.count), 1);

  const width = 400;
  const padding = 20;
  const usableWidth = width - padding * 2;

  return groups.map((g, index) => ({
    x: padding + (index / (groups.length - 1 || 1)) * usableWidth,
    y: 200 - (g.count / maxCount) * 150,
    label: g.range,
    count: g.count
  }));
};
const getBirthdayText = (birthday) => {
  const days = getDaysUntilBirthday(birthday);

  if (days === 0) return "🎉 Today!";
  if (days === 1) return "🎂 Tomorrow";
  return `in ${days} days`;
};
const isSearching = search.trim() !== "";

const combinedData = [
  ...birthdays.map(p => ({ ...p, type: "people" })),
  ...anniversaries.map(p => ({ ...p, type: "anniversaries" }))
];
const baseList = isSearching
  ? combinedData
  : viewType === "people"
  ? birthdays
  : viewType === "anniversaries"
  ? anniversaries
  : [];

const filteredResults = baseList.filter(person => {
  const matchesSearch = person.name
    .toLowerCase()
    .includes(search.toLowerCase());

  if (!selectedRange) return matchesSearch;

  const [min, max] = selectedRange.split("-").map(Number);

  const type = isSearching ? person.type : viewType;

  const value =
    type === "people"
      ? getAgeNumber(person.birthday)
      : getYearsMarriedNumber(person.birthday);

  return (
    matchesSearch &&
    value >= min &&
    value <= max
  );
});
const LineChart = ({
  title,
  groups,
  color,
  selectedRange,
  setSelectedRange,
  setViewType
}) => {
  const points = getLinePoints(groups);

  return (
    <div style={{ marginBottom: 30 }}>
      <h3>{title}</h3>

      <svg
        viewBox="0 0 400 220"
        style={{
          width: "100%",
          height: "auto",
          border: "1px solid #ccc",
          borderRadius: 8
        }}
      >
        {/* Grid */}
        {[0, 50, 100, 150, 200].map((y, i) => (
          <line key={i} x1="0" y1={y} x2="400" y2={y} stroke="#eee" />
        ))}

        {/* Lines */}
        {points.map((point, i) => {
          if (i === 0) return null;
          const prev = points[i - 1];

          return (
            <line
              key={i}
              x1={prev.x}
              y1={prev.y}
              x2={point.x}
              y2={point.y}
              stroke="#4caf50"
              strokeWidth="2"
            />
          );
        })}

        {/* Points */}
    {points.map((point, i) => (
  <g
    key={i}
  onClick={() => {
  const newRange =
    selectedRange === point.label ? null : point.label;

  // set tab FIRST
  const newView = title.includes("Age")
    ? "people"
    : "anniversaries";

  setViewType(newView);
  setSelectedRange(newRange);

  // 👇 scroll to list after render
  setTimeout(() => {
    document
      .getElementById("results-section")
      ?.scrollIntoView({ behavior: "smooth" });
  }, 50);
}}
    style={{ cursor: "pointer" }}
  >
    <circle
      cx={point.x}
      cy={point.y}
      r={selectedRange === point.label ? 6 : 4}
      fill={color}
      stroke={selectedRange === point.label ? "black" : "none"}
      strokeWidth="2"
    />

    <text
      x={point.x}
      y={point.y - 10}
      fontSize="10"
      textAnchor="middle"
    >
      {point.count}
    </text>
  </g>
))}
        {/* Labels */}
        {points.map((point, i) => (
          <text
            key={i}
            x={point.x}
            y={210}
            fontSize="10"
            textAnchor="middle"
          >
            {point.label}
          </text>
        ))}
      </svg>
    </div>
  );
};
  return (
    
  <div className="app-container">
    <h1>Birthday App 🎂</h1>

    <h2>Today's Birthdays 🎉</h2>
    {todaysBirthdays.length === 0 ? (
      <div>No birthdays today</div>
    ) : (
     todaysBirthdays.map(person => (
  <div key={person.id}>
    🎂 {person.name} ({getAgeDisplay(person.birthday)})
  </div>
))
    )}

    <h2>Today's Anniversaries 💍</h2>
    {todaysAnniversaries.length === 0 ? (
      <div>No anniversaries today</div>
    ) : (
      todaysAnniversaries.map(person => (
  <div key={person.id}>
    💍 {person.name} ({getYearsMarried(person.birthday)})
  </div>
))
    )}
<input
  type="text"
  placeholder="Search..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
/>
<div className="top-buttons">
  <button onClick={() => setViewType("people")}>
    🎂 Birthdays
  </button>

  <button onClick={() => setViewType("anniversaries")}>
    💍 Anniversaries
  </button>

  <button onClick={() => setViewType("stats")}>
    📊 Stats
  </button>
</div>
{!user && isAdminPage && (
  <>
    <h2>Admin Login</h2>

    <input
  placeholder="Email"
  value={email}
  onChange={(e) => {
    setEmail(e.target.value);
    setError("");   // 👈 clears error when typing
  }}
/>

<input
  type="password"
  placeholder="Password"
  value={password}
  onChange={(e) => {
    setPassword(e.target.value);
    setError("");   // 👈 clears error when typing
  }}
/>

    <button onClick={login} disabled={loading}>
  {loading ? "Logging in..." : "Login"}
</button>
{error && (
  <div style={{ color: "red", marginTop: 10 }}>
    {error}
  </div>
)}
  </>
)}
{user && (
  <>
    <input
      placeholder="Name"
      value={name}
      onChange={(e) => setName(e.target.value)}
    />

    <input
      type="date"
      value={birthday}
      onChange={(e) => setBirthday(e.target.value)}
    />

    <button onClick={editingId ? updatePerson : addPerson}>
      {editingId ? "Update" : "Add"}
    </button>
  </>
)}

<div style={{ marginBottom: 15 }}>
  <label
    style={{
      display: "block",
      fontSize: 12,
      color: "#666",
      marginBottom: 4
    }}
  >
    Sort by
  </label>

  <div className="sort-container">
  <span className="sort-label">Sort:</span>

  <div className="sort-pills">
    <button
      className={sortType === "nextBirthday" ? "active" : ""}
      onClick={() => setSortType("nextBirthday")}
    >
      Upcoming
    </button>

    <button
      className={sortType === "nameAsc" ? "active" : ""}
      onClick={() => setSortType("nameAsc")}
    >
      A–Z
    </button>

    <button
      className={sortType === "nameDesc" ? "active" : ""}
      onClick={() => setSortType("nameDesc")}
    >
      Z–A
    </button>

    <button
      className={sortType === "ageDesc" ? "active" : ""}
      onClick={() => setSortType("ageDesc")}
    >
      Oldest
    </button>

    <button
      className={sortType === "ageAsc" ? "active" : ""}
      onClick={() => setSortType("ageAsc")}
    >
      Youngest
    </button>
  </div>
</div>
</div>
<div id="results-section">
  <h2>
    {viewType === "people"
      ? "Birthdays 🎂"
      : viewType === "anniversaries"
      ? "Anniversaries 💍"
      : "Stats 📊"}
  </h2>
{viewType === "stats" ? (
  <div>
    <p>Average Age: {getAverageAge()}</p>
    <p>Total People: {birthdays.length}</p>
<LineChart
  title="🎂 Age Distribution"
  groups={getGroups(birthdays, getAgeNumber)}
  color="#4caf50"
  selectedRange={selectedRange}
  setSelectedRange={setSelectedRange}
  setViewType={setViewType}
/>

<LineChart
  title="💍 Years Married Distribution"
  groups={getGroups(anniversaries, getYearsMarriedNumber)}
  color="#2196f3"
  selectedRange={selectedRange}
  setSelectedRange={setSelectedRange}
  setViewType={setViewType}
/>

  </div>
) : (
  <>
{selectedRange && (
  <div style={{ marginBottom: 10 }}>
    Showing: {selectedRange} ({filteredResults.length}{" "}
    {(() => {
      const label =
        viewType === "anniversaries" ? "couple" : "person";

      return filteredResults.length === 1
        ? label
        : `${label}s`;
    })()})
    {" "}
    <button onClick={() => setSelectedRange(null)}>
      Clear
    </button>
  </div>
)}

    {sortPeople(filteredResults).map((person) => {
    const type = isSearching ? person.type : viewType;

    return (
      <div className="person-row" key={person.id}>
        <span>
          {person.name} - {formatDate(person.birthday)} (
          {type === "people"
            ? getAgeDisplay(person.birthday)
            : getYearsMarried(person.birthday)}
          )
          {" • "}
          {type === "people"
            ? `turns ${getAgeNumber(person.birthday) + 1} ${getBirthdayText(person.birthday)}`
            : `${getOrdinal(getYearsMarriedNumber(person.birthday) + 1)} anniversary ${getBirthdayText(person.birthday)}`}

          {isSearching && (
            <> {" • "} {type === "people" ? "🎂 Birthday" : "💍 Anniversary"} </>
          )}
        </span>

        {user && !isSearching && (
          <span className="actions">
            <button onClick={() => {
              setName(person.name);
              setBirthday(person.birthday);
              setEditingId(person.id);
            }}>
              Edit
            </button>

            <button onClick={() => deletePerson(person.id)}>
              Delete
            </button>
          </span>
        )}
      </div>
    );
   })}
  </>
)}

   </div>
</div>
  );
}

export default App;

import "./App.css";
import { useState, useEffect, useCallback } from "react";
import { db, auth } from "./firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
function App() {
  const [viewType, setViewType] = useState("people");
  const getCollection = useCallback(() => {
  return collection(db, viewType);
}, [viewType]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [name, setName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [people, setPeople] = useState([]);
const [editingId, setEditingId] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
const [sortType, setSortType] = useState("nextBirthday");
const signUp = async () => {
  await createUserWithEmailAndPassword(auth, email, password);
};

const login = async () => {
  await signInWithEmailAndPassword(auth, email, password);
};

const addPerson = async () => {
  if (!name || !birthday) return;

  await addDoc(getCollection(), {
    name,
    birthday
  });

  setName("");
  setBirthday("");
  loadPeople();
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
  loadPeople();
};
const deletePerson = async (id) => {
  await deleteDoc(doc(db, viewType, id));
  loadPeople();
};

const loadPeople = useCallback(async () => {
  try {
    const col = getCollection();
    const data = await getDocs(col);

    setPeople(
      data.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }))
    );
  } catch (err) {
    console.error("ERROR LOADING PEOPLE:", err);
  }
}, [getCollection]);const sortPeople = (list) => {
  switch (sortType) {
    case "name":
      return [...list].sort((a, b) =>
        a.name.localeCompare(b.name)
      );

    case "age":
      return [...list].sort((a, b) =>
        getAge(b.birthday) - getAge(a.birthday)
      );

    case "nextBirthday":
    default:
      return [...list].sort((a, b) =>
        getNextBirthday(a.birthday) - getNextBirthday(b.birthday)
      );
  }
};
useEffect(() => {
  loadPeople();
}, [loadPeople, viewType]);

const todayString = new Date().toISOString().slice(5, 10);

const todaysBirthdays = people.filter(person =>
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
const getAge = (birthday) => {
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
};const getBirthdayText = (birthday) => {
  const days = getDaysUntilBirthday(birthday);

  if (days === 0) return "🎉 Today!";
  if (days === 1) return "🎂 Tomorrow";
  return `in ${days} days`;
};
  return (
    <div style={{ padding: 20 }}>
      <h1>Birthday App 🎂</h1>
      <div style={{ marginBottom: 10 }}>
  <button onClick={() => setViewType("people")}>
    🎂 Birthdays
  </button>

  <button onClick={() => setViewType("anniversaries")}>
    💍 Anniversaries
  </button>
</div>
      <button onClick={() => setIsAdmin(!isAdmin)}>
  {isAdmin ? "Exit Admin Mode" : "Enter Admin Mode"}
</button>
{isAdmin && (
  <>
    <h2>Login</h2>

    <input
      placeholder="Email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
    />

    <input
      type="password"
      placeholder="Password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
    />

    <button onClick={signUp}>Sign Up</button>
    <button onClick={login}>Login</button>

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
<h2>Today's Birthdays 🎉</h2>
{todaysBirthdays.length === 0 ? (
  <div>No birthdays today</div>
) : (
  todaysBirthdays.map(person => (
    <div key={person.id}>
      🎂 {person.name}
    </div>
  ))
)}

<div style={{ marginBottom: 10 }}>
  <button onClick={() => setSortType("nextBirthday")}>
    Sort: Upcoming 🎂
  </button>

  <button onClick={() => setSortType("name")}>
    Sort: Name 🔤
  </button>

  <button onClick={() => setSortType("age")}>
    Sort: Age 🎯
  </button>
  </div>
<h2>
  {viewType === "people" ? "Birthdays 🎂" : "Anniversaries 💍"}
</h2>
{sortPeople(people).map((person) => (
  <div className="person-row">
  <span>
    {person.name} - {formatDate(person.birthday)} (
  {getAge(person.birthday)}{" "}
  {viewType === "people" ? "yrs old" : "years together"}
) -{" "}
    {getBirthdayText(person.birthday)}
  </span>

 {isAdmin && (
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
))}

    </div>
  );
}

export default App;
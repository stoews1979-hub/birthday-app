const {onSchedule} = require("firebase-functions/v2/scheduler");
const {setGlobalOptions} = require("firebase-functions/v2");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

setGlobalOptions({maxInstances: 10});

// ⏰ DAILY FUNCTION
exports.dailyReminder = onSchedule(
  {
   schedule: "0 7 * * *",
    timeZone: "America/Los_Angeles",
    secrets: ["GMAIL_USER", "GMAIL_PASS"],
  },
   async (event) => {
  const db = admin.firestore();

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

     const today = new Date();
      const month = today.getMonth() + 1;
      const day = today.getDate();
      const year = today.getFullYear();

      const snapshot = await db.collection("people").get();

      const birthdays = [];
      const anniversaries = [];

      snapshot.forEach((doc) => {
        const data = doc.data();

        // 🎂 BIRTHDAYS
if (data.birthday) {
  const [yearStr, monthStr, dayStr] = data.birthday.split("-");
const bMonth = Number(monthStr);
const bDay = Number(dayStr);
const bYear = Number(yearStr);

if (bMonth === month && bDay === day) {
  const age = year - bYear;
  birthdays.push(`${data.name} (${age})`);
}
}

      // 💍 ANNIVERSARIES
if (data.anniversary) {
  const [y, m, d] = data.anniversary.split("-");
  const aMonth = Number(m);
  const aDay = Number(d);
  const aYear = Number(y);

  if (aMonth === month && aDay === day) {
    const years = year - aYear;
    anniversaries.push(`${data.name} (${years} yrs)`);
  }
}
      });
          // 🚫 Nothing today
      if (birthdays.length === 0 && anniversaries.length === 0) {
        console.log("No events today");
        return null;
      }

      // ✉️ Build message
      let message = "";

      if (birthdays.length > 0) {
        message += "🎂 Birthdays:\n";
        birthdays.forEach((b) => (message += `- ${b}\n`));
        message += "\n";
      }

      if (anniversaries.length > 0) {
        message += "💍 Anniversaries:\n";
        anniversaries.forEach((a) => (message += `- ${a}\n`));
      }

      // 📧 Send email
      await transporter.sendMail({
        from: process.env.GMAIL_USER,
to: process.env.GMAIL_USER,
       subject: `${birthdays.length + anniversaries.length} reminder(s) today 🎉`,
        text: message,
      });

      console.log("Email sent!");
      return null;
    },
);

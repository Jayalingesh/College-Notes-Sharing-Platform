// Promote (or demote) a registered user to staff so they can verify notes.
//
// Usage (run from the /server folder):
//   npm run make-staff -- staff@college.edu
//   npm run make-staff -- staff@college.edu --remove
//
// Uses MONGO_URI from server/.env, so point it at the same database
// your deployed server uses (e.g. your MongoDB Atlas URI).

require("dotenv").config();
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
const mongoose = require("mongoose");
const User = require("../models/User");

(async () => {
    const email = (process.argv[2] || "").toLowerCase().trim();
    const remove = process.argv.includes("--remove");

    if(!email) {
        console.error("Usage: npm run make-staff -- <email> [--remove]");
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ email });

        if(!user) {
            console.error(`No user found with email: ${email} (register on the site first)`);
            process.exit(1);
        }

        user.role = remove ? "student" : "admin";
        await user.save({ validateBeforeSave: false });
        console.log(`${user.name} <${user.email}> is now: ${user.role}`);
    } catch(err) {
        console.error("Error:", err.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
})();

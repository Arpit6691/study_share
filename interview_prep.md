# Study Share Interview Preparation Guide

This guide is designed to help you prepare for an interview where you will be discussing the **Study Share** project. 

## Project Overview

**Study Share** is a web application that allows users to share, manage, and discover study materials. The application features user authentication (including Google OAuth), note management, file uploads, and a robust RESTful API.

### Tech Stack
*   **Frontend**: React (v18), Vite, React Router, Axios, Lucide React icons.
*   **Backend**: Node.js, Express, MongoDB (Mongoose).
*   **Authentication**: JSON Web Tokens (JWT), Google OAuth (`@react-oauth/google`, `google-auth-library`), Bcrypt.
*   **File Handling**: Multer (for handling file uploads).
*   **Other Tools**: Nodemailer (emails), Express Rate Limit (security).

---

## 1. Architecture & System Design Questions

**Q: Can you explain the overall architecture of Study Share?**
*A:* Study Share follows a standard Client-Server architecture. The frontend is a Single Page Application (SPA) built with React and bundled by Vite. It communicates with a backend RESTful API built with Express.js. The backend persists data in a MongoDB database using Mongoose as the ODM. Authentication is handled statelessly via JWTs.

**Q: How are file uploads handled?**
*A:* When a user uploads a file, the frontend sends a `multipart/form-data` request. The backend uses `multer` middleware to intercept this request, process the file, and save it to the local `uploads/` directory. The file path or URL is then stored in the MongoDB document associated with the note.

**Q: How do you manage environment variables and configuration?**
*A:* We use `dotenv` to load environment variables from `.env` files into `process.env`. Critical variables include `MONGO_URI`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, and port configurations. The backend checks for the presence of crucial variables like `MONGO_URI` on startup and exits safely if they are missing.

---

## 2. Authentication & Security Questions

**Q: How is authentication implemented?**
*A:* We support both local authentication and Google OAuth.
*   **Local:** Passwords are hashed using `bcryptjs` before being stored. Upon successful login, the server generates a JWT signed with a secret key.
*   **Google OAuth:** The frontend uses `@react-oauth/google` to get a token from Google. This token is sent to the backend, which verifies it using `google-auth-library` and issues our application's JWT.

**Q: How is the JWT used to secure routes?**
*A:* The frontend includes the JWT in the `Authorization` header (`Bearer <token>`) of subsequent API requests. The backend has an authentication middleware that verifies the token's signature and expiration. If valid, it attaches the user ID to the request object (`req.user`), allowing downstream handlers to authorize actions.

**Q: What security measures are in place?**
*A:* 
*   **Password Hashing:** Passwords are never stored in plaintext.
*   **Rate Limiting:** `express-rate-limit` is used to protect against brute-force and DDoS attacks.
*   **CORS:** Cross-Origin Resource Sharing is configured to only allow requests from trusted origins.

---

## 3. Frontend (React) Questions

**Q: Why use Vite over Create React App?**
*A:* Vite provides a significantly faster development experience. It utilizes native ES modules in the browser, meaning it doesn't need to bundle the entire application before the dev server starts. Hot Module Replacement (HMR) is nearly instantaneous.

**Q: How does routing work in the frontend?**
*A:* We use `react-router-dom` to handle client-side routing. This allows users to navigate between different views (e.g., Dashboard, Login, Note Details) without triggering a full page reload, providing a smoother SPA experience.

---

## 4. Backend (Node/Express) Questions

**Q: What is the role of Mongoose?**
*A:* Mongoose provides a schema-based solution to model application data. It includes built-in type casting, validation, query building, and business logic hooks, making it easier to interact with MongoDB compared to the native driver.

**Q: How do you handle errors in your Express app?**
*A:* We use global error handling middleware in `server.js`. If any route or middleware passes an error to `next(err)`, this global handler catches it, logs the stack trace (in development), and sends a formatted JSON response with a 500 status code to the client.

---

## 5. Potential Behavioral/Process Questions

**Q: What was the most challenging part of building this project?**
*(Prepare a personal anecdote. Good examples include setting up OAuth, handling multipart file uploads correctly, or configuring CORS between local dev servers.)*

**Q: If you had more time, what features would you add?**
*(Ideas: Cloud storage for uploads like AWS S3 instead of local disk, full-text search for notes, collaborative editing, or real-time notifications.)*

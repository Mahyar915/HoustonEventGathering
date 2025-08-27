# Event Registration Application

This is a web application for event registration, featuring user authentication, registration management, and image handling.

## Project Structure

- `backend/`: Contains the FastAPI backend application.
- `frontend/`: Contains the React frontend application.
- `event_registrations.db`: SQLite database file.
- `uploads/`: Directory for uploaded images.

## Features Implemented

- **Simplified Registration:** Users can register by providing an email, requesting an OTP, and then setting a username and password (with complexity requirements) in a single streamlined flow.
- **Password Reset:** Users can request a password reset via email, even if their username is not yet set.
- **Flexible Login:** Users can log in using either their username or email.
- **Secure Password Hashing:** Passwords are securely hashed using `pbkdf2_sha256`.
- **User and Registration Management:** Basic functionalities for managing users and event registrations.
- **Image Upload and Display:** Users can upload images with captions, and view a gallery.

## Setup and Running the Application

Follow these steps to get the application up and running on your local machine.

### Prerequisites

- Python 3.12 or 3.13 (Python 3.12 is recommended for better compatibility with `passlib`/`bcrypt`)
- Node.js and npm (or yarn)

### 1. Backend Setup

Navigate to the `backend` directory and install the Python dependencies.

```bash
cd backend
"C:\Python313\python.exe" -m pip install -r requirements.txt # Or use your Python 3.12 executable
```

**Note on Python Environment:** If you encounter issues with `bcrypt` or `passlib`, it's highly recommended to use Python 3.12. You can explicitly install packages for Python 3.12 like this:

```bash
"C:\Users\MayerK\AppData\Local\Programs\Python\Python312\python.exe" -m pip install -r requirements.txt
```

### 2. Initialize the Database (Optional, but recommended for fresh start)

From the `backend` directory, run the database initialization script. This will delete any existing `event_registrations.db` and recreate the tables.

```bash
cd backend
python initialize_db.py
```

### 3. Create an Admin User (Optional)

From the `backend` directory, you can create an admin user:

```bash
python create_admin.py <username> <password>
```

### 4. Start the Backend Server

From the project root directory (`event_registration_app`), start the FastAPI server.

```bash
cd .. # If you are in the backend directory
"C:\Python313\python.exe" -m uvicorn backend.main:app --reload # Or use your Python 3.12 executable
```

The backend server will typically run on `http://127.0.0.1:8000`.

### 5. Frontend Setup

Navigate to the `frontend` directory and install the Node.js dependencies.

```bash
cd frontend
npm install
```

### 6. Start the Frontend Development Server

From the `frontend` directory, start the React development server.

```bash
npm start
```

The frontend application will typically open in your browser at `http://localhost:3000`.

## Troubleshooting

- **`401 Unauthorized` errors:** Ensure your frontend is correctly sending the authentication token in the `Authorization: Bearer <token>` header after login. Also, verify that your backend server is running without errors.
- **`bcrypt` or `passlib` issues:** If you encounter errors related to `bcrypt` or `passlib`, ensure you are using a compatible Python version (Python 3.12 is recommended). Try explicitly uninstalling and reinstalling these packages for your specific Python executable.
- **`PermissionError` when initializing database:** Ensure no other process is using `event_registrations.db` (e.g., stop the Uvicorn server before running `initialize_db.py`).

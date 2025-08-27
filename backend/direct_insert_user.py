
import sqlite3
import os
import sys

# Add the parent directory to sys.path to allow importing backend modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.database import DATABASE_URL
from backend.auth_utils import get_password_hash

def direct_insert_user(username: str, password: str, is_admin: bool = False):
    db_path = DATABASE_URL.replace("sqlite:///", "")
    conn = None
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        hashed_password = get_password_hash(password)
        normalized_username = username.lower()
        email = f'{normalized_username}@example.com'
        admin_status = 1 if is_admin else 0

        # Check if user already exists
        cursor.execute("SELECT id FROM users WHERE username = ?", (normalized_username,))
        existing_user = cursor.fetchone()

        if existing_user:
            print(f"User '{username}' already exists. Updating admin status.")
            cursor.execute("UPDATE users SET is_admin = ? WHERE username = ?", (admin_status, normalized_username))
        else:
            print(f"Inserting new user '{username}'...")
            cursor.execute("INSERT INTO users (username, email, hashed_password, is_admin, password_change_required) VALUES (?, ?, ?, ?, ?)",
                           (normalized_username, email, hashed_password, admin_status, 0))
        
        conn.commit()
        print(f"User '{username}' inserted/updated successfully via direct SQL.")

    except sqlite3.Error as e:
        print(f"SQLite error: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Directly insert/update a user in the database.")
    parser.add_argument("username", type=str, help="Username to insert/update")
    parser.add_argument("password", type=str, help="Password for the user")
    parser.add_argument("--admin", action="store_true", help="Set user as admin")
    args = parser.parse_args()

    direct_insert_user(args.username, args.password, args.admin)

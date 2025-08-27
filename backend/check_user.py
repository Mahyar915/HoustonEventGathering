
import sys
import os

# Add the parent directory to sys.path to allow importing backend modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.database import SessionLocal
from backend.models import User
from backend.auth_utils import verify_password

def check_user(username: str, password: str):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == username.lower()).first()
        if user:
            print(f"User found: {user.username}")
            print(f"User ID: {user.id}")
            print(f"Is Admin: {user.is_admin}")
            print(f"Hashed Password: {user.hashed_password}")
            
            if verify_password(password, user.hashed_password):
                print("Password verification: SUCCESS")
            else:
                print("Password verification: FAILED")
        else:
            print(f"User '{username}' not found in the database.")
    finally:
        db.close()

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Check user details in the database.")
    parser.add_argument("username", type=str, help="Username to check")
    parser.add_argument("password", type=str, help="Password to verify")
    args = parser.parse_args()

    check_user(args.username, args.password)

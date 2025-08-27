import sys
import os
import time
import argparse
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session

# Add the parent directory to sys.path to allow importing backend modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.database import SessionLocal, engine
from backend.models import User, Base
from backend.auth_utils import get_password_hash

MAX_RETRIES = 5        # Maximum number of retries if database is locked
RETRY_DELAY = 1        # Delay between retries in seconds

def create_admin(db: Session, username: str, password: str):
    """Create or upgrade a user to admin."""
    user = db.query(User).filter(User.username == username).first()
    if user:
        print(f"User {username} already exists.")
        user.is_admin = True
        db.commit()
        print(f"User {username} has been granted admin privileges.")
    else:
        hashed_password = get_password_hash(password)
        admin_user = User(
            username=username,
            hashed_password=hashed_password,
            is_admin=True,
            email=f'{username}@example.com'
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)  # Refresh to get the ID
        print(f"Admin user {username} added to database with ID: {admin_user.id}.")
        print(f"Admin user {username} created successfully.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create an admin user.")
    parser.add_argument("username", type=str, help="Admin username")
    parser.add_argument("password", type=str, help="Admin password")
    args = parser.parse_args()

    for attempt in range(MAX_RETRIES):
        try:
            db = SessionLocal()
            create_admin(db, args.username, args.password)
            db.close()
            break
        except OperationalError as e:
            if "database is locked" in str(e) and attempt < MAX_RETRIES - 1:
                print(f"Database is locked. Retrying in {RETRY_DELAY} second(s)...")
                time.sleep(RETRY_DELAY)
            else:
                raise

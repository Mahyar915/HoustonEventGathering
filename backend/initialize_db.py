
import os
import sys

# Add the parent directory to sys.path to allow importing backend modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.database import Base, engine, DATABASE_URL
from backend.models import User, Registration, Image, Reaction # Import all models

def initialize_database():
    print("Attempting to create database tables...")
    
    # Extract the file path from the DATABASE_URL
    # Assuming DATABASE_URL is in the format "sqlite:///path/to/db.db"
    db_file_path = DATABASE_URL.replace("sqlite:///", "")
    
    # Delete existing database file if it exists
    if os.path.exists(db_file_path):
        print(f"Deleting existing database file: {db_file_path}")
        os.remove(db_file_path)
    
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully (if they didn't exist).")
    print(f"Database file path: {db_file_path}")

if __name__ == "__main__":
    initialize_database()

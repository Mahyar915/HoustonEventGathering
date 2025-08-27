import smtplib
import os
import random
import string
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta

def generate_otp(length=6):
    """Generate a random OTP of specified length."""
    characters = string.digits
    otp = ''.join(random.choice(characters) for i in range(length))
    return otp

def send_otp_email(recipient_email: str, otp: str):
    """Sends an OTP to the recipient's email address."""
    SMTP_SERVER = os.getenv("SMTP_SERVER")
    SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
    SMTP_USERNAME = os.getenv("SMTP_USERNAME")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
    SENDER_EMAIL = os.getenv("SENDER_EMAIL")

    if not all([SMTP_SERVER, SMTP_USERNAME, SMTP_PASSWORD, SENDER_EMAIL]):
        print("Email sending skipped: SMTP configuration missing in environment variables.")
        print(f"Recipient: {recipient_email}, OTP: {otp}")
        return False

    msg = MIMEMultipart()
    msg['From'] = SENDER_EMAIL
    msg['To'] = recipient_email
    msg['Subject'] = "Your One-Time Password (OTP) for Registration"

    body = f"""
    Hello,

    Your One-Time Password (OTP) for registration is:

    {otp}

    This OTP is valid for 5 minutes. Please do not share it with anyone.

    If you did not request this, please ignore this email.

    Thank you,
    Poker Night Team
    """
    msg.attach(MIMEText(body, 'plain'))

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls() # Secure the connection
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
        print(f"OTP email sent to {recipient_email}")
        return True
    except Exception as e:
        print(f"Failed to send OTP email to {recipient_email}: {e}")
        return False

def send_password_reset_email(recipient_email: str, username: str, reset_token: str):
    """Sends a password reset link to the recipient's email address."""
    SMTP_SERVER = os.getenv("SMTP_SERVER")
    SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
    SMTP_USERNAME = os.getenv("SMTP_USERNAME")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
    SENDER_EMAIL = os.getenv("SENDER_EMAIL")

    if not all([SMTP_SERVER, SMTP_USERNAME, SMTP_PASSWORD, SENDER_EMAIL]):
        print("Email sending skipped: SMTP configuration missing in environment variables.")
        print(f"Recipient: {recipient_email}, Reset Token: {reset_token}")
        return False

    # Assuming your frontend is running on http://localhost:3000
    reset_link = f"http://localhost:3000/reset-password?token={reset_token}"

    msg = MIMEMultipart()
    msg['From'] = SENDER_EMAIL
    msg['To'] = recipient_email
    msg['Subject'] = "Password Reset Request"

    display_name = username if username else "there"
    body = f"""
    Hello {display_name},

    You have requested to reset your password.

    Please click on the following link to reset your password:

    {reset_link}

    This link is valid for 1 hour. If you did not request a password reset, please ignore this email.

    Thank you,
    Poker Night Team
    """
    msg.attach(MIMEText(body, 'plain'))

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls() # Secure the connection
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
        print(f"Password reset email sent to {recipient_email}")
        return True
    except Exception as e:
        print(f"Failed to send password reset email to {recipient_email}: {e}")
        return False

# Example usage (for testing purposes, not part of the main app logic)
if __name__ == "__main__":
    # For testing, set these environment variables or replace with actual values
    # os.environ["SMTP_SERVER"] = "smtp.example.com"
    # os.environ["SMTP_PORT"] = "587"
    # os.environ["SMTP_USERNAME"] = "your_email@example.com"
    # os.environ["SMTP_PASSWORD"] = "your_email_password"
    # os.environ["SENDER_EMAIL"] = "your_email@example.com"

    test_otp = generate_otp()
    print(f"Generated OTP: {test_otp}")
    # send_otp_email("test@example.com", test_otp) # Uncomment to test sending
    # send_password_reset_email("test@example.com", "some_reset_token") # Uncomment to test sending

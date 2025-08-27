from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from pydantic import BaseModel # Import BaseModel
from .database import Base

class TokenData(BaseModel):
    username: str | None = None

class Registration(Base):
    __tablename__ = "registrations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    guests = Column(Integer, default=0)
    user_id = Column(Integer, ForeignKey("users.id")) # Link to User

    owner = relationship("User", back_populates="registrations") # Relationship to User

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=True) # Username can be null initially
    email = Column(String, unique=True, index=True) # New: Email field
    hashed_password = Column(String)
    otp = Column(String, nullable=True) # New: One-Time Password
    otp_expires_at = Column(DateTime, nullable=True) # New: OTP expiration time
    password_change_required = Column(Boolean, default=False) # New: Flag for forced password change
    reset_token = Column(String, nullable=True) # New: Password reset token
    reset_token_expires_at = Column(DateTime, nullable=True) # New: Password reset token expiration time
    is_admin = Column(Boolean, default=False)

    registrations = relationship("Registration", back_populates="owner") # Relationship to Registration
    images = relationship("Image", back_populates="owner") # Relationship to Image
    reactions = relationship("Reaction", back_populates="owner")
    votes = relationship("Vote", back_populates="owner")
    likes = relationship("Like", back_populates="owner")

class Image(Base):
    __tablename__ = "images"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    caption = Column(String)
    user_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="images")
    reactions = relationship("Reaction", back_populates="image")
    likes = relationship("Like", back_populates="image")

class Reaction(Base):
    __tablename__ = "reactions"

    id = Column(Integer, primary_key=True, index=True)
    emoji = Column(String)
    user_id = Column(Integer, ForeignKey("users.id"))
    image_id = Column(Integer, ForeignKey('images.id'))

    owner = relationship("User", back_populates="reactions")
    image = relationship("Image", back_populates="reactions")

class Like(Base):
    __tablename__ = "likes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    image_id = Column(Integer, ForeignKey("images.id"))

    owner = relationship("User", back_populates="likes")
    image = relationship("Image", back_populates="likes")

class Vote(Base):
    __tablename__ = 'votes'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    event_date = Column(String, nullable=False)
    month = Column(String, nullable=False)

    owner = relationship("User", back_populates="votes")
from fastapi import FastAPI, Depends, HTTPException, status, Body
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from datetime import datetime, timedelta
from typing import Optional, List
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, constr
import random
import string
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Construct the path to the .env file
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path=dotenv_path)


from . import auth_utils, models, database, email_utils
from .database import engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.mount("/static", StaticFiles(directory="uploads"), name="static")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

class UserCreate(BaseModel):
    email: EmailStr
    username: constr(min_length=3)
    password: constr(min_length=8)




class SimplifiedRegistrationBody(BaseModel):
    email: EmailStr
    otp: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None

@app.post("/register_simplified/", status_code=status.HTTP_200_OK)
async def register_simplified(body: SimplifiedRegistrationBody, db: Session = Depends(database.get_db)):
    # Case 1: Requesting OTP
    if not body.otp and not body.username and not body.password:
        user = db.query(models.User).filter(models.User.email == body.email).first()
        if user and user.username: # User exists and is fully registered
            raise HTTPException(status_code=400, detail="Email already registered.")

        otp = ''.join(random.choices(string.digits, k=6))
        otp_expires_at = datetime.utcnow() + timedelta(minutes=10)

        if not user: # New user
            new_user = models.User(
                email=body.email,
                otp=otp,
                otp_expires_at=otp_expires_at,
                password_change_required=True
            )
            db.add(new_user)
        else: # User exists but is not fully registered
            user.otp = otp
            user.otp_expires_at = otp_expires_at

        db.commit()

        try:
            email_utils.send_otp_email(body.email, otp)
            return {"message": "OTP sent to your email."}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to send OTP email: {e}")

    # Case 2: Verifying OTP and completing registration
    elif body.otp and body.username and body.password:
        user = db.query(models.User).filter(models.User.email == body.email).first()

        if not user:
            raise HTTPException(status_code=404, detail="User not found. Please request an OTP first.")

        if user.otp != body.otp or user.otp_expires_at < datetime.utcnow():
            raise HTTPException(status_code=400, detail="Invalid or expired OTP.")

        existing_user = db.query(models.User).filter(models.User.username == body.username).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Username is already taken.")

        user.username = body.username
        user.hashed_password = auth_utils.get_password_hash(body.password)
        user.otp = None
        user.otp_expires_at = None
        user.password_change_required = False
        db.commit()

        return {"message": "Registration successful! You can now log in."}

    # Case 3: Invalid request
    else:
        raise HTTPException(status_code=400, detail="Invalid request. Please provide either just an email to request an OTP, or email, OTP, username, and password to register.")


@app.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = auth_utils.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth_utils.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth_utils.create_access_token(
        data={"user_id": user.id}, is_admin=user.is_admin, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


class RegistrationData(BaseModel):
    name: str
    guests: int

class RegistrationInfo(RegistrationData):
    id: int
    user_id: int

    class Config:
        orm_mode = True

from fastapi import FastAPI, Depends, HTTPException, status, Body, File, UploadFile, Response
import shutil
from sqlalchemy.orm import joinedload

# Create uploads directory if it doesn't exist
UPLOADS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

class ReactionInfo(BaseModel):
    id: int
    emoji: str
    user_id: int
    image_id: int

    class Config:
        orm_mode = True

class LikeInfo(BaseModel):
    id: int
    user_id: int
    image_id: int

    class Config:
        orm_mode = True

class ImageInfo(BaseModel):
    id: int
    filename: str
    caption: str
    user_id: int
    reactions: List[ReactionInfo] = [] # Include reactions
    likes: List[LikeInfo] = [] # Include likes
    has_liked: bool = False # New field to indicate if current user has liked

    class Config:
        orm_mode = True

@app.post("/images/", response_model=ImageInfo, status_code=status.HTTP_201_CREATED)
async def upload_image(file: UploadFile = File(...), caption: str = Body(...), db: Session = Depends(database.get_db), current_user: models.User = Depends(auth_utils.admin_required)):
    file_path = os.path.join(UPLOADS_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    new_image = models.Image(filename=file.filename, caption=caption, owner=current_user)
    db.add(new_image)
    db.commit()
    db.refresh(new_image)
    return new_image

@app.get("/images/", response_model=List[ImageInfo])
async def get_images(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth_utils.get_current_user)):
    images = db.query(models.Image).options(joinedload(models.Image.reactions), joinedload(models.Image.likes)).all()
    # For each image, add a 'has_liked' field indicating if the current user has liked it
    for image in images:
        image.has_liked = any(like.user_id == current_user.id for like in image.likes)
    return images

@app.delete("/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_image(image_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth_utils.admin_required)):
    db_image = db.query(models.Image).filter(models.Image.id == image_id).first()
    if db_image is None:
        raise HTTPException(status_code=404, detail="Image not found")

    # Optional: Delete the actual file from the uploads directory
    file_path = os.path.join(UPLOADS_DIR, db_image.filename)
    if os.path.exists(file_path):
        os.remove(file_path)

    db.delete(db_image)
    db.commit()
    return {"ok": True}

class UserPublic(BaseModel):
    id: int
    username: str
    email: EmailStr
    is_admin: bool

    class Config:
        orm_mode = True

@app.get("/users/", response_model=List[UserPublic])
async def get_users(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth_utils.admin_required)):
    users = db.query(models.User).all()
    return users

@app.put("/users/{user_id}/set-admin", response_model=UserPublic)
async def set_user_admin_status(user_id: int, is_admin: bool, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth_utils.admin_required)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_admin = is_admin
    db.commit()
    db.refresh(user)
    return user

class VoteAdminInfo(BaseModel):
    id: int
    event_date: str
    month: str
    owner: UserPublic

    class Config:
        orm_mode = True

@app.get("/admin/votes", response_model=List[VoteAdminInfo])
async def get_all_votes(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth_utils.admin_required)):
    votes = db.query(models.Vote).options(joinedload(models.Vote.owner)).all()
    return votes

@app.get("/backgrounds", response_model=List[str])
async def get_background_images():
    background_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", "BackgroundLogin")
    if not os.path.exists(background_dir):
        raise HTTPException(status_code=404, detail="Backgrounds directory not found")
    
    images = [f for f in os.listdir(background_dir) if os.path.isfile(os.path.join(background_dir, f))]
    return images

class VoteCreate(BaseModel):
    event_date: str
    month: str

class VoteInfo(VoteCreate):
    id: int
    user_id: int

    class Config:
        orm_mode = True

@app.get("/votes/{month}", response_model=List[VoteInfo])
async def get_votes(month: str, db: Session = Depends(database.get_db)):
    votes = db.query(models.Vote).filter(models.Vote.month == month).all()
    return votes

@app.get("/votes/my-votes", response_model=List[VoteInfo])
async def get_my_votes(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth_utils.get_current_user)):
    votes = db.query(models.Vote).filter(models.Vote.user_id == current_user.id).all()
    return votes

@app.post("/votes")
async def cast_vote(vote: VoteCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth_utils.get_current_user)):
    # Check if the user has already voted for this exact date
    existing_vote = db.query(models.Vote).filter(
        models.Vote.user_id == current_user.id,
        models.Vote.event_date == vote.event_date
    ).first()

    if existing_vote:
        # User has already voted for this date, so we delete the vote (un-vote)
        db.delete(existing_vote)
        db.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    else:
        # Create a new vote
        new_vote = models.Vote(**vote.dict(), owner=current_user)
        db.add(new_vote)
        db.commit()
        db.refresh(new_vote)
        return new_vote

@app.post("/images/{image_id}/like", status_code=status.HTTP_204_NO_CONTENT)
async def like_image(image_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth_utils.get_current_user)):
    db_image = db.query(models.Image).filter(models.Image.id == image_id).first()
    if db_image is None:
        raise HTTPException(status_code=404, detail="Image not found")

    existing_like = db.query(models.Like).filter(
        models.Like.user_id == current_user.id,
        models.Like.image_id == image_id
    ).first()

    if existing_like:
        db.delete(existing_like)
    else:
        new_like = models.Like(user_id=current_user.id, image_id=image_id)
        db.add(new_like)

    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

class ReactionBody(BaseModel):
    emoji: str

@app.post("/images/{image_id}/react", status_code=status.HTTP_204_NO_CONTENT)
async def react_to_image(image_id: int, reaction: ReactionBody, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth_utils.get_current_user)):
    db_image = db.query(models.Image).filter(models.Image.id == image_id).first()
    if db_image is None:
        raise HTTPException(status_code=404, detail="Image not found")

    # Check if user has already reacted with this emoji to this image
    existing_reaction = db.query(models.Reaction).filter(
        models.Reaction.user_id == current_user.id,
        models.Reaction.image_id == image_id,
        models.Reaction.emoji == reaction.emoji
    ).first()

    if existing_reaction:
        db.delete(existing_reaction)
    else:
        new_reaction = models.Reaction(
            emoji=reaction.emoji,
            user_id=current_user.id,
            image_id=image_id
        )
        db.add(new_reaction)

    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@app.get("/registrations/", response_model=List[RegistrationInfo])
class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    token: str
    new_password: constr(min_length=8)

@app.post("/request-password-reset/", status_code=status.HTTP_200_OK)
async def request_password_reset(body: PasswordResetRequest, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == body.email).first()
    if not user:
        # Even if the user is not found, we send a generic success message
        # to avoid revealing which emails are registered in the system.
        return {"message": "If an account with this email exists, a password reset link has been sent."}

    # Generate a unique, secure token
    reset_token = ''.join(random.choices(string.ascii_letters + string.digits, k=32))
    user.reset_token = reset_token
    user.reset_token_expires_at = datetime.utcnow() + timedelta(hours=1)
    db.commit()

    try:
        email_utils.send_password_reset_email(user.email, user.username, reset_token)
        return {"message": "If an account with this email exists, a password reset link has been sent."}
    except Exception as e:
        # Log the error, but still send a generic message to the user
        print(f"Failed to send password reset email: {e}")
        # Potentially re-raise or handle more gracefully depending on production needs
        raise HTTPException(status_code=500, detail="Failed to send password reset email.")


@app.post("/reset-password/", status_code=status.HTTP_200_OK)
async def reset_password(body: PasswordReset, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.reset_token == body.token).first()

    if not user or user.reset_token_expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired password reset token.")

    user.hashed_password = auth_utils.get_password_hash(body.new_password)
    user.reset_token = None
    user.reset_token_expires_at = None
    db.commit()

    return {"message": "Your password has been successfully reset."}

async def get_registrations(db: Session = Depends(database.get_db)):
    registrations = db.query(models.Registration).all()
    return registrations

@app.post("/registrations/", response_model=RegistrationInfo, status_code=status.HTTP_201_CREATED)
async def create_registration(registration: RegistrationData, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth_utils.get_current_user)):
    new_registration = models.Registration(**registration.dict(), owner=current_user)
    db.add(new_registration)
    db.commit()
    db.refresh(new_registration)
    return new_registration

@app.put("/registrations/{registration_id}", response_model=RegistrationInfo)
async def update_registration(registration_id: int, registration: RegistrationData, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth_utils.get_current_user)):
    db_registration = db.query(models.Registration).filter(models.Registration.id == registration_id).first()
    if db_registration is None:
        raise HTTPException(status_code=404, detail="Registration not found")
    if db_registration.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this registration")
    for var, value in vars(registration).items():
        setattr(db_registration, var, value) if value else None
    db.commit()
    db.refresh(db_registration)
    return db_registration

@app.get("/")
async def read_root():
    return {"message": "Hello World - Event Registration App"}

@app.delete("/registrations/{registration_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_registration(registration_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth_utils.get_current_user)):
    db_registration = db.query(models.Registration).filter(models.Registration.id == registration_id).first()
    if db_registration is None:
        raise HTTPException(status_code=404, detail="Registration not found")
    if db_registration.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this registration")
    db.delete(db_registration)
    db.commit()
    return {"ok": True}
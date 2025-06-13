from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from backend.app.db import crud, schemas, models
from backend.app.db.database import get_db
from backend.app.core.security import decode_access_token
from fastapi.security import OAuth2PasswordBearer

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token") # Adjusted tokenUrl

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    email: str = payload.get("sub")
    user_id: int = payload.get("user_id")
    if email is None or user_id is None:
        raise credentials_exception
    user = crud.get_user(db, user_id=user_id)
    if user is None or user.email != email:
        raise credentials_exception
    return user

@router.get("/me", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.get("/contacts", response_model=List[schemas.User])
async def get_contacts_for_new_chat(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
):
    """Get a list of users, excluding the current user, to start a new chat with."""
    users = crud.get_users(db, skip=skip, limit=limit, current_user_id=current_user.id)
    return users

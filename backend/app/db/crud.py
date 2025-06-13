from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func
from typing import List, Optional

from . import models, schemas
from app.core.security import get_password_hash

def get_user(db: Session, user_id: int) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()

def get_users(db: Session, skip: int = 0, limit: int = 100, current_user_id: Optional[int] = None) -> List[models.User]:
    query = db.query(models.User)
    if current_user_id:
        query = query.filter(models.User.id != current_user_id)
    return query.offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    hashed_password = get_password_hash(user.password)
    db_user = models.User(email=user.email, full_name=user.full_name, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# Chat CRUD operations
def get_chat(db: Session, chat_id: int, user_id: int) -> Optional[models.Chat]:
    # Ensure user is part of the chat
    return (
        db.query(models.Chat)
        .options(joinedload(models.Chat.participants).joinedload(models.ChatParticipant.user), joinedload(models.Chat.messages).joinedload(models.Message.sender))
        .join(models.ChatParticipant, models.ChatParticipant.chat_id == models.Chat.id)
        .filter(models.Chat.id == chat_id, models.ChatParticipant.user_id == user_id)
        .first()
    )

def get_chats_for_user(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[models.Chat]:
    return (
        db.query(models.Chat)
        .join(models.ChatParticipant, models.ChatParticipant.chat_id == models.Chat.id)
        .filter(models.ChatParticipant.user_id == user_id)
        .order_by(models.Chat.updated_at.desc())
        .options(joinedload(models.Chat.participants).joinedload(models.ChatParticipant.user))
        # .options(joinedload(models.Chat.messages).joinedload(models.Message.sender).limit(1).order_by(models.Message.created_at.desc())) # For last message, more complex
        .offset(skip)
        .limit(limit)
        .all()
    )

def create_chat(db: Session, chat_data: schemas.ChatCreate, creator_id: int) -> models.Chat:
    # For 1-on-1, check if chat already exists
    if chat_data.chat_type == models.ChatType.ONE_ON_ONE and len(chat_data.participant_ids) == 1:
        other_user_id = chat_data.participant_ids[0]
        # Query to find a 1-on-1 chat involving both the creator and the other user
        # This query needs to ensure that there's a chat of type ONE_ON_ONE
        # and it has exactly two participants: creator_id and other_user_id.
        q = (
            db.query(models.Chat)
            .join(models.Chat.participants.of_type(models.ChatParticipant))
            .filter(models.Chat.chat_type == models.ChatType.ONE_ON_ONE)
            .filter(
                or_(
                    models.ChatParticipant.user_id == creator_id,
                    models.ChatParticipant.user_id == other_user_id
                )
            )
            .group_by(models.Chat.id)
            .having(func.count(models.ChatParticipant.user_id) == 2) # Ensure only these two users
            # Further filter to ensure *both* are present
            .filter(db.query(models.ChatParticipant).filter(models.ChatParticipant.chat_id == models.Chat.id, models.ChatParticipant.user_id == creator_id).exists())
            .filter(db.query(models.ChatParticipant).filter(models.ChatParticipant.chat_id == models.Chat.id, models.ChatParticipant.user_id == other_user_id).exists())
        )
        existing_chat = q.first()

        if existing_chat:
            return db.query(models.Chat).options(joinedload(models.Chat.participants).joinedload(models.ChatParticipant.user)).filter(models.Chat.id == existing_chat.id).first()

    db_chat = models.Chat(name=chat_data.name, chat_type=chat_data.chat_type, creator_id=creator_id)
    db.add(db_chat)
    db.flush()  # To get db_chat.id

    # Add creator as participant
    db_creator_participant = models.ChatParticipant(chat_id=db_chat.id, user_id=creator_id)
    db.add(db_creator_participant)

    # Add other participants
    for user_id in chat_data.participant_ids:
        if user_id != creator_id: # Ensure creator is not added twice if included in participant_ids
            # Avoid adding duplicate participants if one_on_one check above didn't catch an edge case
            exists = db.query(models.ChatParticipant).filter_by(chat_id=db_chat.id, user_id=user_id).first()
            if not exists:
                db_participant = models.ChatParticipant(chat_id=db_chat.id, user_id=user_id)
                db.add(db_participant)
    
    # For BOT chats, if gemini bot needs a user ID, ensure it's handled or a specific bot user exists
    if chat_data.chat_type == models.ChatType.BOT:
        # Potentially add a predefined bot user as a participant if needed
        pass 

    db.commit()
    db.refresh(db_chat)
    # Eager load participants and their user objects for the response
    return db.query(models.Chat).options(joinedload(models.Chat.participants).joinedload(models.ChatParticipant.user)).filter(models.Chat.id == db_chat.id).first()

# Message CRUD operations
def create_message(db: Session, message_data: schemas.MessageCreate, chat_id: int, sender_id: int, is_bot_message: bool = False) -> models.Message:
    db_message = models.Message(
        chat_id=chat_id, 
        sender_id=sender_id, 
        content=message_data.content,
        is_bot_message=is_bot_message
    )
    db.add(db_message)
    
    # Update chat's updated_at timestamp
    db.query(models.Chat).filter(models.Chat.id == chat_id).update({models.Chat.updated_at: func.now()}, synchronize_session=False)
    
    db.commit()
    db.refresh(db_message)
    # Eager load sender for the response
    return db.query(models.Message).options(joinedload(models.Message.sender)).filter(models.Message.id == db_message.id).first()

def get_messages_for_chat(db: Session, chat_id: int, user_id: int, skip: int = 0, limit: int = 100) -> List[models.Message]:
    # Ensure user is part of the chat before fetching messages
    chat_participant = db.query(models.ChatParticipant).filter(
        models.ChatParticipant.chat_id == chat_id,
        models.ChatParticipant.user_id == user_id
    ).first()
    if not chat_participant:
        return [] # Or raise HTTPException(status_code=403, detail="Not a participant of this chat")

    return (
        db.query(models.Message)
        .filter(models.Message.chat_id == chat_id)
        .order_by(models.Message.created_at.asc())
        .options(joinedload(models.Message.sender))
        .offset(skip)
        .limit(limit)
        .all()
    )

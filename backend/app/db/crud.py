from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func, select, and_, exists # Added select, and_, exists
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
        .options(joinedload(models.Chat.participants).joinedload(models.ChatParticipant.user), 
                 joinedload(models.Chat.messages).joinedload(models.Message.sender),
                 joinedload(models.Chat.creator) # Eager load creator
                 )
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
        .options(joinedload(models.Chat.participants).joinedload(models.ChatParticipant.user),
                 joinedload(models.Chat.creator) # Eager load creator
        )
        .offset(skip)
        .limit(limit)
        .all()
    )

def create_chat(db: Session, chat_data: schemas.ChatCreate, creator_id: int) -> models.Chat:
    if chat_data.chat_type == models.ChatType.ONE_ON_ONE and len(chat_data.participant_ids) == 1:
        other_user_id = chat_data.participant_ids[0]

        if creator_id == other_user_id:
            # This handles a user trying to create a 1-on-1 chat with themselves.
            # The current logic will proceed to create a chat with only the creator as a participant.
            # If this specific scenario for ONE_ON_ONE should be disallowed, raise an HTTPException here.
            pass 

        # Query to find an existing one-on-one chat between creator_id and other_user_id
        # A chat is a candidate if:
        # 1. It's of type ONE_ON_ONE.
        # 2. It has creator_id as a participant.
        # 3. It has other_user_id as a participant.
        # 4. It has exactly two participants in total.
        creator_chats_subquery = (
            select(models.ChatParticipant.chat_id)
            .where(models.ChatParticipant.user_id == creator_id)
            .distinct()
        )
        other_user_chats_subquery = (
            select(models.ChatParticipant.chat_id)
            .where(models.ChatParticipant.user_id == other_user_id)
            .distinct()
        )

        existing_chat_query = (
            db.query(models.Chat)
            .filter(models.Chat.chat_type == models.ChatType.ONE_ON_ONE)
            .filter(models.Chat.id.in_(creator_chats_subquery))
            .filter(models.Chat.id.in_(other_user_chats_subquery))
            .join(models.Chat.participants) # Join to count participants
            .group_by(models.Chat.id)
            .having(func.count(models.ChatParticipant.id) == 2)
        )
        existing_chat = existing_chat_query.first()

        if existing_chat:
            # Eager load participants and their user objects, and creator
            return db.query(models.Chat).options(
                joinedload(models.Chat.participants).joinedload(models.ChatParticipant.user),
                joinedload(models.Chat.creator)
            ).filter(models.Chat.id == existing_chat.id).first()

    db_chat = models.Chat(name=chat_data.name, chat_type=chat_data.chat_type, creator_id=creator_id)
    db.add(db_chat)
    db.flush()  # To get db_chat.id

    # Add creator as participant
    db_creator_participant = models.ChatParticipant(chat_id=db_chat.id, user_id=creator_id)
    db.add(db_creator_participant)

    # Add other participants
    for user_id in chat_data.participant_ids:
        if user_id != creator_id: 
            exists_participant = db.query(models.ChatParticipant).filter_by(chat_id=db_chat.id, user_id=user_id).first()
            if not exists_participant:
                db_participant = models.ChatParticipant(chat_id=db_chat.id, user_id=user_id)
                db.add(db_participant)
    
    if chat_data.chat_type == models.ChatType.BOT:
        # If a specific bot user needs to be added as a participant automatically:
        # bot_user = get_user_by_email(db, email=settings.GEMINI_BOT_EMAIL_ID) # Assuming settings has GEMINI_BOT_EMAIL_ID
        # if bot_user and bot_user.id not in chat_data.participant_ids and bot_user.id != creator_id:
        #     exists_bot_participant = db.query(models.ChatParticipant).filter_by(chat_id=db_chat.id, user_id=bot_user.id).first()
        #     if not exists_bot_participant:
        #         db_bot_participant = models.ChatParticipant(chat_id=db_chat.id, user_id=bot_user.id)
        #         db.add(db_bot_participant)
        pass 

    db.commit()
    db.refresh(db_chat)
    # Eager load participants and their user objects for the response
    return db.query(models.Chat).options(
        joinedload(models.Chat.participants).joinedload(models.ChatParticipant.user),
        joinedload(models.Chat.creator) # Eager load creator as well
    ).filter(models.Chat.id == db_chat.id).first()

# Message CRUD operations
def create_message(db: Session, message_data: schemas.MessageCreate, chat_id: int, sender_id: int, is_bot_message: bool = False) -> models.Message:
    db_message = models.Message(
        chat_id=chat_id, 
        sender_id=sender_id, 
        content=message_data.content,
        is_bot_message=is_bot_message
    )
    db.add(db_message)
    
    db.query(models.Chat).filter(models.Chat.id == chat_id).update({models.Chat.updated_at: func.now()}, synchronize_session=False)
    
    db.commit()
    db.refresh(db_message)
    return db.query(models.Message).options(joinedload(models.Message.sender)).filter(models.Message.id == db_message.id).first()

def get_messages_for_chat(db: Session, chat_id: int, user_id: int, skip: int = 0, limit: int = 100) -> List[models.Message]:
    chat_participant = db.query(models.ChatParticipant).filter(
        models.ChatParticipant.chat_id == chat_id,
        models.ChatParticipant.user_id == user_id
    ).first()
    if not chat_participant:
        return [] 

    return (
        db.query(models.Message)
        .filter(models.Message.chat_id == chat_id)
        .order_by(models.Message.created_at.asc())
        .options(joinedload(models.Message.sender))
        .offset(skip)
        .limit(limit)
        .all()
    )

from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
from ..db.models import ChatType # Import ChatType enum from models

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int

    class Config:
        orm_mode = True

class UserInDB(User):
    hashed_password: str

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Chat Participant Schemas
class ChatParticipantBase(BaseModel):
    user_id: int

class ChatParticipant(ChatParticipantBase):
    # id: int # The association object might not need its own ID exposed here if user_id/chat_id is key
    # chat_id: int # Contextual, usually known when fetching participants for a chat
    joined_at: datetime
    user: User # Nested User schema to provide participant details

    class Config:
        orm_mode = True

# Message Schemas
class MessageBase(BaseModel):
    content: str

class MessageCreate(MessageBase):
    # chat_id will be provided as a path parameter or in context, not in request body for message creation itself typically
    pass # Content is the main part of creation schema, chat_id taken from path

class Message(MessageBase):
    id: int
    sender_id: int
    chat_id: int
    timestamp: datetime
    is_bot_message: bool = False
    sender: User # Nested User schema for sender details

    class Config:
        orm_mode = True

# Chat Schemas
class ChatBase(BaseModel):
    name: Optional[str] = None # Optional name, e.g., for group chats
    type: ChatType

class ChatCreate(ChatBase):
    participant_ids: List[int] # List of user IDs to include in the chat (excluding creator, who is implicit)

class Chat(ChatBase):
    id: int
    creator_id: int
    created_at: datetime
    updated_at: datetime
    creator: User # Nested User schema for creator details
    participants: List[ChatParticipant] = [] # List of participants in the chat
    # messages: List[Message] = [] # Typically messages are paginated and fetched separately
    # last_message: Optional[Message] = None # For dashboard, might be populated by a specific query

    class Config:
        orm_mode = True

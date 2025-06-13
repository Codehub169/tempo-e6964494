from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime
from backend.app.db.models import ChatType # Import ChatType enum from models

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_bot: Optional[bool] = False

    class Config:
        from_attributes = True # Changed from orm_mode for Pydantic v2

class UserInDB(User):
    hashed_password: str

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[int] = None

# Chat Participant Schemas
class ChatParticipantBase(BaseModel):
    user_id: int

class ChatParticipant(ChatParticipantBase):
    joined_at: datetime
    user: User # Nested User schema to provide participant details

    class Config:
        from_attributes = True

# Message Schemas
class MessageBase(BaseModel):
    content: str

class MessageCreate(MessageBase):
    pass

class Message(MessageBase):
    id: int
    sender_id: int
    chat_id: int
    created_at: datetime = Field(default_factory=datetime.utcnow) # Renamed from timestamp
    is_bot_message: bool = False
    sender: Optional[User] = None # Nested User schema for sender details, make optional if sender might not always be fetched

    class Config:
        from_attributes = True

# Chat Schemas
class ChatBase(BaseModel):
    name: Optional[str] = None
    chat_type: ChatType = Field(..., alias='type') # Alias 'type' to 'chat_type'

    class Config:
        populate_by_name = True # Allows using 'type' in input data

class ChatCreate(ChatBase):
    # For 1-on-1, participant_ids should contain the other user's ID.
    # For group, list of all user IDs (excluding creator, or creator can be in it, handled by backend).
    # For bot, participant_ids might be empty if it's a direct chat with a globally defined bot,
    # or could contain the bot's user ID if bots are treated as regular users.
    participant_ids: List[int] = [] 

class Chat(ChatBase):
    id: int
    creator_id: Optional[int] = None # Made optional as some system chats might not have a creator
    created_at: datetime
    updated_at: datetime
    creator: Optional[User] = None # Nested User schema for creator details
    participants: List[ChatParticipant] = []
    messages: List[Message] = [] # To include messages when fetching chat details
    # last_message: Optional[Message] = None 

    class Config:
        from_attributes = True

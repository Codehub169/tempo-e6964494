from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLAlchemyEnum, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from backend.app.db.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), index=True)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    # Relationships
    created_chats = relationship("Chat", back_populates="creator", foreign_keys="Chat.creator_id")
    messages = relationship("Message", back_populates="sender")
    chat_participations = relationship("ChatParticipant", back_populates="user")

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}')>"

class ChatType(str, enum.Enum):
    ONE_ON_ONE = "one_on_one"
    GROUP = "group"
    BOT = "bot"

class Chat(Base):
    __tablename__ = "chats"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True, nullable=True)  # For group chats or named 1-on-1s
    chat_type = Column(SQLAlchemyEnum(ChatType, name="chat_type_enum"), nullable=False)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Nullable if bot creates chat or system chat
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    # Relationships
    creator = relationship("User", back_populates="created_chats")
    messages = relationship("Message", back_populates="chat", order_by="Message.created_at", cascade="all, delete-orphan")
    participants = relationship("ChatParticipant", back_populates="chat", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Chat(id={self.id}, name='{self.name}', type='{self.chat_type}')>"

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(Integer, ForeignKey("chats.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False) # Can be a human user or a bot user (if bot has a user entry)
    content = Column(Text, nullable=False)
    is_bot_message = Column(Boolean, default=False, nullable=False) # True if message is from Gemini Bot
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    chat = relationship("Chat", back_populates="messages")
    sender = relationship("User", back_populates="messages")

    def __repr__(self):
        return f"<Message(id={self.id}, chat_id={self.chat_id}, sender_id={self.sender_id})>"

class ChatParticipant(Base):
    __tablename__ = "chat_participants"

    id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(Integer, ForeignKey("chats.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    # Future enhancements: last_read_timestamp, is_admin for group chats, muted, etc.

    # Relationships
    chat = relationship("Chat", back_populates="participants")
    user = relationship("User", back_populates="chat_participations")

    def __repr__(self):
        return f"<ChatParticipant(id={self.id}, chat_id={self.chat_id}, user_id={self.user_id})>"

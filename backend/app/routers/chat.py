from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session
from typing import List, Dict
import json

from app.db import crud, schemas, models
from app.db.database import get_db
from .users import get_current_user # Adjusted import
from app.services.websocket import manager as websocket_manager
from app.services.gemini import gemini_service
from app.core import security
from app.core.config import settings

router = APIRouter()

@router.post("/", response_model=schemas.Chat)
async def create_new_chat(
    chat_data: schemas.ChatCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if chat_data.type == models.ChatType.BOT and not chat_data.participant_ids:
        pass 

    created_chat = crud.create_chat(db=db, chat_data=chat_data, creator_id=current_user.id)
    if not created_chat:
        raise HTTPException(status_code=500, detail="Could not create chat")
    return created_chat

@router.get("/", response_model=List[schemas.Chat])
async def get_user_chats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
):
    chats = crud.get_chats_for_user(db=db, user_id=current_user.id, skip=skip, limit=limit)
    return chats

@router.get("/{chat_id}", response_model=schemas.Chat)
async def get_chat_details(
    chat_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    chat = crud.get_chat(db=db, chat_id=chat_id, user_id=current_user.id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found or user not a participant")
    chat.messages = crud.get_messages_for_chat(db=db, chat_id=chat_id, user_id=current_user.id, limit=50)
    return chat

@router.post("/{chat_id}/messages", response_model=schemas.Message)
async def send_chat_message(
    chat_id: int,
    message_data: schemas.MessageCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    chat = crud.get_chat(db=db, chat_id=chat_id, user_id=current_user.id)
    if not chat:
        raise HTTPException(status_code=403, detail="User not a participant of this chat")

    db_message = crud.create_message(db=db, message_data=message_data, chat_id=chat_id, sender_id=current_user.id)
    
    message_schema = schemas.Message.model_validate(db_message) # Pydantic V2: from_orm -> model_validate
    await websocket_manager.broadcast_json(message_schema.model_dump(mode='json'), chat_id=chat_id) # Pydantic V2: dict() -> model_dump()

    is_bot_chat = chat.chat_type == models.ChatType.BOT
    mentions_gemini = "@gemini" in message_data.content.lower()

    if is_bot_chat or mentions_gemini:
        recent_messages_db = crud.get_messages_for_chat(db, chat_id=chat_id, user_id=current_user.id, limit=10)
        
        chat_history_for_gemini = []
        for msg_db in recent_messages_db:
            role = 'model' if msg_db.is_bot_message or (msg_db.sender and msg_db.sender.email == settings.GEMINI_BOT_EMAIL_ID) else 'user'
            chat_history_for_gemini.append({'role': role, 'parts': [{'text': msg_db.content}]})
        
        bot_response_text = await gemini_service.generate_bot_response(prompt=message_data.content, chat_history=chat_history_for_gemini)
        
        if bot_response_text:
            bot_user = crud.get_user_by_email(db, email=settings.GEMINI_BOT_EMAIL_ID)
            bot_sender_id = bot_user.id if bot_user else current_user.id 
            if not bot_user:
                 print(f"Warning: Bot user for Gemini ({settings.GEMINI_BOT_EMAIL_ID}) not found. Using current user ID: {current_user.id} as placeholder sender for bot message.")

            bot_message_data = schemas.MessageCreate(content=bot_response_text)
            db_bot_message = crud.create_message(db=db, message_data=bot_message_data, chat_id=chat_id, sender_id=bot_sender_id, is_bot_message=True)
            
            bot_message_schema = schemas.Message.model_validate(db_bot_message) # Pydantic V2: from_orm -> model_validate
            await websocket_manager.broadcast_json(bot_message_schema.model_dump(mode='json'), chat_id=chat_id) # Pydantic V2: dict() -> model_dump()

    return db_message

@router.get("/{chat_id}/messages", response_model=List[schemas.Message])
async def get_chat_messages(
    chat_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 50
):
    messages = crud.get_messages_for_chat(db=db, chat_id=chat_id, user_id=current_user.id, skip=skip, limit=limit)
    return messages

@router.websocket("/ws/{chat_id}/{token}")
async def websocket_endpoint(websocket: WebSocket, chat_id: int, token: str, db: Session = Depends(get_db)):
    try:
        payload = security.decode_access_token(token)
        if payload is None:
            await websocket.close(code=1008)
            return
        user_id: int = payload.get("user_id")
        user = crud.get_user(db, user_id=user_id)
        if not user:
            await websocket.close(code=1008)
            return
    except Exception:
        await websocket.close(code=1008)
        return

    chat_participant = db.query(models.ChatParticipant).filter(
        models.ChatParticipant.chat_id == chat_id,
        models.ChatParticipant.user_id == user.id
    ).first()

    if not chat_participant:
        await websocket.close(code=4003) # Using a more specific close code for 'not participant'
        return

    await websocket_manager.connect(websocket, chat_id)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message_json = json.loads(data)
                if message_json.get("type") == "typing":
                    # Construct user details for typing indicator payload
                    user_details_for_typing = {
                        "id": user.id,
                        "name": user.full_name,
                        # Add avatarUrl if needed by frontend, though it's not strictly in user model by default
                        # "avatarUrl": user.avatar_url or f"https://i.pravatar.cc/150?u={user.email}" 
                    }
                    await websocket_manager.broadcast_json(
                        {"type": "typing_indicator", "chatId": chat_id, "user": user_details_for_typing, "isTyping": message_json.get("isTyping")},
                        chat_id=chat_id,
                        sender_ws=websocket
                    )
            except json.JSONDecodeError:
                 print(f"Received non-JSON WebSocket message from {user.email} in chat {chat_id}: {data}")

    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket, chat_id)
    except Exception as e:
        print(f"Error in WebSocket for chat {chat_id}, user {user.email}: {e}")
        websocket_manager.disconnect(websocket, chat_id)
        # It's good practice to try and close the websocket gracefully if an error occurs
        if not websocket.client_state == websocket.client_state.DISCONNECTED:
            await websocket.close(code=1011) # Internal Error

from fastapi import WebSocket
from typing import Dict, List, Set
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    """Manages active WebSocket connections for chat rooms."""
    def __init__(self):
        # Stores active connections: chat_id -> set of WebSockets
        self.active_connections: Dict[int, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, chat_id: int):
        """Accepts a new WebSocket connection and adds it to the specified chat room."""
        await websocket.accept()
        if chat_id not in self.active_connections:
            self.active_connections[chat_id] = set()
        self.active_connections[chat_id].add(websocket)
        logger.info(f"WebSocket {websocket.client} connected to chat_id {chat_id}")

    def disconnect(self, websocket: WebSocket, chat_id: int):
        """Removes a WebSocket connection from the specified chat room."""
        if chat_id in self.active_connections:
            self.active_connections[chat_id].remove(websocket)
            if not self.active_connections[chat_id]: # Remove chat_id if no connections left
                del self.active_connections[chat_id]
            logger.info(f"WebSocket {websocket.client} disconnected from chat_id {chat_id}")
        else:
            logger.warning(f"Attempted to disconnect WebSocket {websocket.client} from non-existent chat_id {chat_id}")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        """Sends a message to a specific WebSocket connection."""
        try:
            await websocket.send_text(message)
            logger.debug(f"Sent personal message to {websocket.client}: {message[:50]}...")
        except Exception as e:
            logger.error(f"Error sending personal message to {websocket.client}: {e}")

    async def broadcast(self, message: str, chat_id: int, sender_ws: WebSocket = None):
        """
        Broadcasts a message to all connected clients in a specific chat room,
        optionally excluding the sender.
        """
        if chat_id in self.active_connections:
            disconnected_clients = set()
            for connection in self.active_connections[chat_id]:
                if connection != sender_ws:
                    try:
                        await connection.send_text(message)
                        logger.debug(f"Broadcast message to {connection.client} in chat_id {chat_id}: {message[:50]}...")
                    except Exception as e: # E.g., ConnectionClosedOK, ConnectionClosedError
                        logger.warning(f"Error broadcasting to {connection.client} in chat_id {chat_id}, marking for removal: {e}")
                        disconnected_clients.add(connection)
            
            # Clean up disconnected clients from this chat room
            if disconnected_clients:
                self.active_connections[chat_id] -= disconnected_clients
                if not self.active_connections[chat_id]:
                    del self.active_connections[chat_id]
                logger.info(f"Removed {len(disconnected_clients)} disconnected clients from chat_id {chat_id} after broadcast attempt.")
        else:
            logger.info(f"No active connections in chat_id {chat_id} to broadcast message: {message[:50]}...")

    async def broadcast_json(self, data: dict, chat_id: int, sender_ws: WebSocket = None):
        """
        Broadcasts a JSON payload to all connected clients in a specific chat room,
        optionally excluding the sender.
        """
        if chat_id in self.active_connections:
            disconnected_clients = set()
            for connection in self.active_connections[chat_id]:
                if connection != sender_ws:
                    try:
                        await connection.send_json(data)
                        logger.debug(f"Broadcast JSON to {connection.client} in chat_id {chat_id}: {str(data)[:50]}...")
                    except Exception as e:
                        logger.warning(f"Error broadcasting JSON to {connection.client} in chat_id {chat_id}, marking for removal: {e}")
                        disconnected_clients.add(connection)
            
            if disconnected_clients:
                self.active_connections[chat_id] -= disconnected_clients
                if not self.active_connections[chat_id]:
                    del self.active_connections[chat_id]
                logger.info(f"Removed {len(disconnected_clients)} disconnected clients from chat_id {chat_id} after JSON broadcast attempt.")
        else:
            logger.info(f"No active connections in chat_id {chat_id} to broadcast JSON: {str(data)[:50]}...")

# Global instance of ConnectionManager
manager = ConnectionManager()

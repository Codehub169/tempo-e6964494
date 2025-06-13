import google.generativeai as genai
from app.core.config import settings
import logging

# Configure logging
logger = logging.getLogger(__name__)

class GeminiService:
    """Service to interact with the Google Gemini API."""

    def __init__(self):
        """Initializes the Gemini client with API key and model name from settings."""
        if not settings.GEMINI_API_KEY:
            logger.warning("GEMINI_API_KEY not found. GeminiService will not be functional.")
            self.model = None
            return
        
        try:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.model = genai.GenerativeModel(settings.GEMINI_MODEL_NAME)
            logger.info(f"GeminiService initialized with model: {settings.GEMINI_MODEL_NAME}")
        except Exception as e:
            logger.error(f"Error initializing Gemini client: {e}")
            self.model = None

    async def generate_bot_response(self, prompt: str, chat_history: list[dict] = None) -> str:
        """
        Generates a response from the Gemini model based on the given prompt and chat history.

        Args:
            prompt (str): The user's message or query.
            chat_history (list[dict], optional): A list of previous messages in the format 
                                                {'role': 'user'/'model', 'parts': [{'text': message_content}]}.
                                                Defaults to None.

        Returns:
            str: The bot's generated response, or an error message if generation fails.
        """
        if not self.model:
            logger.error("Gemini model not initialized. Cannot generate response.")
            return "I'm sorry, I'm currently unable to process your request."

        try:
            # Construct messages for the API call
            messages = []
            if chat_history:
                for entry in chat_history:
                    # Ensure parts is a list of dicts with 'text' key
                    if isinstance(entry.get('parts'), list) and all(isinstance(p, dict) and 'text' in p for p in entry['parts']):
                        messages.append({'role': entry['role'], 'parts': entry['parts']})
                    elif isinstance(entry.get('parts'), str): # Handle if parts is just a string
                         messages.append({'role': entry['role'], 'parts': [{'text': entry['parts']}]})

            # Add the current user prompt
            messages.append({'role': 'user', 'parts': [{'text': prompt}]})

            # Start a chat session if history is provided, otherwise generate content directly
            if chat_history:
                chat_session = self.model.start_chat(history=messages[:-1]) # history excludes the current prompt
                response = await chat_session.send_message_async(messages[-1]['parts'])
            else:
                response = await self.model.generate_content_async(messages)
            
            # Check for empty or non-text response parts
            if not response.parts:
                logger.warning("Gemini API returned no parts in the response.")
                # Try to access text via response.text as a fallback if available
                if hasattr(response, 'text') and response.text:
                    return response.text
                return "I received an empty response. Could you try rephrasing?"

            # Assuming the first part contains the text response
            # This might need adjustment based on the actual API response structure for chat
            bot_response_text = "".join(part.text for part in response.parts if hasattr(part, 'text'))
            
            if not bot_response_text.strip():
                logger.warning("Gemini API returned empty text in response parts.")
                 # Fallback if specific text extraction fails but response.text might exist
                if hasattr(response, 'text') and response.text:
                    return response.text
                return "I'm not sure how to respond to that. Can you try asking something else?"

            return bot_response_text

        except Exception as e:
            logger.error(f"Error generating bot response from Gemini: {e}")
            # Check for specific feedback from the API if available
            if hasattr(e, 'response') and hasattr(e.response, 'prompt_feedback'):
                logger.error(f"Prompt Feedback: {e.response.prompt_feedback}")
            return f"I encountered an error trying to understand that. Details: {str(e)}"

# Instantiate the service for use in other modules
gemini_service = GeminiService()

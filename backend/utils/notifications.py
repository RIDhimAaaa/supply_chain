# ==============================================================================
# File: utils/notifications.py (Live Twilio Version)
# ==============================================================================
import os
import logging
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

logger = logging.getLogger(__name__)

# --- Initialize the Twilio Client ---
# The client will automatically find the credentials in your environment variables.
try:
    TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID")
    TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN")
    TWILIO_PHONE_NUMBER = os.environ.get("TWILIO_PHONE_NUMBER")

    if not all([TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER]):
        logger.warning("Twilio credentials not fully configured. SMS sending will be disabled.")
        twilio_client = None
    else:
        twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        logger.info("Twilio client initialized successfully.")

except Exception as e:
    logger.error(f"Failed to initialize Twilio client: {e}")
    twilio_client = None


async def send_order_confirmation_sms(phone_number: str, final_cost: float, vendor_name: str):
    """
    Sends a real order confirmation SMS using the Twilio API.
    For hackathon demo: SMS is sent to +91 9877235405 instead of vendor's number.
    """
    # Hackathon demo: Override phone number to send SMS to your number
    demo_phone_number = "+919877235405"
    
    if not twilio_client:
        logger.error("Cannot send SMS: Twilio client is not available.")
        # Fallback to printing the message if Twilio isn't configured
        print("--- TWILIO NOT CONFIGURED - MOCK SMS ---")
        print(f"TO: {demo_phone_number} (Demo override - original: {phone_number})")
        print(f"MESSAGE: Confirmation for {vendor_name}, cost ₹{final_cost:.2f}")
        print("--------------------------------------")
        return False

    # The message in Punjabi, as per the blueprint
    message_body = (
        f"ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ {vendor_name}, Vendor Collective 'ਤੇ ਤੁਹਾਡਾ ਆਰਡਰ ਫਾਈਨਲ ਹੋ ਗਿਆ ਹੈ। "
        f"ਤੁਹਾਡੇ ਵਾਲਿਟ ਤੋਂ ₹{final_cost:.2f} ਕੱਟੇ ਗਏ ਹਨ। ਤੁਹਾਡੀ ਡਿਲੀਵਰੀ ਕੱਲ੍ਹ ਆ ਜਾਵੇਗੀ।"
    )

    try:
        logger.info(f"Attempting to send SMS to {demo_phone_number} (Demo - original vendor: {phone_number})")
        message = twilio_client.messages.create(
            to=demo_phone_number,  # Send to your number for demo
            from_=TWILIO_PHONE_NUMBER,
            body=message_body
        )
        logger.info(f"SMS sent successfully to {demo_phone_number}. SID: {message.sid}")
        return True
    
    except TwilioRestException as e:
        # This will catch errors like an invalid phone number
        logger.error(f"Failed to send SMS to {phone_number}. Twilio error: {e}")
        return False
    except Exception as e:
        logger.error(f"An unexpected error occurred while sending SMS: {e}")
        return False
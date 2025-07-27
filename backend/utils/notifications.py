# ==============================================================================
# File: utils/notifications.py (Enhanced Multi-Directional Notification System)
# ==============================================================================
import os
import logging
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

logger = logging.getLogger(__name__)

# --- Initialize the Twilio Client ---
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
    """Sends order confirmation SMS to vendors."""
    demo_phone_number = "+919877235405"
    
    if not twilio_client:
        print("--- TWILIO NOT CONFIGURED - MOCK SMS ---")
        print(f"TO: {demo_phone_number} (Demo override - original: {phone_number})")
        print(f"MESSAGE: Confirmation for {vendor_name}, cost ₹{final_cost:.2f}")
        print("--------------------------------------")
        return False

    message_body = (
        f"ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ {vendor_name}, Vendor Collective 'ਤੇ ਤੁਹਾਡਾ ਆਰਡਰ ਫਾਈਨਲ ਹੋ ਗਿਆ ਹੈ। "
        f"ਤੁਹਾਡੇ ਵਾਲਿਟ ਤੋਂ ₹{final_cost:.2f} ਕੱਟੇ ਗਏ ਹਨ। ਤੁਹਾਡੀ ਡਿਲੀਵਰੀ ਕੱਲ੍ਹ ਆ ਜਾਵੇਗੀ।"
    )

    try:
        message = twilio_client.messages.create(to=demo_phone_number, from_=TWILIO_PHONE_NUMBER, body=message_body)
        logger.info(f"SMS sent successfully to {demo_phone_number}. SID: {message.sid}")
        return True
    except Exception as e:
        logger.error(f"Failed to send SMS: {e}")
        return False


async def send_supplier_notification_sms(phone_number: str, total_orders: int, products_summary: str, supplier_name: str):
    """Notify suppliers about new orders."""
    demo_phone_number = "+919877235405"
    
    if not twilio_client:
        print("--- MOCK SMS - SUPPLIER NOTIFICATION ---")
        print(f"TO: {demo_phone_number} (Supplier: {supplier_name})")
        print(f"MESSAGE: New orders received - {total_orders} orders")
        return False

    message_body = (
        f"ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ {supplier_name}, Vendor Collective 'ਤੇ ਤੁਹਾਨੂੰ {total_orders} ਨਵੇ ਆਰਡਰ ਮਿਲੇ ਹਨ। "
        f"ਉਤਪਾਦ: {products_summary}। ਕਿਰਪਾ ਕਰਕੇ ਆਰਡਰ ਤਿਆਰ ਕਰੋ।"
    )

    try:
        message = twilio_client.messages.create(to=demo_phone_number, from_=TWILIO_PHONE_NUMBER, body=message_body)
        logger.info(f"Supplier SMS sent successfully. SID: {message.sid}")
        return True
    except Exception as e:
        logger.error(f"Failed to send supplier SMS: {e}")
        return False


async def send_agent_notification_sms(phone_number: str, message_type: str, details: str, agent_name: str):
    """Send notifications to delivery agents."""
    demo_phone_number = "+919877235405"
    
    if not twilio_client:
        print("--- MOCK SMS - AGENT NOTIFICATION ---")
        print(f"TO: {demo_phone_number} (Agent: {agent_name})")
        print(f"MESSAGE: {message_type} - {details}")
        return False

    message_templates = {
        'route_assigned': f"ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ {agent_name}, ਅੱਜ ਤੁਹਾਨੂੰ ਰੂਟ ਮਿਲ ਗਿਆ ਹੈ। {details}",
        'pickup_ready': f"ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ {agent_name}, {details} ਤੋਂ ਪਿਕਅਪ ਤਿਆਰ ਹੈ।",
        'route_completed': f"ਸ਼ਾਬਾਸ਼ {agent_name}! ਅੱਜ ਦਾ ਰੂਟ ਪੂਰਾ ਹੋ ਗਿਆ। {details}"
    }

    message_body = message_templates.get(message_type, f"ਅੱਪਡੇਟ: {details}")

    try:
        message = twilio_client.messages.create(to=demo_phone_number, from_=TWILIO_PHONE_NUMBER, body=message_body)
        logger.info(f"Agent SMS sent successfully. SID: {message.sid}")
        return True
    except Exception as e:
        logger.error(f"Failed to send agent SMS: {e}")
        return False


async def send_vendor_delivery_update_sms(phone_number: str, message_type: str, details: str, vendor_name: str):
    """Send delivery status updates to vendors."""
    demo_phone_number = "+919877235405"
    
    if not twilio_client:
        print("--- MOCK SMS - VENDOR DELIVERY UPDATE ---")
        print(f"TO: {demo_phone_number} (Vendor: {vendor_name})")
        print(f"MESSAGE: {message_type} - {details}")
        return False

    message_templates = {
        'agent_started': f"ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ {vendor_name}, ਏਜੰਟ ਨੇ ਰੂਟ ਸ਼ੁਰੂ ਕੀਤਾ ਹੈ। {details}",
        'out_for_delivery': f"ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ {vendor_name}, ਤੁਹਾਡਾ ਆਰਡਰ ਡਿਲੀਵਰੀ ਲਈ ਰਵਾਨਾ ਹੋ ਗਿਆ ਹੈ। {details}",
        'delivered': f"ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ {vendor_name}, ਤੁਹਾਡਾ ਆਰਡਰ ਪਹੁੰਚ ਗਿਆ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਪੁਸ਼ਟੀ ਕਰੋ।"
    }

    message_body = message_templates.get(message_type, f"ਅੱਪਡੇਟ: {details}")

    try:
        message = twilio_client.messages.create(to=demo_phone_number, from_=TWILIO_PHONE_NUMBER, body=message_body)
        logger.info(f"Vendor delivery SMS sent successfully. SID: {message.sid}")
        return True
    except Exception as e:
        logger.error(f"Failed to send vendor delivery SMS: {e}")
        return False


async def send_admin_alert_sms(phone_number: str, alert_type: str, details: str):
    """Send system alerts to admin."""
    demo_phone_number = "+919877235405"
    
    if not twilio_client:
        print("--- MOCK SMS - ADMIN ALERT ---")
        print(f"TO: {demo_phone_number} (Admin)")
        print(f"MESSAGE: {alert_type} - {details}")
        return False

    message_body = f"🚨 Vendor Collective Alert: {alert_type}\nDetails: {details}\nCheck admin dashboard."

    try:
        message = twilio_client.messages.create(to=demo_phone_number, from_=TWILIO_PHONE_NUMBER, body=message_body)
        logger.info(f"Admin alert SMS sent successfully. SID: {message.sid}")
        return True
    except Exception as e:
        logger.error(f"Failed to send admin alert SMS: {e}")
        return False
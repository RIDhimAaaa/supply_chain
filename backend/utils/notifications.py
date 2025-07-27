import logging

logger = logging.getLogger(__name__)

async def send_order_confirmation_sms(phone_number: str, final_cost: float, vendor_name: str):
    """
    This is a MOCK function to simulate sending an SMS notification.
    In a real application, this is where you would integrate Twilio's API.
    """
    # The message would be in Punjabi as per the blueprint
    message = (
        f"ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ {vendor_name}, Vendor Collective 'ਤੇ ਤੁਹਾਡਾ ਆਰਡਰ ਫਾਈਨਲ ਹੋ ਗਿਆ ਹੈ। "
        f"ਤੁਹਾਡੇ ਵਾਲਿਟ ਤੋਂ ₹{final_cost:.2f} ਕੱਟੇ ਗਏ ਹਨ। ਤੁਹਾਡੀ ਡਿਲੀਵਰੀ ਕੱਲ੍ਹ ਆ ਜਾਵੇਗੀ।"
    )
    
    print("--- SENDING MOCK SMS ---")
    print(f"TO: {phone_number}")
    print(f"MESSAGE: {message}")
    print("------------------------")
    logger.info(f"Sent mock order confirmation SMS to {phone_number} for vendor {vendor_name}.")
    
    # In a real app, you'd have something like:
    # from twilio.rest import Client
    # client = Client("YOUR_TWILIO_SID", "YOUR_TWILIO_AUTH_TOKEN")
    # client.messages.create(to=phone_number, from_="YOUR_TWILIO_NUMBER", body=message)
    
    return True
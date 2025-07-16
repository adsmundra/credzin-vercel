import qrcode
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# WhatsApp link with pre-filled message
phone_number = "917899080498"  # Replace with your WhatsApp Business number (with country code)
message = "Hi, I want to join the loyalty program!"
wa_link = f"https://wa.me/{phone_number}?text={message.replace(' ', '%20')}"
logging.info(f"Generated WhatsApp link: {wa_link}")

# Define output directory and ensure it exists
# The script is expected to be run from the project root directory
output_dir = "Output/dash"
os.makedirs(output_dir, exist_ok=True)
logging.info(f"Output directory '{output_dir}' is ready.")

# Generate QR code
logging.info("Generating QR code...")
img = qrcode.make(wa_link)

# Save the QR code image
image_path = os.path.join(output_dir, "whatsapp_loyalty_qr.png")
img.save(image_path)
logging.info(f"QR code saved to {image_path}")

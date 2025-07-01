from PIL import Image, ImageDraw, ImageFont
from brother_ql.conversion import convert
from brother_ql.backends.helpers import send
from brother_ql.raster import BrotherQLRaster
import subprocess
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Allow CORS for Angular app

def check_supported_models():
    """Check supported models by running brother_ql info models."""
    try:
        result = subprocess.run(['brother_ql', 'info', 'models'], capture_output=True, text=True)
        return result.stdout
    except Exception as e:
        return f"Error checking models: {e}"

def create_label(first_name, last_name):
    # Label dimensions for 29mm x 90mm (in pixels, as expected by brother_ql)
    label_width = 991   # Effective printable width for 90mm
    label_height = 306  # 29mm at 300 DPI

    # Create a grayscale image
    image = Image.new("L", (label_width, label_height), "white")
    draw = ImageDraw.Draw(image)

    # Combine first and last name
    full_name = f"{first_name} {last_name}"

    # Maximum dimensions for text (95% of width, 90% of height for larger text)
    max_text_width = int(label_width * 0.95)    # ≈941px
    max_text_height = int(label_height * 0.9)   # ≈275px

    # Start with a large font size and scale down
    font_size = 120  # Start large for bigger text
    while font_size > 20:  # Minimum font size
        try:
            font = ImageFont.truetype("arial.ttf", font_size)
            text_bbox = draw.textbbox((0, 0), full_name, font=font)
            text_width = text_bbox[2] - text_bbox[0]
            text_height = text_bbox[3] - text_bbox[1]

            # Check if text fits within max dimensions
            if text_width <= max_text_width and text_height <= max_text_height:
                break
            font_size -= 5  # Reduce font size and try again
        except IOError:
            print("Arial font not found. Please ensure arial.ttf is available or specify another font (e.g., C:\\Windows\\Fonts\\calibri.ttf).")
            return None

    # Use minimum font size if text still doesn't fit
    if font_size <= 20:
        font_size = 20
        font = ImageFont.truetype("arial.ttf", font_size)

    # Calculate text size and position for centering
    text_bbox = draw.textbbox((0, 0), full_name, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]

    # Center text horizontally
    x = (label_width - text_width) // 2

    # Center text vertically with adjustment for font metrics
    ascent, descent = font.getmetrics()
    text_visual_height = ascent - descent  # Height of the visible text
    y = (label_height - text_visual_height) // 2 - text_bbox[1]  # Adjust for bbox offset

    # Draw text
    draw.text((x, y), full_name, fill="black", font=font)

    print(f"Using font size: {font_size}pt for '{full_name}'")
    return image

def print_label(first_name, last_name, printer_identifier="usb://0x04f9:0x209b", model="QL-800"):
    # Check if model is valid
    supported_models = check_supported_models()
    if model not in supported_models:
        error_msg = f"Error: Model '{model}' not recognized. Supported models:\n{supported_models}"
        print(error_msg)
        return {"status": "error", "message": error_msg}

    # Create label image
    image = create_label(first_name, last_name)
    if image is None:
        error_msg = "Failed to create label image"
        print(error_msg)
        return {"status": "error", "message": error_msg}

    # Printer settings
    backend = "pyusb"

    # Convert and send to printer
    try:
        qlr = BrotherQLRaster(model)
        qlr.exception_on_warning = True
        instructions = convert(
            qlr=qlr,
            images=[image],
            label="29x90",  # 29mm x 90mm label
            rotate="90",    # Rotate 90 degrees (adjust if needed: '0', '90', '270', or 'Auto')
            threshold=70.0,
            dither=False,
            compress=False,
            red=False,      # Set to True for black/red labels (e.g., DK-22251)
            dpi_600=False,
            hq=True,
            cut=True
        )

        # Send to printer
        send(
            instructions=instructions,
            printer_identifier=printer_identifier,
            backend_identifier=backend,
            blocking=True
        )
        print(f"Label printed successfully for '{first_name} {last_name}'!")
        return {"status": "success", "message": "Label printed successfully"}
    except Exception as e:
        error_msg = f"Error printing label: {str(e)}"
        print(error_msg)
        return {"status": "error", "message": error_msg}

@app.route('/print-label', methods=['POST'])
def handle_print_label():
    try:
        data = request.get_json()
        first_name = data.get('first_name')
        last_name = data.get('last_name')

        if not first_name or not last_name:
            return jsonify({"status": "error", "message": "first_name and last_name are required"}), 400

        result = print_label(first_name, last_name)
        return jsonify(result), 200 if result["status"] == "success" else 500
    except Exception as e:
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
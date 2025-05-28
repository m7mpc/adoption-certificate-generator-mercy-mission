from flask import Flask, render_template, request, redirect, url_for, flash, send_file
from werkzeug.utils import secure_filename
import os
import subprocess
import json
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'  # Change this to a random secret key

# Configuration
UPLOAD_FOLDER = 'static/uploads'
OUTPUT_FOLDER = 'output'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Create directories if they don't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)


def allowed_file(filename):
    return '.' in filename and \
        filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/')
def index():
    return render_template('form.html')


@app.route('/submit', methods=['POST'])
def submit():
    try:
        # Get form data
        form_data = {
            'child_name': request.form.get('child_name'),
            'guardian_name': request.form.get('guardian_name'),
            'birthday': request.form.get('birthday'),
            'child_id': request.form.get('child_id'),
            'child_phone': request.form.get('child_phone'),
            'location': request.form.get('location'),
            'donor_name': request.form.get('donor_name'),
            'donor_phone': request.form.get('donor_phone'),
            'address': request.form.get('address'),
            'month': request.form.get('month'),
            'amount': request.form.get('amount')
        }

        # Handle photo upload
        photo_filename = None
        if 'orphan_photo' in request.files:
            photo = request.files['orphan_photo']
            if photo and photo.filename and allowed_file(photo.filename):
                # Create unique filename
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                filename = f"{timestamp}_{secure_filename(photo.filename)}"
                photo_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                photo.save(photo_path)
                photo_filename = filename

        form_data['photo_filename'] = photo_filename

        # Generate unique PDF filename
        pdf_filename = f"adoption_certificate_{form_data['child_name']}.pdf"
        pdf_path = os.path.join(OUTPUT_FOLDER, pdf_filename)

        # Save form data to temporary JSON file
        temp_data_file = 'temp_form_data.json'
        with open(temp_data_file, 'w') as f:
            json.dump(form_data, f)

        # Call Node.js script to generate PDF
        result = subprocess.run(
            ['node', 'html-to-pdf.js', temp_data_file, pdf_path],
            capture_output=True,
            text=True
        )

        # Clean up temp file
        if os.path.exists(temp_data_file):
            os.remove(temp_data_file)

        if result.returncode == 0:
            flash('Adoption certificate generated successfully!', 'success')
            # Return the PDF file
            return send_file(pdf_path, as_attachment=True, download_name=pdf_filename)
        else:
            flash('Error generating PDF: ' + result.stderr, 'error')
            return redirect(url_for('index'))

    except Exception as e:
        flash(f'An error occurred: {str(e)}', 'error')
        return redirect(url_for('index'))


if __name__ == '__main__':
    app.run(debug=True)
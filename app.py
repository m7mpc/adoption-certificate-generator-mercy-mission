from flask import Flask, render_template, request, redirect, url_for, flash, send_file
from werkzeug.utils import secure_filename
import tempfile
from flask import Response
import os
import subprocess
import json
from datetime import datetime

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'dev-secret-key')


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
        # 1. Collect form fields
        form_data = {
            'child_name':    request.form.get('child_name'),
            'guardian_name': request.form.get('guardian_name'),
            'birthday':      request.form.get('birthday'),
            'child_id':      request.form.get('child_id'),
            'child_phone':   request.form.get('child_phone'),
            'location':      request.form.get('location'),
            'donor_name':    request.form.get('donor_name'),
            'donor_phone':   request.form.get('donor_phone'),
            'address':       request.form.get('address'),
            'month':         request.form.get('month'),
            'amount':        request.form.get('amount')
        }

        # 2. Handle orphan photo upload
        photo_filename = None
        if 'orphan_photo' in request.files:
            photo = request.files['orphan_photo']
            if photo and photo.filename and allowed_file(photo.filename):
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                filename = f"{timestamp}_{secure_filename(photo.filename)}"
                photo_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                photo.save(photo_path)
                photo_filename = filename

        form_data['photo_filename'] = photo_filename

        # 3. Dump form data to a temp JSON file
        tmp_json = tempfile.NamedTemporaryFile(suffix='.json', delete=False)
        tmp_json.write(json.dumps(form_data).encode('utf-8'))
        tmp_json.flush()
        tmp_json_path = tmp_json.name
        tmp_json.close()

        # 4. Create a temp file path for the PDF
        tmp_pdf = tempfile.NamedTemporaryFile(suffix='.pdf', delete=False)
        tmp_pdf.close()
        pdf_path = tmp_pdf.name

        # 5. Run the Node.js PDF generator
        result = subprocess.run(
            ['node', 'html-to-pdf.js', tmp_json_path, pdf_path],
            capture_output=True,
            text=True
        )

        # 6. Clean up the temp JSON immediately
        os.remove(tmp_json_path)

        if result.returncode == 0:
            # 7. Read the generated PDF into memory
            with open(pdf_path, 'rb') as f:
                pdf_bytes = f.read()

            # 8. Delete the temp PDF and uploaded photo
            os.remove(pdf_path)
            if photo_filename:
                os.remove(os.path.join(app.config['UPLOAD_FOLDER'], photo_filename))

            # 9. Stream PDF back to client
            download_name = f"adoption_certificate_{form_data['child_name']}.pdf"
            return Response(
                pdf_bytes,
                mimetype='application/pdf',
                headers={'Content-Disposition': f'attachment; filename={download_name}'}
            )
        else:
            flash('Error generating PDF: ' + result.stderr, 'error')
            return redirect(url_for('index'))

    except Exception as e:
        flash(f'An error occurred: {str(e)}', 'error')
        return redirect(url_for('index'))



if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=False)
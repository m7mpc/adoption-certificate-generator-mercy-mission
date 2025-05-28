# Gaza Virtual Adoption Program

A web application for managing virtual adoptions of children in Gaza, featuring a data entry form and automatic PDF certificate generation.

## 🌟 Features

- **Beautiful Web Form**: Modern, responsive data entry interface
- **PDF Certificate Generation**: Automatically generates professional adoption certificates
- **Photo Upload**: Support for child photo uploads
- **Modern Design**: Clean, professional layout with gradient effects
- **Single-Page PDF**: Optimized to fit perfectly on one A4 page
- **Responsive**: Works on desktop and mobile devices

## 📋 Prerequisites

Before you begin, ensure you have installed:
- Node.js (v14 or higher)
- Python (v3.7 or higher)
- npm (Node Package Manager)
- pip (Python Package Manager)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/gaza-adoption-program.git
cd gaza-adoption-program
```

### 2. Project Structure

Create the following directory structure:

```
gaza-adoption-program/
│
├── app.py                 # Flask application
├── html-to-pdf.js        # PDF converter script
├── package.json          # Node.js dependencies
├── requirements.txt      # Python dependencies
├── README.md            # This file
│
├── templates/           # HTML templates
│   └── form.html       # Data entry form
│
├── static/             # Static assets
│   ├── css/           # CSS files (if any)
│   ├── js/            # JavaScript files (if any)
│   ├── images/        # Logo images
│   │   ├── MercyMission.png
│   │   ├── foplogo.png
│   │   └── GhrassAlkheir.png
│   └── uploads/       # Uploaded photos (created automatically)
│
└── output/            # Generated PDFs (created automatically)
```

### 3. Install Node.js Dependencies

Create `package.json`:

```json
{
  "name": "gaza-adoption-program",
  "version": "1.0.0",
  "description": "PDF generation for Gaza Virtual Adoption Program",
  "main": "html-to-pdf.js",
  "scripts": {
    "generate-pdf": "node html-to-pdf.js"
  },
  "dependencies": {
    "puppeteer": "^21.0.0"
  }
}
```

Install dependencies:

```bash
npm install
```

### 4. Install Python Dependencies

Create `requirements.txt`:

```txt
Flask==2.3.2
Werkzeug==2.3.6
```

Install dependencies:

```bash
pip install -r requirements.txt
```

### 5. Create Flask Application

Create `app.py`:

```python
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
        pdf_filename = f"adoption_certificate_{form_data['child_id']}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
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
```

### 6. Update the Node.js Script

Update `html-to-pdf.js` to accept command-line arguments:

```javascript
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// ... (include the HTMLToPDFConverter class from the artifact)

// Command line execution
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
        console.error('Usage: node html-to-pdf.js <data-file.json> <output.pdf>');
        process.exit(1);
    }
    
    const dataFile = args[0];
    const outputFile = args[1];
    
    async function generateFromCommandLine() {
        try {
            // Read form data
            const dataContent = await fs.readFile(dataFile, 'utf8');
            const formData = JSON.parse(dataContent);
            
            // Create converter
            const converter = new HTMLToPDFConverter();
            
            // Generate HTML with data
            const html = generateHTMLWithData(formData);
            
            // Convert to PDF
            await converter.convertHTMLStringToPDF(
                html,
                outputFile,
                singlePageOptions
            );
            
            await converter.close();
            console.log('PDF generated successfully:', outputFile);
            process.exit(0);
        } catch (error) {
            console.error('Error:', error.message);
            process.exit(1);
        }
    }
    
    generateFromCommandLine();
}
```

### 7. Add Logo Images

Place your logo images in the `static/images/` directory:
- MercyMission.png
- foplogo.png
- GhrassAlkheir.png

## 🏃‍♂️ Running the Application

1. **Start the Flask server:**
```bash
python app.py
```

2. **Access the application:**
Open your browser and navigate to `http://localhost:5000`

3. **Fill the form and generate certificates:**
- Enter child and donor information
- Upload a photo (optional)
- Click "Generate Adoption Form"
- The PDF will be automatically downloaded

## 📁 File Management

### Uploaded Photos
- Stored in `static/uploads/`
- Named with timestamp to avoid conflicts
- Supported formats: PNG, JPG, JPEG, GIF

### Generated PDFs
- Stored in `output/`
- Named with child ID and timestamp
- Format: `adoption_certificate_[CHILD_ID]_[TIMESTAMP].pdf`

## 🔧 Configuration

### Flask Configuration
In `app.py`, you can modify:
- `SECRET_KEY`: Change to a secure random string
- `MAX_CONTENT_LENGTH`: Maximum upload size (default: 16MB)
- `UPLOAD_FOLDER`: Where photos are stored
- `OUTPUT_FOLDER`: Where PDFs are saved

### PDF Configuration
In `html-to-pdf.js`, you can modify:
- Page margins
- Paper size (default: A4)
- Print settings

## 🚨 Troubleshooting

### Common Issues

1. **"Error generating PDF"**
   - Ensure Node.js and Puppeteer are properly installed
   - Check that all directories exist and have write permissions
   - Verify logo images are in the correct location

2. **"File upload error"**
   - Check file size (must be under 16MB)
   - Ensure file format is supported (PNG, JPG, JPEG, GIF)
   - Verify upload directory has write permissions

3. **"PDF doesn't fit on one page"**
   - The template is optimized for A4 size
   - Ensure content isn't too long
   - Check margin settings in CSS

### Debug Mode
The Flask app runs in debug mode by default. For production:
```python
app.run(debug=False, host='0.0.0.0', port=5000)
```

## 🔒 Security Considerations

1. **Change the secret key** in production
2. **Validate all user inputs** before processing
3. **Implement user authentication** if needed
4. **Use HTTPS** in production
5. **Regularly clean up** old uploads and PDFs

## 📝 License

This project is created for humanitarian purposes. Please use responsibly.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 💖 Acknowledgments

- Mercy Mission
- Friends of Palestine
- Ghrass AlKheir
- All contributors and donors supporting Gaza's children

---

For questions or support, please contact the project maintainers.
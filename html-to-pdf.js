const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

class HTMLToPDFConverter {
  constructor() {
    this.browser = null;
  }

async initialize() {
  this.browser = await puppeteer.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome-stable',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding'
    ]
  });
}

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  // Convert HTML string to PDF
  async convertHTMLStringToPDF(htmlString, outputPath, options = {}) {
    if (!this.browser) {
      await this.initialize();
    }

    const page = await this.browser.newPage();

    try {
      await page.setContent(htmlString, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      const pdfOptions = {
        path: outputPath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        },
        ...options
      };

      await page.pdf(pdfOptions);
      console.log(`PDF generated successfully: ${outputPath}`);
    } finally {
      await page.close();
    }
  }
}

// Function to generate HTML with form data
function generateHTMLWithData(data) {
  // —–– INSERT THIS BLOCK NEXT —––––
  const imagesDir = path.join(__dirname, 'static/images');
  const mercyLogo  = fsSync.readFileSync(path.join(imagesDir, 'MercyMission.png')).toString('base64');
  const fopLogo    = fsSync.readFileSync(path.join(imagesDir, 'foplogo.png')).toString('base64');
  const grassLogo  = fsSync.readFileSync(path.join(imagesDir, 'GhrassAlkheir.png')).toString('base64');
    // —–– new: load & base64-encode orphan photo if present —––––
  let photoDataURI = '';
  if (data.photo_filename) {
    const photoPath = path.join(__dirname, 'static/uploads', data.photo_filename);
    const ext = path.extname(photoPath).toLowerCase();
    const mime = ext === '.png' ? 'image/png' : 'image/jpeg';
    const photoBase64 = fsSync.readFileSync(photoPath).toString('base64');
    photoDataURI = `data:${mime};base64,${photoBase64}`;
  }
  // —––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

  // —––––––––––––––––––––––––––––––––

  // Format the birthday to a more readable format if it exists
  let formattedBirthday = data.birthday || '---';
  if (data.birthday && data.birthday !== '---') {
    const date = new Date(data.birthday);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    formattedBirthday = date.toLocaleDateString('en-US', options);
  }

  // Format amount with currency symbol if provided
  let formattedAmount = data.amount || '---';
  if (data.amount && data.amount !== '---' && !data.amount.includes('$')) {
    formattedAmount = data.amount;
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <!-- allow relative image URLs to load from your static/images folder -->
    <base href="file://${path.join(__dirname, 'static/images')}/">
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gaza Virtual Adoption Program</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f8fafb;
            padding: 0;
            margin: 0;
            line-height: 1.4;
            color: #1a1a1a;
            font-size: 13px;
        }

        .container {
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
            background: white;
            position: relative;
            box-shadow: 0 4px 24px rgba(0,0,0,0.08);
            border-radius: 12px;
            overflow: hidden;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }

        /* Header Section */
        .header {
            background: linear-gradient(135deg, #1e7e34 0%, #28a745 50%, #20c997 100%);
            padding: 15px 25px;
            position: relative;
            overflow: hidden;
        }

        .header::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: pulse 4s ease-in-out infinite;
        }

        @keyframes pulse {
            0%, 100% { transform: scale(0.8); opacity: 0.5; }
            50% { transform: scale(1.2); opacity: 0.8; }
        }

        .logos-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            position: relative;
            z-index: 1;
        }

        .logo {
            width: 80px;
            height: 80px;
            background: white;
            border-radius: 8px;
            padding: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 3px 8px rgba(0,0,0,0.15);
            transition: transform 0.3s ease;
        }

        .logo:hover {
            transform: translateY(-2px);
        }

        .logo img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        .main-title {
            color: white;
            font-size: 24px;
            font-weight: 700;
            text-align: center;
            margin: 8px 0 4px 0;
            letter-spacing: 0.5px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.2);
            position: relative;
            z-index: 1;
        }

        .subtitle {
            color: rgba(255,255,255,0.95);
            font-size: 13px;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 2px;
            font-weight: 300;
            position: relative;
            z-index: 1;
        }

        /* Main Content */
        .form-content {
            padding: 20px 25px 40px 25px;
            position: relative;
            background: white;
            min-height: calc(100vh - 300px);
            display: flex;
            flex-direction: column;
        }

        /* Photo Section */
        .photo-section {
            position: absolute;
            top: 20px;
            right: 5px;
            width: 120px;
            height: 150px;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border: 2px solid transparent;
            background-clip: padding-box;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.12);
            transition: transform 0.3s ease;
        }

        .photo-section::before {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            background: linear-gradient(135deg, #1e7e34, #20c997);
            border-radius: 8px;
            z-index: -1;
        }

        .photo-section:hover {
            transform: scale(1.05);
        }

        .photo-section img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .photo-placeholder {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: #6c757d;
            font-size: 9px;
            background: #f8f9fa;
        }

        .photo-placeholder svg {
            width: 30px;
            height: 30px;
            margin-bottom: 4px;
            fill: #dee2e6;
        }

        /* Form Sections */
        .form-sections {
            margin-right: 105px;
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 45px;
            padding-bottom: 30px;
        }

        .form-section {
            background: #f8fafb;
            padding: 18px;
            border-radius: 8px;
            box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }

        .form-section:first-child {
            margin-top: 25px;
        }

        .section-header {
            background: linear-gradient(135deg, #1e7e34 0%, #28a745 100%);
            color: white;
            padding: 8px 20px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 700;
            margin: -22px 0 15px 0;
            display: inline-block;
            text-transform: uppercase;
            letter-spacing: 1px;
            box-shadow: 0 3px 8px rgba(30,126,52,0.3);
            position: relative;
            left: 0;
            transform: none;
        }

        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px 15px;
        }

        .info-item {
            position: relative;
        }

        .info-item.full-width {
            grid-column: 1 / -1;
        }

        .info-label {
            color: #6c757d;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            margin-bottom: 4px;
            display: block;
        }

        .info-value {
            color: #1a1a1a;
            font-size: 13px;
            font-weight: 500;
            padding: 8px 10px;
            background: white;
            border-radius: 6px;
            min-height: 32px;
            display: flex;
            align-items: center;
            box-shadow: 0 1px 3px rgba(0,0,0,0.06);
            transition: all 0.2s ease;
        }

        .info-value:hover {
            box-shadow: 0 2px 6px rgba(0,0,0,0.1);
            transform: translateY(-1px);
        }

        /* Payment Status Section */
        .payment-section {
            background: linear-gradient(135deg, #f8fafb 0%, #e8f5e9 100%);
            border: 1.5px solid #20c997;
        }

        .payment-section .section-header {
            background: linear-gradient(135deg, #20c997 0%, #1e7e34 100%);
        }

        .payment-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }

        .payment-item .info-value {
            background: white;
            border-left: 3px solid #20c997;
            font-size: 15px;
            font-weight: 600;
            color: #1e7e34;
        }

        /* Contact Section */
        .contact-section {
            background: linear-gradient(135deg, #1e7e34 0%, #28a745 100%);
            margin: 0 -25px 0 -25px;
            padding: 15px 25px;
            text-align: center;
            position: relative;
            overflow: hidden;
            margin-top: auto;
        }

        .contact-section::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
        }

        .contact-title {
            color: white;
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .contact-numbers {
            display: flex;
            justify-content: center;
            gap: 20px;
        }

        .contact-item {
            display: flex;
            align-items: center;
            background: white;
            padding: 8px 16px;
            border-radius: 18px;
            box-shadow: 0 3px 10px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
        }

        .contact-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 14px rgba(0,0,0,0.15);
        }

        .contact-icon {
            width: 24px;
            height: 24px;
            background: linear-gradient(135deg, #20c997 0%, #1e7e34 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 8px;
            box-shadow: 0 2px 6px rgba(32,201,151,0.3);
        }

        .contact-icon svg {
            width: 12px;
            height: 12px;
            fill: white;
        }

        .contact-number {
            color: #1a1a1a;
            font-size: 14px;
            font-weight: 600;
            letter-spacing: 0.3px;
        }

        /* Decorative Elements */
        .decoration {
            position: absolute;
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, rgba(32,201,151,0.08) 0%, rgba(30,126,52,0.08) 100%);
            border-radius: 50%;
            top: -30px;
            left: -30px;
            z-index: 0;
        }

        .decoration2 {
            position: absolute;
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, rgba(32,201,151,0.05) 0%, rgba(30,126,52,0.05) 100%);
            border-radius: 50%;
            bottom: -40px;
            right: -40px;
            z-index: 0;
        }

        /* Print Styles */
        @media print {
            body {
                background: white;
                padding: 0;
                margin: 0;
            }

            .container {
                max-width: 100%;
                box-shadow: none;
            }

            .header {
                border-radius: 0;
            }

            .contact-section {
                border-radius: 0;
            }

            .actions {
                display: none;
            }

            .form-section:hover .info-value {
                transform: none;
            }
        }

        /* Ensure single page with proper height */
        @page {
            size: A4;
            margin: 5mm;
        }

        /* For A4 size in browser */
        @media screen {
            .container {
                min-height: 1084px; /* A4 height minus margins at 96dpi */
                max-height: 1084px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="decoration"></div>
        <div class="decoration2"></div>

        <div class="header">
            <div class="logos-container">
                <div class="logo">
                    <img src="data:image/png;base64,${mercyLogo}" alt="Mercy Mission">
                </div>
                <div class="logo">
                    <img src="data:image/png;base64,${fopLogo}" alt="Friends of Palestine">
                </div>
                <div class="logo">
                    <img src="data:image/png;base64,${grassLogo}" alt="Ghrass AlKheir">
                </div>
            </div>
            <h1 class="main-title">GAZA VIRTUAL ADOPTION PROGRAM</h1>
            <p class="subtitle">Adoption Certificate</p>
        </div>

        <div class="form-content">
            <div class="photo-section">
                ${data.photo_filename ?
                    `<img src="${photoDataURI}" alt="Child Photo">` :
                    `<div class="photo-placeholder">
                        <svg viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                        <span>No Photo</span>
                    </div>`
                }
            </div>

            <div class="form-sections">
                <div class="form-section">
                    <div class="section-header">Child Information</div>
                    <div class="info-grid">
                        <div class="info-item">
                            <label class="info-label">Child Name</label>
                            <div class="info-value">${data.child_name || '---'}</div>
                        </div>
                        <div class="info-item">
                            <label class="info-label">Guardian Name</label>
                            <div class="info-value">${data.guardian_name || '---'}</div>
                        </div>
                        <div class="info-item">
                            <label class="info-label">Birthday</label>
                            <div class="info-value">${formattedBirthday}</div>
                        </div>
                        <div class="info-item">
                            <label class="info-label">Child ID</label>
                            <div class="info-value">${data.child_id || '---'}</div>
                        </div>
                        <div class="info-item">
                            <label class="info-label">Phone</label>
                            <div class="info-value">${data.child_phone || '---'}</div>
                        </div>
                        <div class="info-item">
                            <label class="info-label">Location</label>
                            <div class="info-value">${data.location || '---'}</div>
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <div class="section-header">Adoption Info</div>
                    <div class="info-grid">
                        <div class="info-item">
                            <label class="info-label">Donor Name</label>
                            <div class="info-value">${data.donor_name || '---'}</div>
                        </div>
                        <div class="info-item">
                            <label class="info-label">Donor Phone</label>
                            <div class="info-value">${data.donor_phone || '---'}</div>
                        </div>
                        <div class="info-item full-width">
                            <label class="info-label">Address</label>
                            <div class="info-value">${data.address || '---'}</div>
                        </div>
                    </div>
                </div>

                <div class="form-section payment-section">
                    <div class="section-header">Payment Status</div>
                    <div class="payment-grid">
                        <div class="info-item payment-item">
                            <label class="info-label">Month</label>
                            <div class="info-value">${data.month || '---'}</div>
                        </div>
                        <div class="info-item payment-item">
                            <label class="info-label">Amount</label>
                            <div class="info-value">${formattedAmount}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="contact-section">
            <div class="contact-title">Contact Information</div>
            <div class="contact-numbers">
                <div class="contact-item">
                    <div class="contact-icon">
                        <svg viewBox="0 0 24 24">
                            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                        </svg>
                    </div>
                    <div class="contact-number">0334 3175741</div>
                </div>
                <div class="contact-item">
                    <div class="contact-icon">
                        <svg viewBox="0 0 24 24">
                            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                        </svg>
                    </div>
                    <div class="contact-number">0315 8793683</div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
  `;
}

// Simple single-page PDF options
const singlePageOptions = {
  format: 'A4',
  printBackground: true,
  displayHeaderFooter: false,  // No headers/footers
  margin: {
    top: '10mm',
    right: '10mm',
    bottom: '10mm',
    left: '10mm'
  },
  preferCSSPageSize: true
};

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
      console.error('Error:', error);
      console.error('Stack:', error.stack);
      process.exit(1);
    }
  }

  generateFromCommandLine();
}

// Export for use in other modules
module.exports = {
  HTMLToPDFConverter,
  generateHTMLWithData,
  singlePageOptions
};
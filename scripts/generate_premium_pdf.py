from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
import hashlib
import sqlite3
import os
import shutil

def draw_border(canvas, doc):
    canvas.saveState()
    # Navy border
    canvas.setStrokeColor(colors.HexColor('#0F172A'))
    canvas.setLineWidth(4)
    canvas.rect(20, 20, 572, 752)
    # Inner gold border
    canvas.setStrokeColor(colors.HexColor('#D97706'))
    canvas.setLineWidth(1.5)
    canvas.rect(25, 25, 562, 742)
    canvas.restoreState()

def create_pdf(filename="MGMU_Sample_Certificate.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Typography Styles
    univ_style = ParagraphStyle(
        'UnivStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0F172A'),
        alignment=1, # Center
        spaceAfter=4
    )
    
    sub_style = ParagraphStyle(
        'SubStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor('#475569'),
        alignment=1,
        spaceAfter=15
    )
    
    cert_title_style = ParagraphStyle(
        'CertTitleStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=colors.HexColor('#B45309'), # Amber/Gold
        alignment=1,
        spaceAfter=25
    )
    
    body_style = ParagraphStyle(
        'BodyStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=20,
        textColor=colors.HexColor('#1E293B'),
        alignment=1,
        spaceAfter=30
    )
    
    meta_style = ParagraphStyle(
        'MetaStyle',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.5,
        leading=11,
        textColor=colors.HexColor('#64748B'),
        alignment=0,
        spaceAfter=3
    )

    story = []
    story.append(Spacer(1, 30))
    story.append(Paragraph("MAHATMA GANDHI MISSION UNIVERSITY", univ_style))
    story.append(Paragraph("School of Engineering & Technology (SoET), Aurangabad", sub_style))
    story.append(Spacer(1, 20))
    story.append(Paragraph("DEGREE OF BACHELOR OF TECHNOLOGY", cert_title_style))
    
    text = (
        "This is to certify that <b>RAHUL SHARMA</b> having Roll Number <b>CSE21001</b> "
        "has completed the course of study prescribed by the University and passed "
        "the final examination held in June 2025 in the first class with a Cumulative Grade Point "
        "Average (CGPA) of <b>8.8</b>.<br/><br/>"
        "He has accordingly been admitted to the degree of <b>Bachelor of Technology</b> in "
        "<b>Computer Science and Engineering (ICBT)</b>."
    )
    story.append(Paragraph(text, body_style))
    story.append(Spacer(1, 40))
    
    # Signature Lines
    sig_lbl_style = ParagraphStyle('SigLbl', parent=sub_style, fontSize=10, textColor=colors.HexColor('#0F172A'), fontName='Helvetica-Bold')
    sig_data = [
        [Paragraph("Registrar", sig_lbl_style), Paragraph("Vice-Chancellor", sig_lbl_style)]
    ]
    sig_table = Table(sig_data, colWidths=[260, 260])
    sig_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
        ('LINEABOVE', (0,0), (0,0), 1, colors.HexColor('#94A3B8')),
        ('LINEABOVE', (1,0), (1,0), 1, colors.HexColor('#94A3B8')),
    ]))
    story.append(sig_table)
    story.append(Spacer(1, 55))
    
    # Cryptographic Registry Block
    story.append(Paragraph("<b>[ CRYPTOGRAPHIC BLOCKCHAIN REGISTRY RECORD ]</b>", ParagraphStyle('BHead', parent=meta_style, fontName='Courier-Bold', textColor=colors.HexColor('#0F172A'))))
    story.append(Paragraph("DID (Issuer): did:ethr:0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266", meta_style))
    story.append(Paragraph("DID (Student): did:ethr:0x70997970c51812dc3a010c7d01b50e0d17dc79c8", meta_style))
    story.append(Paragraph("Credential ID: vc:sample_pdf_123", meta_style))
    story.append(Paragraph("Blockchain Transaction: 0x4a9b6c8d7e6f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b", meta_style))
    story.append(Paragraph("IPFS Storage URL: ipfs://QmSampleIPFSHashForPDFDegree12345", meta_style))
    
    doc.build(story, onFirstPage=draw_border)

if __name__ == '__main__':
    filename = "MGMU_Sample_Certificate.pdf"
    
    # 1. Create standard PDF
    create_pdf(filename)
    
    # 2. Get file hash
    with open(filename, 'rb') as f:
        file_bytes = f.read()
        file_hash = hashlib.sha256(file_bytes).hexdigest()
        
    print(f"Generated valid PDF with hash: {file_hash}")
    
    # 3. Update database
    db_path = 'backend/db/database.sqlite'
    if os.path.exists(db_path):
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT OR REPLACE INTO Certificate (cert_id, degree_name, issue_date, grade_cgpa, status, cert_hash, ipfs_cid, student_id, univ_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', ('vc:sample_pdf_123', 'Bachelor of Technology', '2025-06-15', '8.8', 'Active', file_hash, 'QmSampleIPFSHashForPDFDegree12345', 'CSE21001', 'univ_admin'))
        
        cursor.execute('''
            INSERT OR REPLACE INTO BlockchainRecord (tx_hash, block_number, timestamp, network, contract_address, cert_id)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', ('0x4a9b6c8d7e6f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b', 3456789, '2025-06-15T10:00:00Z', 'localhost', '0x5FbDB2315678afecb367f032d93F642f64180aa3', 'vc:sample_pdf_123'))
        conn.commit()
        conn.close()
        print("Updated database with PDF hash!")
        
        # 4. Copy to User Desktop
        user_home = os.path.expanduser('~')
        desktop_path = os.path.join(user_home, 'Desktop')
        onedrive_desktop = os.path.join(user_home, 'OneDrive', 'Desktop')
        target_desktop = onedrive_desktop if os.path.exists(onedrive_desktop) else desktop_path
        
        dst = os.path.join(target_desktop, filename)
        shutil.copy(filename, dst)
        print(f"Copied premium certificate PDF to Desktop: {dst}")
    else:
        print("Database not found!")

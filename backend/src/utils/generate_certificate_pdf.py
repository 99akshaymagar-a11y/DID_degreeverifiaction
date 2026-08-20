import sys
import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.graphics.barcode import qr
from reportlab.graphics.shapes import Drawing

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

def create_pdf(
    student_name, 
    roll_no, 
    degree_name, 
    dept, 
    cgpa, 
    issue_date, 
    univ_name, 
    tx_hash, 
    verify_url, 
    output_path
):
    doc = SimpleDocTemplate(
        output_path,
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
        fontSize=14,
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
    story.append(Paragraph(univ_name.upper(), univ_style))
    story.append(Paragraph("School of Engineering & Technology (SoET)", sub_style))
    story.append(Spacer(1, 20))
    story.append(Paragraph(f"DEGREE OF {degree_name.upper()}", cert_title_style))
    
    text = (
        f"This is to certify that <b>{student_name}</b> having Roll Number <b>{roll_no}</b> "
        f"has completed the course of study prescribed by the University and passed "
        f"the final examination held in {issue_date[:4]} in the first class with a Cumulative Grade Point "
        f"Average (CGPA) of <b>{cgpa}</b>.<br/><br/>"
        f"He/She has accordingly been admitted to the degree of <b>{degree_name}</b> in "
        f"<b>{dept}</b>."
    )
    story.append(Paragraph(text, body_style))
    story.append(Spacer(1, 35))
    
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
    story.append(Spacer(1, 45))
    
    # Cryptographic Registry Block & QR Table
    meta_story = [
        Paragraph("<b>[ CRYPTOGRAPHIC BLOCKCHAIN REGISTRY RECORD ]</b>", ParagraphStyle('BHead', parent=meta_style, fontName='Courier-Bold', textColor=colors.HexColor('#0F172A'))),
        Paragraph(f"Student DID: did:ethr:{roll_no.lower()}", meta_style),
        Paragraph(f"Blockchain network: Ethereum Sepolia (Local Node)", meta_style),
        Paragraph(f"Transaction Hash: {tx_hash}", meta_style),
        Paragraph(f"Verification URL: {verify_url}", meta_style),
    ]

    # Create QR code flowable
    qr_code = qr.QrCodeWidget(verify_url)
    bounds = qr_code.getBounds()
    qr_w = bounds[2] - bounds[0]
    qr_h = bounds[3] - bounds[1]
    # Set QR Code size to 75x75
    qr_drawing = Drawing(75, 75, transform=[75./qr_w, 0, 0, 75./qr_h, 0, 0])
    qr_drawing.add(qr_code)

    meta_table_data = [
        [meta_story, qr_drawing]
    ]
    meta_table = Table(meta_table_data, colWidths=[420, 100])
    meta_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (1,0), (1,0), 'RIGHT'),
    ]))
    story.append(meta_table)
    
    doc.build(story, onFirstPage=draw_border)

if __name__ == '__main__':
    # Parse CLI Arguments
    if len(sys.argv) < 11:
        print("Usage: generate_certificate_pdf.py <student_name> <roll_no> <degree_name> <dept> <cgpa> <issue_date> <univ_name> <tx_hash> <verify_url> <output_path>")
        sys.exit(1)
        
    student_name = sys.argv[1]
    roll_no = sys.argv[2]
    degree_name = sys.argv[3]
    dept = sys.argv[4]
    cgpa = sys.argv[5]
    issue_date = sys.argv[6]
    univ_name = sys.argv[7]
    tx_hash = sys.argv[8]
    verify_url = sys.argv[9]
    output_path = sys.argv[10]
    
    create_pdf(
        student_name, 
        roll_no, 
        degree_name, 
        dept, 
        cgpa, 
        issue_date, 
        univ_name, 
        tx_hash, 
        verify_url, 
        output_path
    )
    print("Success")

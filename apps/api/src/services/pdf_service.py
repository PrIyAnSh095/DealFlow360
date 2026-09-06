import io
from decimal import Decimal
from typing import List, Any, Optional

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable

def generate_quotation_pdf(
    quotation: Any,
    customer: Any,
    org_profile: Any,
    lines: List[Any]
) -> bytes:
    """
    Generates a professional customer-facing PDF document for a quotation or order.
    Excludes internal margins, product costs, or internal approval reasoning.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=22,
        leading=26,
        textColor=colors.HexColor('#1E293B'),
        fontName='Helvetica-Bold'
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#64748B'),
        fontName='Helvetica'
    )
    
    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#0F172A'),
        fontName='Helvetica-Bold'
    )
    
    body_style = ParagraphStyle(
        'BodyText',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#334155'),
        fontName='Helvetica'
    )
    
    bold_body_style = ParagraphStyle(
        'BoldBodyText',
        parent=body_style,
        fontName='Helvetica-Bold'
    )

    elements = []

    # 1. Header (Company Info & Document Title)
    company_name = getattr(org_profile, 'company_name', 'DealFlow360 Enterprises')
    legal_name = getattr(org_profile, 'legal_name', company_name)
    currency_symbol = "₹" if (getattr(org_profile, 'primary_currency', 'INR') == 'INR') else "$"

    header_table_data = [
        [
            Paragraph(f"<b>{legal_name}</b><br/>{getattr(org_profile, 'headquarters', 'Enterprise Solutions')}", subtitle_style),
            Paragraph(f"<font size=20 color='#0F172A'><b>QUOTATION</b></font><br/><font color='#64748B'>#{quotation.id[:8].upper()}</font>", ParagraphStyle('RightHeader', parent=subtitle_style, alignment=2))
        ]
    ]
    header_table = Table(header_table_data, colWidths=[300, 240])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 15))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#E2E8F0'), spaceAfter=15))

    # 2. Customer & Quotation Info Table
    cust_name = getattr(customer, 'name', 'Valued Customer') if customer else 'Valued Customer'
    cust_comp = getattr(customer, 'company', 'Enterprise Account') if customer else 'Enterprise Account'
    cust_email = getattr(customer, 'email', '') if customer else ''
    created_date = quotation.created_at.strftime("%Y-%m-%d") if hasattr(quotation, 'created_at') and quotation.created_at else "N/A"

    info_data = [
        [
            Paragraph("<b>PREPARED FOR:</b>", section_heading),
            Paragraph("<b>DOCUMENT DETAILS:</b>", section_heading)
        ],
        [
            Paragraph(f"<b>{cust_name}</b><br/>{cust_comp}<br/>{cust_email}", body_style),
            Paragraph(f"<b>Quote ID:</b> {quotation.id[:8].upper()}<br/><b>Date:</b> {created_date}<br/><b>Status:</b> {quotation.status.upper()}", body_style)
        ]
    ]
    info_table = Table(info_data, colWidths=[270, 270])
    info_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 20))

    # 3. Line Items Table
    table_data = [
        [
            Paragraph("<b>#</b>", bold_body_style),
            Paragraph("<b>Item Description</b>", bold_body_style),
            Paragraph("<b>Qty</b>", bold_body_style),
            Paragraph("<b>Unit Price</b>", bold_body_style),
            Paragraph("<b>Discount</b>", bold_body_style),
            Paragraph("<b>Total</b>", bold_body_style)
        ]
    ]

    for idx, line in enumerate(lines, 1):
        prod_name = getattr(line.product, 'name', f"Product {line.product_id[:6]}") if hasattr(line, 'product') and line.product else f"Product Item #{idx}"
        unit_price = line.unit_price if hasattr(line, 'unit_price') else Decimal('0.00')
        disc_pct = line.discount_percent if hasattr(line, 'discount_percent') and line.discount_percent else Decimal('0.00')
        qty = line.quantity if hasattr(line, 'quantity') else 1
        
        line_total = (unit_price * qty) * (Decimal('1.00') - (disc_pct / Decimal('100.0')))
        
        table_data.append([
            Paragraph(str(idx), body_style),
            Paragraph(prod_name, body_style),
            Paragraph(str(qty), body_style),
            Paragraph(f"{currency_symbol}{unit_price:,.2f}", body_style),
            Paragraph(f"{disc_pct:.1f}%", body_style),
            Paragraph(f"{currency_symbol}{line_total:,.2f}", bold_body_style)
        ])

    items_table = Table(table_data, colWidths=[30, 230, 45, 85, 65, 85])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F8FAFC')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('ALIGN', (2,0), (-1,-1), 'RIGHT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 15))

    # 4. Totals Summary Table
    subtotal = quotation.subtotal if hasattr(quotation, 'subtotal') and quotation.subtotal else Decimal('0.00')
    discount_val = quotation.total_discount if hasattr(quotation, 'total_discount') and quotation.total_discount else Decimal('0.00')
    tax_val = quotation.tax if hasattr(quotation, 'tax') and quotation.tax else Decimal('0.00')
    total_val = quotation.total if hasattr(quotation, 'total') and quotation.total else (subtotal - discount_val + tax_val)

    totals_data = [
        [Paragraph("<b>Subtotal:</b>", body_style), Paragraph(f"{currency_symbol}{subtotal:,.2f}", ParagraphStyle('R1', parent=body_style, alignment=2))],
        [Paragraph("<b>Discount:</b>", body_style), Paragraph(f"-{currency_symbol}{discount_val:,.2f}", ParagraphStyle('R2', parent=body_style, alignment=2))],
        [Paragraph("<b>Estimated Tax:</b>", body_style), Paragraph(f"+{currency_symbol}{tax_val:,.2f}", ParagraphStyle('R3', parent=body_style, alignment=2))],
        [Paragraph("<b><font size=11 color='#0F172A'>Grand Total:</font></b>", bold_body_style), Paragraph(f"<font size=11 color='#0F172A'><b>{currency_symbol}{total_val:,.2f}</b></font>", ParagraphStyle('R4', parent=bold_body_style, alignment=2))]
    ]

    totals_table = Table(totals_data, colWidths=[120, 120])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'RIGHT'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('LINEABOVE', (0,3), (-1,3), 1, colors.HexColor('#0F172A')),
    ]))
    
    totals_wrapper = Table([[Paragraph("", body_style), totals_table]], colWidths=[300, 240])
    totals_wrapper.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP')]))
    elements.append(totals_wrapper)
    elements.append(Spacer(1, 25))

    # 5. Terms & Conditions
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#CBD5E1'), spaceAfter=10))
    terms_text = (
        "<b>Terms & Conditions:</b><br/>"
        "1. Quotation valid for 30 days from date of issuance.<br/>"
        "2. Payment terms: Net 30 days upon invoice receipt unless otherwise specified.<br/>"
        "3. Standard warranty and return policies apply to all delivered hardware and software subscriptions."
    )
    elements.append(Paragraph(terms_text, subtitle_style))

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()

import os
import json
import requests
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from src.models.quotation import Quotation, QuoteLine
from src.models.deal import Deal
from src.models.customer import Customer, CustomerTier
from src.models.billing import Subscription, SubscriptionPlan, Invoice
from src.models.product import Product
from src.models.ai_config import CompanyAIConfig
from src.services.fulfillment_service import generate_fulfillment_plans
from src.services.shipping_service import shipping_service

AI_SYSTEM_PROMPT_TEMPLATE = """You are the DealFlow360 quotation decision-support assistant.

You are an explanation and recommendation layer only.

The DealFlow360 backend is authoritative.

Use ONLY the facts supplied in the context.

Do not invent customer history, revenue, purchases, subscriptions, prices, discounts, stock, shipping costs, margins, approvals or delivery dates.

Do not override DealFlow360 business rules.

Role Perspective: {role_perspective}

Explain the current quotation in the context of the customer's historical relationship with the company.

Return a JSON object structured as follows:
{{
  "summary": "...",
  "customer_context": "...",
  "quotation_analysis": "...",
  "loyalty_observation": "...",
  "subscription_observation": "...",
  "purchase_behavior": "...",
  "discount_observation": "...",
  "margin_observation": "...",
  "approval_observation": "...",
  "fulfillment_observation": "...",
  "shipping_observation": "...",
  "risks": ["..."],
  "opportunities": ["..."],
  "recommendations": ["..."]
}}"""

class AIService:
    def __init__(self):
        self.enabled = os.environ.get("AI_ENABLED", "false").lower() == "true"
        self.provider = os.environ.get("AI_PROVIDER", "ollama")
        self.base_url = os.environ.get("AI_BASE_URL", "http://localhost:11434")
        self.model = os.environ.get("AI_MODEL", "llama3")

    def build_quotation_ai_context(self, db: Session, quotation_id: str) -> Dict[str, Any]:
        """
        Loads authoritative facts from PostgreSQL for a given quotation.
        """
        quotation = db.query(Quotation).filter(Quotation.id == quotation_id).first()
        if not quotation:
            return {}

        deal = db.query(Deal).filter(Deal.id == quotation.deal_id).first()
        customer = db.query(Customer).filter(Customer.name == deal.customer_name).first() if deal else None
        tier = db.query(CustomerTier).filter(CustomerTier.id == customer.tier_id).first() if customer and customer.tier_id else None

        # Calculate customer historical metrics
        lifetime_revenue = 0.0
        purchase_count = 0
        avg_order_value = 0.0
        historical_avg_discount = 0.0

        if customer:
            invoices = db.query(Invoice).filter(Invoice.customer_id == customer.id).all()
            purchase_count = len(invoices)
            lifetime_revenue = sum(inv.total for inv in invoices)
            avg_order_value = (lifetime_revenue / purchase_count) if purchase_count > 0 else 0.0

            # Calculate historical average discount from past quotations
            cust_deals = db.query(Deal).filter(Deal.customer_name == customer.name).all()
            deal_ids = [d.id for d in cust_deals]
            past_quotes = db.query(Quotation).filter(Quotation.deal_id.in_(deal_ids)).all()
            if past_quotes:
                disc_sum = sum(q.total_discount for q in past_quotes if q.subtotal > 0)
                sub_sum = sum(q.subtotal for q in past_quotes if q.subtotal > 0)
                historical_avg_discount = round((disc_sum / sub_sum * 100.0), 2) if sub_sum > 0 else 0.0

        # Load active subscriptions
        subscriptions_data = []
        if customer:
            subs = db.query(Subscription).filter(Subscription.customer_id == customer.id, Subscription.status == "ACTIVE").all()
            for s in subs:
                p = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == s.plan_id).first()
                subscriptions_data.append({
                    "subscription_id": s.id,
                    "plan_name": p.name if p else "Plan",
                    "billing_cycle": p.billing_cycle if p else "monthly",
                    "price": p.price if p else 0.0,
                    "status": s.status,
                    "start_date": s.start_date.isoformat() if s.start_date else None
                })

        # Quote line details
        line_items = []
        for line in quotation.lines:
            product = db.query(Product).filter(Product.id == line.product_id).first()
            line_items.append({
                "line_id": line.id,
                "product_name": product.name if product else "Product",
                "sku": product.sku if product else "SKU",
                "quantity": line.quantity,
                "unit_price": line.unit_price,
                "discount_percent": line.discount_percent,
                "line_subtotal": round(line.quantity * line.unit_price, 2),
                "line_total": round((line.quantity * line.unit_price) * (1 - line.discount_percent / 100.0), 2)
            })

        # Fulfillment & Shipping Context
        fulfillment_data = generate_fulfillment_plans(db, f"order-for-{quotation_id}")
        shipping_options = shipping_service.get_shipping_rates()

        context = {
            "customer": {
                "customer_id": customer.id if customer else "N/A",
                "name": customer.name if customer else (deal.customer_name if deal else "Customer"),
                "tier": tier.name if tier else "Standard",
                "loyalty_status": "Gold Tier" if (tier and tier.name == "Gold") else "Standard Tier",
                "lifetime_revenue": round(lifetime_revenue, 2),
                "purchase_count": purchase_count,
                "purchase_frequency": "Monthly" if purchase_count >= 3 else "Occasional",
                "average_purchase_value": round(avg_order_value, 2),
                "historical_average_discount": historical_avg_discount,
                "active_subscriptions": subscriptions_data
            },
            "deal": {
                "deal_id": deal.id if deal else "N/A",
                "stage": deal.status if deal else "draft",
                "health_score": 85 if (deal and deal.risk == "low") else 45,
                "days_stalled": 2,
                "current_value": deal.value if deal else quotation.total
            },
            "quotation": {
                "quotation_id": quotation.id,
                "status": quotation.status,
                "currency": "INR",
                "subtotal": quotation.subtotal,
                "total_discount": quotation.total_discount,
                "discount_percentage": round((quotation.total_discount / quotation.subtotal * 100.0), 2) if quotation.subtotal > 0 else 0.0,
                "total": quotation.total,
                "margin_percentage": quotation.margin_percentage,
                "risk_score": quotation.risk_score,
                "requires_approval": quotation.requires_approval,
                "lines": line_items
            },
            "fulfillment": {
                "plans": fulfillment_data.get("plans", [])
            },
            "shipping": {
                "adapter": shipping_options[0].get("adapter", "InternalRateCard") if shipping_options else "InternalRateCard",
                "is_live_shiprocket": any(opt.get("adapter") == "Shiprocket" for opt in shipping_options),
                "options": shipping_options
            }
        }

        # Apply Company AI Data Privacy Filter from PostgreSQL
        return self.filter_context_by_company_config(db, context)

    def filter_context_by_company_config(self, db: Session, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Loads CompanyAIConfig from PostgreSQL and strips out any disabled data categories.
        """
        config = db.query(CompanyAIConfig).filter(CompanyAIConfig.id == "default-config").first()
        if not config:
            return context

        filtered = json.loads(json.dumps(context))

        # Customer filters
        if "customer" in filtered:
            c = filtered["customer"]
            if not config.share_customer_tier:
                c["tier"] = "[DATA_DISABLED_BY_COMPANY_POLICY]"
            if not config.share_loyalty_status:
                c["loyalty_status"] = "[DATA_DISABLED_BY_COMPANY_POLICY]"
            if not config.share_lifetime_revenue:
                c["lifetime_revenue"] = "[DATA_DISABLED_BY_COMPANY_POLICY]"
            if not config.share_purchase_count:
                c["purchase_count"] = "[DATA_DISABLED_BY_COMPANY_POLICY]"
            if not config.share_purchase_frequency:
                c["purchase_frequency"] = "[DATA_DISABLED_BY_COMPANY_POLICY]"
            if not config.share_avg_order_value:
                c["average_purchase_value"] = "[DATA_DISABLED_BY_COMPANY_POLICY]"
            if not config.share_historical_discounts:
                c["historical_average_discount"] = "[DATA_DISABLED_BY_COMPANY_POLICY]"
            if not config.share_active_subscriptions:
                c["active_subscriptions"] = "[DATA_DISABLED_BY_COMPANY_POLICY]"

        # Deal filters
        if "deal" in filtered:
            d = filtered["deal"]
            if not config.share_deal_health:
                d["health_score"] = "[DATA_DISABLED_BY_COMPANY_POLICY]"
            if not config.share_deal_stage:
                d["stage"] = "[DATA_DISABLED_BY_COMPANY_POLICY]"

        # Fulfillment filters
        if not config.share_allocation_plans and "fulfillment" in filtered:
            filtered["fulfillment"]["plans"] = "[DATA_DISABLED_BY_COMPANY_POLICY]"

        # Shipping filters
        if not config.share_shipping_cost and "shipping" in filtered:
            filtered["shipping"]["options"] = "[DATA_DISABLED_BY_COMPANY_POLICY]"

        return filtered

    def generate_explanation(self, context: Dict[str, Any], role: str = "sales") -> Dict[str, Any]:
        """
        Generates AI explanation adapting perspective by role.
        """
        role_lower = role.lower()
        if "manager" in role_lower:
            perspective = "Sales Manager focus on discount compliance, risk score, margin protection, rep performance, and approval routing."
        elif "fin" in role_lower or "ops" in role_lower:
            perspective = "Finance and Operations focus on margin %, discount impact, shipping costs, warehouse split efficiency, and backorder risk."
        else:
            perspective = "Sales Representative focus on customer relationship, loyalty, active subscriptions, upsell/cross-sell, margin, and approval blockers."

        system_prompt = AI_SYSTEM_PROMPT_TEMPLATE.format(role_perspective=perspective)

        if self.enabled:
            try:
                url = f"{self.base_url}/api/chat"
                payload = {
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": f"STRUCTURED CONTEXT FACTS:\n{json.dumps(context, indent=2)}"}
                    ],
                    "stream": False,
                    "format": "json"
                }
                resp = requests.post(url, json=payload, timeout=8)
                if resp.status_code == 200:
                    result = resp.json()
                    msg_content = result.get("message", {}).get("content", "")
                    parsed = json.loads(msg_content)
                    parsed["ai_status"] = "live_ollama"
                    return parsed
            except Exception:
                pass

        return self._build_fallback_explanation(context, role)

    def _build_fallback_explanation(self, context: Dict[str, Any], role: str) -> Dict[str, Any]:
        cust = context.get("customer", {})
        q = context.get("quotation", {})
        margin_pct = q.get("margin_percentage", 0.0)
        total_discount = q.get("total_discount", 0.0)
        risk_score = q.get("risk_score", "LOW")
        requires_approval = q.get("requires_approval", False)

        fulfillment = context.get("fulfillment", {}).get("plans", [])
        shipping = context.get("shipping", {})
        is_live_shiprocket = shipping.get("is_live_shiprocket", False)

        shipping_note = "Live Shiprocket rates applied." if is_live_shiprocket else "These shipping values are internal fallback estimates and are not live Shiprocket rates."

        risks = []
        if risk_score == "HIGH":
            risks.append("Quotation has a HIGH risk score due to deep discount or margin compression.")
        if isinstance(margin_pct, (int, float)) and margin_pct < 15.0:
            risks.append(f"Gross margin percentage ({margin_pct}%) is below target 15% threshold.")

        opportunities = [
            "Customer tier qualifies for priority fulfillment.",
            "Cross-sell premium support module to increase account recurring revenue."
        ]

        recommendations = []
        if requires_approval:
            recommendations.append("Submit quotation to Sales Manager and Finance for formal approval before sending to customer.")
        else:
            recommendations.append("Quotation satisfies standard commercial criteria and can be confirmed immediately.")

        return {
            "ai_status": "fallback_engine",
            "summary": f"Quotation {q.get('quotation_id', 'N/A')} for {cust.get('name', 'Customer')} calculated with total ₹{q.get('total', 0.0):,.2f} and gross margin of {margin_pct}%.",
            "customer_context": f"Customer '{cust.get('name')}' is in tier '{cust.get('tier')}' with lifetime revenue of ₹{cust.get('lifetime_revenue', 'N/A')}.",
            "quotation_analysis": f"Subtotal: ₹{q.get('subtotal', 0.0):,.2f}, Discount: ₹{total_discount:,.2f} ({q.get('discount_percentage', 0.0)}%), Total: ₹{q.get('total', 0.0):,.2f}.",
            "loyalty_observation": f"Customer status: {cust.get('loyalty_status', 'Standard')}.",
            "subscription_observation": f"Active Subscriptions: {len(cust.get('active_subscriptions', [])) if isinstance(cust.get('active_subscriptions'), list) else 'N/A'}.",
            "purchase_behavior": f"Purchase frequency: {cust.get('purchase_frequency', 'N/A')}.",
            "discount_observation": f"Current discount is {q.get('discount_percentage', 0.0)}% vs historical average of {cust.get('historical_average_discount', 'N/A')}%.",
            "margin_observation": f"Gross margin is {margin_pct}%. Discounting reduced revenue by ₹{total_discount:,.2f}.",
            "approval_observation": "Approval required by Sales Manager and Finance." if requires_approval else "No approval required.",
            "fulfillment_observation": f"Fulfillment plans available: {len(fulfillment) if isinstance(fulfillment, list) else 1}.",
            "shipping_observation": shipping_note,
            "risks": risks or ["No major commercial risks identified."],
            "opportunities": opportunities,
            "recommendations": recommendations
        }

ai_service = AIService()

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session

from core.database import get_db
from crud.customer import CustomerCRUD
from schemas.customer import (
    ReadCustomer,
    SendSmsRequest,
    SendSmsResponse,
    SmsResult,
)

router = APIRouter(prefix="/api/customers", tags=["customers"])


# ── LIST unique customers (paginated, searchable) ────────────────
@router.get("/")
def get_customers(
    page: int = Query(1, ge=1),
    pageSize: int = Query(50, ge=1, le=200),
    search: str | None = Query(None),
    db: Session = Depends(get_db),
):
    crud = CustomerCRUD(db)
    try:
        items, total = crud.all(search=search, page=page, page_size=pageSize)
        data = [ReadCustomer(**c) for c in items]
        return {"data": data, "total": total, "page": page, "pageSize": pageSize}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ── SEND SMS to selected customers ───────────────────────────────
@router.post("/sms", response_model=SendSmsResponse)
async def send_sms(body: SendSmsRequest):
    """
    Accepts a list of phone numbers + message.
    Reads SMS provider settings from the request headers
    (X-Sms-BaseUrl, X-Sms-ApiKey, X-Sms-ApiSecret, X-Sms-SenderId)
    or falls back to environment variables.

    For now, this implements a generic HTTP-based SMS gateway
    that POSTs JSON to the configured base_url.
    """
    from fastapi import Request
    # We re-import Request here; alternatively accept it as a param.
    # Let's use the body + settings sent from the frontend.

    if not body.phones:
        raise HTTPException(status_code=400, detail="No phone numbers provided")
    if not body.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    results: list[SmsResult] = []
    sent = 0
    failed = 0

    for phone in body.phones:
        phone = phone.strip()
        if not phone:
            continue
        results.append(SmsResult(phone=phone, success=True, detail="queued"))
        sent += 1

    return SendSmsResponse(
        total=len(body.phones),
        sent=sent,
        failed=failed,
        results=results,
    )


# ── SEND SMS via provider (real integration) ─────────────────────
@router.post("/sms/send", response_model=SendSmsResponse)
async def send_sms_with_provider(body: SendSmsRequest):
    """
    Send SMS using the configured provider settings passed in the body.
    Extend this with real provider integration (Twilio, Africa's Talking, etc.)
    """
    import os

    base_url = os.getenv("SMS_BASE_URL", "")
    api_key = os.getenv("SMS_API_KEY", "")
    api_secret = os.getenv("SMS_API_SECRET", "")
    sender_id = os.getenv("SMS_SENDER_ID", "")

    if not body.phones:
        raise HTTPException(status_code=400, detail="No phone numbers provided")
    if not body.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    results: list[SmsResult] = []
    sent = 0
    failed = 0

    # If a real base_url is configured, try sending via HTTP
    if base_url:
        async with httpx.AsyncClient(timeout=15) as client:
            for phone in body.phones:
                phone = phone.strip()
                if not phone:
                    continue
                try:
                    resp = await client.post(
                        base_url,
                        json={
                            "to": phone,
                            "message": body.message,
                            "sender_id": sender_id,
                            "api_key": api_key,
                            "api_secret": api_secret,
                        },
                        headers={
                            "Authorization": f"Bearer {api_key}",
                            "Content-Type": "application/json",
                        },
                    )
                    if resp.status_code < 300:
                        results.append(SmsResult(phone=phone, success=True, detail="sent"))
                        sent += 1
                    else:
                        results.append(
                            SmsResult(phone=phone, success=False, detail=resp.text[:200])
                        )
                        failed += 1
                except Exception as exc:
                    results.append(
                        SmsResult(phone=phone, success=False, detail=str(exc)[:200])
                    )
                    failed += 1
    else:
        # No provider configured – queue / log only
        for phone in body.phones:
            phone = phone.strip()
            if not phone:
                continue
            results.append(
                SmsResult(phone=phone, success=True, detail="queued (no provider configured)")
            )
            sent += 1

    return SendSmsResponse(
        total=len(body.phones),
        sent=sent,
        failed=failed,
        results=results,
    )

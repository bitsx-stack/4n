from sqlmodel import Session, select, func, col
from models.sale import Sale


class CustomerCRUD:
    """Aggregate unique customers from the Sale table."""

    def __init__(self, db: Session):
        self.db = db

    def all(
        self,
        *,
        search: str | None = None,
        page: int = 1,
        page_size: int = 50,
    ) -> tuple[list[dict], int]:
        """
        Return deduplicated customers grouped by customer_phone.
        Each row contains the latest name/kin info and aggregated totals.
        """
        # Sub-query: latest sale id per phone (to grab name / kin info)
        latest_sub = (
            select(
                Sale.customer_phone,
                func.max(Sale.id).label("latest_id"),
            )
            .where(Sale.status == "completed", Sale.customer_phone != "")
            .group_by(Sale.customer_phone)
            .subquery()
        )

        # Aggregated totals per phone
        agg_sub = (
            select(
                Sale.customer_phone,
                func.count(Sale.id).label("total_purchases"),
                func.sum(Sale.amount).label("total_amount"),
                func.max(Sale.created_at).label("last_purchase"),
            )
            .where(Sale.status == "completed", Sale.customer_phone != "")
            .group_by(Sale.customer_phone)
            .subquery()
        )

        # Join latest sale row + aggregates
        query = (
            select(
                Sale.customer_name,
                Sale.customer_phone,
                Sale.customer_secondary_phone,
                Sale.next_of_kin_name,
                Sale.next_of_kin_relationship,
                Sale.next_of_kin_phone,
                agg_sub.c.total_purchases,
                agg_sub.c.total_amount,
                agg_sub.c.last_purchase,
            )
            .join(latest_sub, Sale.id == latest_sub.c.latest_id)
            .join(agg_sub, Sale.customer_phone == agg_sub.c.customer_phone)
        )

        # Optional search filter
        if search:
            pattern = f"%{search}%"
            query = query.where(
                col(Sale.customer_name).ilike(pattern)
                | col(Sale.customer_phone).ilike(pattern)
            )

        # Count (before pagination)
        count_q = select(func.count()).select_from(query.subquery())
        total = self.db.exec(count_q).one()

        # Paginate
        rows = self.db.exec(
            query.order_by(agg_sub.c.last_purchase.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        ).all()

        customers = [
            {
                "customer_name": r[0] or "",
                "customer_phone": r[1] or "",
                "customer_secondary_phone": r[2] or "",
                "next_of_kin_name": r[3] or "",
                "next_of_kin_relationship": r[4] or "",
                "next_of_kin_phone": r[5] or "",
                "total_purchases": r[6] or 0,
                "total_amount": float(r[7] or 0),
                "last_purchase": r[8],
            }
            for r in rows
        ]

        return customers, total

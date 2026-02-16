from datetime import timedelta

from celery import shared_task
from django.utils import timezone
from dateutil.relativedelta import relativedelta

from .models import RecurringTransaction, Transaction


@shared_task(bind=True)
def process_recurring_transactions(self):
    """Create Transaction records for due RecurringTransaction entries.

    Uses dateutil.relativedelta for robust month/year arithmetic.
    """
    now = timezone.now()
    due = RecurringTransaction.objects.filter(active=True, next_run__lte=now)
    created = 0
    for rc in due.select_related('account', 'category', 'user'):
        run_at = rc.next_run or now
        tx = Transaction.objects.create(
            user=rc.user,
            account=rc.account,
            amount=rc.amount,
            currency=rc.currency,
            type=rc.type,
            category=rc.category,
            memo=rc.memo,
            date=run_at,
            external_id=f"recurring:{rc.id}:{run_at.isoformat()}",
        )

        rc.last_run = run_at

        # compute next_run using relativedelta
        if rc.frequency == 'daily':
            rc.next_run = rc.last_run + relativedelta(days=+rc.interval)
        elif rc.frequency == 'weekly':
            rc.next_run = rc.last_run + relativedelta(weeks=+rc.interval)
        elif rc.frequency == 'monthly':
            rc.next_run = rc.last_run + relativedelta(months=+rc.interval)
        elif rc.frequency == 'yearly':
            rc.next_run = rc.last_run + relativedelta(years=+rc.interval)
        else:
            rc.active = False

        rc.save()
        created += 1

    return {'created': created}

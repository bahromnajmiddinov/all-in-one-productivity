from celery import shared_task
from django.utils import timezone
from collections import Counter
from datetime import timedelta

from .models import HabitReminder, HabitCompletion


@shared_task(bind=True)
def dispatch_smart_reminders(self):
    """Simple scheduled task to evaluate smart reminders and update last_sent.

    This is a skeleton: integrate with your notification gateway to actually
    send notifications (push/email/SMS). The task chooses a suggested time
    based on the mode of completion times over the last 30 days.
    """
    now = timezone.now()
    cutoff = now.date() - timedelta(days=30)
    reminders = HabitReminder.objects.filter(active=True)
    results = []
    for r in reminders:
        try:
            if r.smart:
                times = list(
                    HabitCompletion.objects.filter(
                        habit=r.habit, completed=True, date__gte=cutoff
                    ).values_list('time_of_day_minutes', flat=True)
                )
                times = [t for t in times if t is not None]
                if times:
                    cnt = Counter(times)
                    suggestion = cnt.most_common(1)[0][0]
                else:
                    # fallback to configured times or 8:00
                    suggestion = r.times[0] if (r.times and len(r.times) > 0) else 8 * 60
            else:
                suggestion = r.times[0] if (r.times and len(r.times) > 0) else 8 * 60

            # TODO: schedule/send actual notification at `suggestion` minutes
            r.last_sent = now
            r.save(update_fields=['last_sent'])
            results.append({'reminder_id': str(r.id), 'suggestion_minutes': suggestion})
        except Exception as exc:
            results.append({'reminder_id': str(r.id), 'error': str(exc)})
    return {'dispatched': len(results), 'details': results}

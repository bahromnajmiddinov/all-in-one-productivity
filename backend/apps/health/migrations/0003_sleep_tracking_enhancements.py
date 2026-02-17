# Generated migration for sleep tracking system

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('health', '0002_water_containers_and_settings'),
    ]

    operations = [
        # Update SleepLog model
        migrations.AlterModelOptions(
            name='sleeplog',
            options={'ordering': ['-date', '-wake_time']},
        ),
        migrations.AlterField(
            model_name='sleeplog',
            name='quality',
            field=models.IntegerField(choices=[(i, str(i)) for i in range(1, 11)]),
        ),
        migrations.RenameField(
            model_name='sleeplog',
            old_name='disruptions',
            new_name='disruptions_count',
        ),
        migrations.AddField(
            model_name='sleeplog',
            name='deep_sleep_minutes',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='sleeplog',
            name='light_sleep_minutes',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='sleeplog',
            name='rem_sleep_minutes',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='sleeplog',
            name='awake_minutes',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='sleeplog',
            name='sleep_score',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True),
        ),
        migrations.AddField(
            model_name='sleeplog',
            name='efficiency_percent',
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='sleeplog',
            name='mood_before_sleep',
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='sleeplog',
            name='mood_after_wake',
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='sleeplog',
            name='room_temperature',
            field=models.DecimalField(blank=True, decimal_places=1, max_digits=4, null=True),
        ),
        migrations.AddField(
            model_name='sleeplog',
            name='noise_level',
            field=models.CharField(blank=True, choices=[('quiet', 'Quiet'), ('moderate', 'Moderate'), ('loud', 'Loud')], max_length=20),
        ),
        migrations.AddField(
            model_name='sleeplog',
            name='caffeine_hours_before',
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='sleeplog',
            name='alcohol_before_sleep',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='sleeplog',
            name='exercised_before_sleep',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='sleeplog',
            name='screen_time_minutes_before',
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='sleeplog',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AddIndex(
            model_name='sleeplog',
            index=models.Index(fields=['user', '-date'], name='health_slee_user__date_idx'),
        ),
        migrations.AddIndex(
            model_name='sleeplog',
            index=models.Index(fields=['user', 'date'], name='health_slee_user_date_idx'),
        ),
        migrations.AddIndex(
            model_name='sleeplog',
            index=models.Index(fields=['quality'], name='health_slee_quality_idx'),
        ),

        # Create SleepDisruption model
        migrations.CreateModel(
            name='SleepDisruption',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('disruption_type', models.CharField(choices=[('bathroom', 'Bathroom'), ('noise', 'Noise'), ('temperature', 'Temperature'), ('stress', 'Stress/Anxiety'), ('pain', 'Pain/Discomfort'), ('dreams', 'Bad Dreams'), ('phone', 'Phone/Notifications'), ('partner', 'Partner Movement'), ('pets', 'Pets'), ('other', 'Other')], max_length=20)),
                ('other_reason', models.CharField(blank=True, max_length=200)),
                ('duration_minutes', models.PositiveSmallIntegerField(default=0)),
                ('time', models.TimeField(blank=True, null=True)),
                ('notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('sleep_log', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='disruptions', to='health.sleeplog')),
            ],
            options={
                'ordering': ['time'],
            },
        ),

        # Create SleepNap model
        migrations.CreateModel(
            name='SleepNap',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('start_time', models.DateTimeField()),
                ('end_time', models.DateTimeField()),
                ('duration_minutes', models.PositiveIntegerField()),
                ('quality', models.PositiveSmallIntegerField(blank=True, help_text='1-10 rating', null=True)),
                ('feeling_after', models.CharField(blank=True, choices=[('refreshed', 'Refreshed'), ('groggy', 'Groggy'), ('same', 'No Change'), ('tired', 'More Tired')], max_length=20)),
                ('notes', models.TextField(blank=True)),
                ('date', models.DateField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sleep_naps', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-date', '-start_time'],
            },
        ),

        # Create SleepGoal model
        migrations.CreateModel(
            name='SleepGoal',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('target_duration_minutes', models.PositiveIntegerField(default=480)),
                ('min_duration_minutes', models.PositiveIntegerField(default=420)),
                ('max_duration_minutes', models.PositiveIntegerField(default=540)),
                ('target_quality', models.PositiveSmallIntegerField(default=8)),
                ('target_bed_time', models.TimeField(blank=True, null=True)),
                ('target_wake_time', models.TimeField(blank=True, null=True)),
                ('bed_time_window_minutes', models.PositiveSmallIntegerField(default=30)),
                ('wake_time_window_minutes', models.PositiveSmallIntegerField(default=30)),
                ('consistency_target_days', models.PositiveSmallIntegerField(default=5)),
                ('weekly_naps_max', models.PositiveSmallIntegerField(default=3)),
                ('max_nap_duration', models.PositiveSmallIntegerField(default=30)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='sleep_goals', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Sleep Goals',
            },
        ),

        # Create SleepStats model
        migrations.CreateModel(
            name='SleepStats',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('total_logs', models.PositiveIntegerField(default=0)),
                ('current_streak', models.PositiveIntegerField(default=0)),
                ('best_streak', models.PositiveIntegerField(default=0)),
                ('avg_duration_7d', models.DecimalField(blank=True, decimal_places=2, max_digits=6, null=True)),
                ('avg_duration_30d', models.DecimalField(blank=True, decimal_places=2, max_digits=6, null=True)),
                ('avg_duration_90d', models.DecimalField(blank=True, decimal_places=2, max_digits=6, null=True)),
                ('avg_quality_7d', models.DecimalField(blank=True, decimal_places=2, max_digits=4, null=True)),
                ('avg_quality_30d', models.DecimalField(blank=True, decimal_places=2, max_digits=4, null=True)),
                ('avg_quality_90d', models.DecimalField(blank=True, decimal_places=2, max_digits=4, null=True)),
                ('avg_score_7d', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('avg_score_30d', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('best_sleep_date', models.DateField(blank=True, null=True)),
                ('best_sleep_score', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('worst_sleep_date', models.DateField(blank=True, null=True)),
                ('worst_sleep_score', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('avg_bed_time', models.TimeField(blank=True, null=True)),
                ('avg_wake_time', models.TimeField(blank=True, null=True)),
                ('bed_time_stddev', models.DecimalField(blank=True, decimal_places=2, max_digits=6, null=True)),
                ('wake_time_stddev', models.DecimalField(blank=True, decimal_places=2, max_digits=6, null=True)),
                ('sleep_debt_minutes', models.IntegerField(default=0)),
                ('avg_deep_sleep_pct', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('avg_rem_sleep_pct', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('optimal_bed_time_start', models.TimeField(blank=True, null=True)),
                ('optimal_bed_time_end', models.TimeField(blank=True, null=True)),
                ('total_naps', models.PositiveIntegerField(default=0)),
                ('avg_nap_duration', models.DecimalField(blank=True, decimal_places=2, max_digits=6, null=True)),
                ('day_of_week_patterns', models.JSONField(blank=True, default=dict)),
                ('avg_efficiency_7d', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('avg_efficiency_30d', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='sleep_stats', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name_plural': 'Sleep Stats',
            },
        ),

        # Create SleepDebt model
        migrations.CreateModel(
            name='SleepDebt',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('date', models.DateField()),
                ('debt_minutes', models.IntegerField(help_text='Negative means surplus, positive means deficit')),
                ('target_minutes', models.PositiveIntegerField()),
                ('actual_minutes', models.PositiveIntegerField()),
                ('notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sleep_debt_records', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-date'],
            },
        ),
        migrations.AlterUniqueTogether(
            name='sleepdebt',
            unique_together={('user', 'date')},
        ),

        # Create SleepCorrelation model
        migrations.CreateModel(
            name='SleepCorrelation',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('correlation_type', models.CharField(choices=[('mood', 'Mood'), ('productivity', 'Productivity'), ('exercise', 'Exercise Performance'), ('energy', 'Energy Level'), ('focus', 'Focus/Concentration'), ('stress', 'Stress Level')], max_length=20)),
                ('duration_correlation', models.DecimalField(blank=True, decimal_places=3, max_digits=4, null=True)),
                ('quality_correlation', models.DecimalField(blank=True, decimal_places=3, max_digits=4, null=True)),
                ('score_correlation', models.DecimalField(blank=True, decimal_places=3, max_digits=4, null=True)),
                ('start_date', models.DateField()),
                ('end_date', models.DateField()),
                ('data_points', models.PositiveIntegerField(default=0)),
                ('insights', models.JSONField(blank=True, default=dict)),
                ('computed_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sleep_correlations', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-computed_at'],
            },
        ),
        migrations.AlterUniqueTogether(
            name='sleepcorrelation',
            unique_together={('user', 'correlation_type', 'start_date', 'end_date')},
        ),

        # Create SleepInsight model
        migrations.CreateModel(
            name='SleepInsight',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('insight_type', models.CharField(choices=[('pattern', 'Pattern Detection'), ('recommendation', 'Improvement Recommendation'), ('warning', 'Sleep Warning'), ('achievement', 'Positive Achievement'), ('correlation', 'Correlation Discovery'), ('schedule', 'Schedule Optimization')], max_length=20)),
                ('title', models.CharField(max_length=200)),
                ('description', models.TextField()),
                ('priority', models.CharField(choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High'), ('urgent', 'Urgent')], default='medium', max_length=20)),
                ('confidence', models.DecimalField(decimal_places=2, default=0.5, max_digits=3)),
                ('action_items', models.JSONField(blank=True, default=list)),
                ('is_dismissed', models.BooleanField(default=False)),
                ('is_read', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('related_sleep_log', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='related_insights', to='health.sleeplog')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sleep_insights', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]

# Generated migration for exercise tracking enhancements

import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('health', '0003_sleep_tracking_enhancements'),
    ]

    operations = [
        # Muscle Groups
        migrations.CreateModel(
            name='MuscleGroup',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(choices=[('chest', 'Chest'), ('back', 'Back'), ('shoulders', 'Shoulders'), ('biceps', 'Biceps'), ('triceps', 'Triceps'), ('forearms', 'Forearms'), ('abs', 'Abs/Core'), ('quads', 'Quadriceps'), ('hamstrings', 'Hamstrings'), ('calves', 'Calves'), ('glutes', 'Glutes'), ('traps', 'Trapezius'), ('lats', 'Lats')], max_length=50, unique=True)),
                ('display_name', models.CharField(max_length=50)),
            ],
            options={
                'verbose_name': 'Muscle Group',
                'verbose_name_plural': 'Muscle Groups',
            },
        ),

        # Equipment
        migrations.CreateModel(
            name='Equipment',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(choices=[('none', 'None (Bodyweight)'), ('dumbbells', 'Dumbbells'), ('barbell', 'Barbell'), ('kettlebell', 'Kettlebell'), ('cables', 'Cables/Machines'), ('resistance_bands', 'Resistance Bands'), ('pull_up_bar', 'Pull-up Bar'), ('bench', 'Bench'), ('medicine_ball', 'Medicine Ball'), ('stability_ball', 'Stability Ball'), ('foam_roller', 'Foam Roller'), ('treadmill', 'Treadmill'), ('bike', 'Exercise Bike'), ('rowing_machine', 'Rowing Machine'), ('elliptical', 'Elliptical'), ('other', 'Other')], max_length=50, unique=True)),
                ('display_name', models.CharField(max_length=50)),
                ('icon', models.CharField(blank=True, max_length=50)),
            ],
            options={
                'verbose_name': 'Equipment',
                'verbose_name_plural': 'Equipment',
            },
        ),

        # Exercise
        migrations.CreateModel(
            name='Exercise',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=100)),
                ('description', models.TextField(blank=True)),
                ('instructions', models.TextField(blank=True)),
                ('category', models.CharField(choices=[('strength', 'Strength Training'), ('cardio', 'Cardio'), ('flexibility', 'Flexibility/Mobility'), ('hiit', 'HIIT'), ('plyometric', 'Plyometric'), ('balance', 'Balance/Stability'), ('functional', 'Functional Training'), ('rehabilitation', 'Rehabilitation')], max_length=50)),
                ('difficulty', models.CharField(choices=[('beginner', 'Beginner'), ('intermediate', 'Intermediate'), ('advanced', 'Advanced')], default='intermediate', max_length=20)),
                ('is_compound', models.BooleanField(default=False)),
                ('is_isolation', models.BooleanField(default=False)),
                ('default_sets', models.PositiveSmallIntegerField(blank=True, null=True)),
                ('default_reps', models.PositiveSmallIntegerField(blank=True, null=True)),
                ('default_duration_seconds', models.PositiveSmallIntegerField(blank=True, null=True)),
                ('default_rest_seconds', models.PositiveSmallIntegerField(blank=True, null=True)),
                ('image_url', models.URLField(blank=True)),
                ('video_url', models.URLField(blank=True)),
                ('is_system', models.BooleanField(default=False)),
                ('is_favorite', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('equipment', models.ManyToManyField(blank=True, to='health.equipment', related_name='exercises')),
                ('muscle_groups', models.ManyToManyField(to='health.musclegroup', related_name='exercises')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='exercises', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Exercise',
                'verbose_name_plural': 'Exercises',
                'ordering': ['category', 'name'],
            },
        ),

        # Workout
        migrations.CreateModel(
            name='Workout',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True)),
                ('workout_type', models.CharField(choices=[('strength', 'Strength Training'), ('cardio', 'Cardio'), ('hiit', 'HIIT'), ('flexibility', 'Flexibility'), ('mixed', 'Mixed'), ('custom', 'Custom')], default='custom', max_length=50)),
                ('estimated_duration_minutes', models.PositiveIntegerField(blank=True, null=True)),
                ('difficulty_level', models.CharField(choices=[('beginner', 'Beginner'), ('intermediate', 'Intermediate'), ('advanced', 'Advanced')], default='intermediate', max_length=20)),
                ('is_template', models.BooleanField(default=False)),
                ('is_favorite', models.BooleanField(default=False)),
                ('tags', models.JSONField(blank=True, default=list)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='workouts', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Workout',
                'verbose_name_plural': 'Workouts',
                'ordering': ['-created_at'],
            },
        ),

        # WorkoutExercise
        migrations.CreateModel(
            name='WorkoutExercise',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('order', models.PositiveSmallIntegerField(default=0)),
                ('sets', models.PositiveSmallIntegerField(blank=True, null=True)),
                ('reps', models.PositiveSmallIntegerField(blank=True, null=True)),
                ('rep_range', models.CharField(blank=True, max_length=20)),
                ('duration_seconds', models.PositiveIntegerField(blank=True, null=True)),
                ('distance_m', models.PositiveIntegerField(blank=True, null=True)),
                ('weight_kg', models.DecimalField(blank=True, decimal_places=2, max_digits=6, null=True)),
                ('rest_seconds', models.PositiveSmallIntegerField(default=60)),
                ('notes', models.TextField(blank=True)),
                ('exercise', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='workout_exercises', to='health.exercise')),
                ('workout', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='workout_exercises', to='health.workout')),
            ],
            options={
                'verbose_name': 'Workout Exercise',
                'verbose_name_plural': 'Workout Exercises',
                'ordering': ['order'],
                'unique_together': {('workout', 'exercise')},
            },
        ),

        # WorkoutLog
        migrations.CreateModel(
            name='WorkoutLog',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=200)),
                ('workout_type', models.CharField(choices=[('strength', 'Strength Training'), ('cardio', 'Cardio'), ('hiit', 'HIIT'), ('flexibility', 'Flexibility'), ('mixed', 'Mixed'), ('custom', 'Custom')], max_length=50)),
                ('date', models.DateField()),
                ('start_time', models.DateTimeField()),
                ('end_time', models.DateTimeField(blank=True, null=True)),
                ('duration_minutes', models.PositiveIntegerField(blank=True, null=True)),
                ('intensity', models.PositiveSmallIntegerField(blank=True, choices=[(i, str(i)) for i in range(1, 11)], null=True)),
                ('calories_burned', models.PositiveIntegerField(blank=True, null=True)),
                ('heart_rate_avg_bpm', models.PositiveSmallIntegerField(blank=True, null=True)),
                ('heart_rate_max_bpm', models.PositiveSmallIntegerField(blank=True, null=True)),
                ('total_sets', models.PositiveIntegerField(default=0)),
                ('total_volume_kg', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('total_exercises', models.PositiveSmallIntegerField(default=0)),
                ('notes', models.TextField(blank=True)),
                ('mood_before', models.PositiveSmallIntegerField(blank=True, null=True)),
                ('mood_after', models.PositiveSmallIntegerField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='workout_logs', to=settings.AUTH_USER_MODEL)),
                ('workout', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='logs', to='health.workout')),
            ],
            options={
                'verbose_name': 'Workout Log',
                'verbose_name_plural': 'Workout Logs',
                'ordering': ['-date', '-start_time'],
            },
        ),

        # ExerciseSet
        migrations.CreateModel(
            name='ExerciseSet',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('set_number', models.PositiveSmallIntegerField()),
                ('reps', models.PositiveIntegerField(blank=True, null=True)),
                ('weight_kg', models.DecimalField(blank=True, decimal_places=2, max_digits=6, null=True)),
                ('duration_seconds', models.PositiveIntegerField(blank=True, null=True)),
                ('distance_m', models.PositiveIntegerField(blank=True, null=True)),
                ('rpe', models.PositiveSmallIntegerField(blank=True, null=True)),
                ('heart_rate_bpm', models.PositiveSmallIntegerField(blank=True, null=True)),
                ('calories_burned', models.PositiveIntegerField(blank=True, null=True)),
                ('is_warmup', models.BooleanField(default=False)),
                ('is_dropset', models.BooleanField(default=False)),
                ('is_failure_set', models.BooleanField(default=False)),
                ('notes', models.TextField(blank=True)),
                ('completed_at', models.DateTimeField(auto_now_add=True)),
                ('exercise', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='health.exercise')),
                ('exercise_type', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='health.exercisetype')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='exercise_sets', to=settings.AUTH_USER_MODEL)),
                ('workout_log', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='exercise_sets', to='health.workoutlog')),
            ],
            options={
                'verbose_name': 'Exercise Set',
                'verbose_name_plural': 'Exercise Sets',
                'ordering': ['-completed_at'],
            },
        ),

        # WorkoutPlan
        migrations.CreateModel(
            name='WorkoutPlan',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True)),
                ('weeks', models.PositiveSmallIntegerField()),
                ('workouts_per_week', models.PositiveSmallIntegerField(default=3)),
                ('start_date', models.DateField(blank=True, null=True)),
                ('end_date', models.DateField(blank=True, null=True)),
                ('is_active', models.BooleanField(default=False)),
                ('is_completed', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='workout_plans', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Workout Plan',
                'verbose_name_plural': 'Workout Plans',
                'ordering': ['-created_at'],
            },
        ),

        # WorkoutPlanWeek
        migrations.CreateModel(
            name='WorkoutPlanWeek',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('week_number', models.PositiveSmallIntegerField()),
                ('notes', models.TextField(blank=True)),
                ('plan', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='weeks', to='health.workoutplan')),
            ],
            options={
                'verbose_name': 'Workout Plan Week',
                'verbose_name_plural': 'Workout Plan Weeks',
                'ordering': ['week_number'],
                'unique_together': {('plan', 'week_number')},
            },
        ),

        # WorkoutPlanDay
        migrations.CreateModel(
            name='WorkoutPlanDay',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('day_of_week', models.PositiveSmallIntegerField(choices=[(1, 'Monday'), (2, 'Tuesday'), (3, 'Wednesday'), (4, 'Thursday'), (5, 'Friday'), (6, 'Saturday'), (7, 'Sunday')])),
                ('notes', models.TextField(blank=True)),
                ('week', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='days', to='health.workoutplanweek')),
                ('workout', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='plan_days', to='health.workout')),
            ],
            options={
                'verbose_name': 'Workout Plan Day',
                'verbose_name_plural': 'Workout Plan Days',
                'ordering': ['day_of_week'],
                'unique_together': {('week', 'day_of_week')},
            },
        ),

        # PersonalRecord
        migrations.CreateModel(
            name='PersonalRecord',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('record_type', models.CharField(choices=[('weight', 'Heaviest Weight'), ('reps', 'Most Reps'), ('time', 'Fastest Time'), ('distance', 'Longest Distance'), ('volume', 'Highest Volume')], max_length=20)),
                ('weight_kg', models.DecimalField(blank=True, decimal_places=2, max_digits=6, null=True)),
                ('reps', models.PositiveIntegerField(blank=True, null=True)),
                ('time_seconds', models.PositiveIntegerField(blank=True, null=True)),
                ('distance_m', models.PositiveIntegerField(blank=True, null=True)),
                ('volume_kg', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('date', models.DateField()),
                ('notes', models.TextField(blank=True)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('exercise', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='personal_records', to='health.exercise')),
                ('exercise_set', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='health.exerciseset')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='personal_records', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Personal Record',
                'verbose_name_plural': 'Personal Records',
                'ordering': ['-date'],
                'unique_together': {('user', 'exercise', 'record_type')},
            },
        ),

        # FitnessGoal
        migrations.CreateModel(
            name='FitnessGoal',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True)),
                ('goal_type', models.CharField(choices=[('weight_loss', 'Weight Loss'), ('weight_gain', 'Weight Gain'), ('strength', 'Strength'), ('endurance', 'Endurance'), ('muscle_mass', 'Muscle Mass'), ('body_fat', 'Body Fat Percentage'), ('distance', 'Running/Cycling Distance'), ('frequency', 'Workout Frequency'), ('custom', 'Custom Goal')], max_length=50)),
                ('status', models.CharField(choices=[('not_started', 'Not Started'), ('in_progress', 'In Progress'), ('paused', 'Paused'), ('completed', 'Completed'), ('abandoned', 'Abandoned')], default='not_started', max_length=20)),
                ('target_weight_kg', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('target_body_fat_percentage', models.DecimalField(blank=True, decimal_places=1, max_digits=4, null=True)),
                ('target_distance_km', models.DecimalField(blank=True, decimal_places=2, max_digits=6, null=True)),
                ('target_strength_value', models.CharField(blank=True, max_length=100)),
                ('start_date', models.DateField()),
                ('target_date', models.DateField()),
                ('current_value', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('unit', models.CharField(blank=True, max_length=20)),
                ('milestones', models.JSONField(blank=True, default=list)),
                ('is_active', models.BooleanField(default=True)),
                ('is_achieved', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='fitness_goals', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Fitness Goal',
                'verbose_name_plural': 'Fitness Goals',
                'ordering': ['-created_at'],
            },
        ),

        # RestDay
        migrations.CreateModel(
            name='RestDay',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('date', models.DateField()),
                ('reason', models.CharField(choices=[('scheduled', 'Scheduled Rest'), ('recovery', 'Recovery Needed'), ('injury', 'Injury'), ('illness', 'Illness'), ('busy', 'Too Busy'), ('travel', 'Traveling'), ('other', 'Other')], max_length=20)),
                ('other_reason', models.CharField(blank=True, max_length=200)),
                ('energy_level', models.PositiveSmallIntegerField(blank=True, null=True)),
                ('muscle_soreness', models.PositiveSmallIntegerField(blank=True, null=True)),
                ('notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='rest_days', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Rest Day',
                'verbose_name_plural': 'Rest Days',
                'ordering': ['-date'],
                'unique_together': {('user', 'date')},
            },
        ),

        # ExerciseStats
        migrations.CreateModel(
            name='ExerciseStats',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('total_workouts', models.PositiveIntegerField(default=0)),
                ('current_streak', models.PositiveIntegerField(default=0)),
                ('best_streak', models.PositiveIntegerField(default=0)),
                ('total_duration_minutes', models.PositiveIntegerField(default=0)),
                ('avg_duration_30d', models.PositiveIntegerField(blank=True, null=True)),
                ('avg_duration_90d', models.PositiveIntegerField(blank=True, null=True)),
                ('total_volume_kg', models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ('avg_volume_30d', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('total_calories_burned', models.PositiveIntegerField(default=0)),
                ('last_workout_date', models.DateField(blank=True, null=True)),
                ('exercise_counts', models.JSONField(blank=True, default=dict)),
                ('muscle_group_balance', models.JSONField(blank=True, default=dict)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='exercise_stats', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Exercise Stats',
                'verbose_name_plural': 'Exercise Stats',
            },
        ),

        # ProgressiveOverload
        migrations.CreateModel(
            name='ProgressiveOverload',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('baseline_weight_kg', models.DecimalField(blank=True, decimal_places=2, max_digits=6, null=True)),
                ('baseline_reps', models.PositiveIntegerField(blank=True, null=True)),
                ('baseline_date', models.DateField()),
                ('current_weight_kg', models.DecimalField(blank=True, decimal_places=2, max_digits=6, null=True)),
                ('current_reps', models.PositiveIntegerField(blank=True, null=True)),
                ('weight_increase_kg', models.DecimalField(decimal_places=2, default=0, max_digits=6)),
                ('rep_increase', models.PositiveIntegerField(default=0)),
                ('progress_percentage', models.DecimalField(decimal_places=2, default=0, max_digits=5)),
                ('is_on_track', models.BooleanField(default=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('exercise', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='progressive_overloads', to='health.exercise')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='progressive_overloads', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Progressive Overload',
                'verbose_name_plural': 'Progressive Overloads',
                'ordering': ['-updated_at'],
                'unique_together': {('user', 'exercise')},
            },
        ),
    ]

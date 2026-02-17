# Generated migration to populate muscle groups and equipment

from django.db import migrations


def create_muscle_groups(apps, schema_editor):
    MuscleGroup = apps.get_model('health', 'MuscleGroup')

    muscle_groups = [
        ('chest', 'Chest'),
        ('back', 'Back'),
        ('shoulders', 'Shoulders'),
        ('biceps', 'Biceps'),
        ('triceps', 'Triceps'),
        ('forearms', 'Forearms'),
        ('abs', 'Abs/Core'),
        ('quads', 'Quadriceps'),
        ('hamstrings', 'Hamstrings'),
        ('calves', 'Calves'),
        ('glutes', 'Glutes'),
        ('traps', 'Trapezius'),
        ('lats', 'Lats'),
    ]

    for name, display_name in muscle_groups:
        MuscleGroup.objects.create(name=name, display_name=display_name)


def create_equipment(apps, schema_editor):
    Equipment = apps.get_model('health', 'Equipment')

    equipment_list = [
        ('none', 'None (Bodyweight)', ''),
        ('dumbbells', 'Dumbbells', 'dumbbell'),
        ('barbell', 'Barbell', 'barbell'),
        ('kettlebell', 'Kettlebell', 'kettlebell'),
        ('cables', 'Cables/Machines', 'cable'),
        ('resistance_bands', 'Resistance Bands', 'band'),
        ('pull_up_bar', 'Pull-up Bar', 'pull-up'),
        ('bench', 'Bench', 'bench'),
        ('medicine_ball', 'Medicine Ball', 'ball'),
        ('stability_ball', 'Stability Ball', 'stability-ball'),
        ('foam_roller', 'Foam Roller', 'roller'),
        ('treadmill', 'Treadmill', 'treadmill'),
        ('bike', 'Exercise Bike', 'bike'),
        ('rowing_machine', 'Rowing Machine', 'rowing'),
        ('elliptical', 'Elliptical', 'elliptical'),
        ('other', 'Other', 'other'),
    ]

    for name, display_name, icon in equipment_list:
        Equipment.objects.create(name=name, display_name=display_name, icon=icon)


def reverse_muscle_groups(apps, schema_editor):
    MuscleGroup = apps.get_model('health', 'MuscleGroup')
    MuscleGroup.objects.all().delete()


def reverse_equipment(apps, schema_editor):
    Equipment = apps.get_model('health', 'Equipment')
    Equipment.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('health', '0004_exercise_tracking_enhancements'),
    ]

    operations = [
        migrations.RunPython(create_muscle_groups, reverse_muscle_groups),
        migrations.RunPython(create_equipment, reverse_equipment),
    ]

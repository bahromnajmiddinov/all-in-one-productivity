# Task Management enhancements: estimated/actual time, energy, recurrence, dependencies

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tasks', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='task',
            name='estimated_minutes',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='task',
            name='actual_minutes',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='task',
            name='energy_level',
            field=models.PositiveSmallIntegerField(
                blank=True,
                null=True,
                choices=[(1, 'Low'), (2, 'Medium-Low'), (3, 'Medium'), (4, 'Medium-High'), (5, 'High')],
            ),
        ),
        migrations.AddField(
            model_name='task',
            name='recurrence_rule',
            field=models.JSONField(blank=True, null=True),
        ),
        migrations.CreateModel(
            name='TaskDependency',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('depends_on_task', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='dependency_incoming', to='tasks.task')),
                ('task', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='dependency_outgoing', to='tasks.task')),
            ],
            options={
                'unique_together': {('task', 'depends_on_task')},
            },
        ),
        migrations.AddField(
            model_name='task',
            name='depends_on',
            field=models.ManyToManyField(
                blank=True,
                related_name='blocked_by',
                through='tasks.TaskDependency',
                to='tasks.task',
            ),
        ),
    ]

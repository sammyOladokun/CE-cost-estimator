from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("shared", "0001_initial"),
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="contractor",
            name="tenant",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="contractors",
                to="shared.tenant",
            ),
        ),
        migrations.AlterField(
            model_name="contractor",
            name="role",
            field=models.CharField(
                choices=[("owner", "Owner"), ("manager", "Manager"), ("estimator", "Estimator")],
                default="owner",
                max_length=20,
            ),
        ),
    ]

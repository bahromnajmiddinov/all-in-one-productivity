from rest_framework import serializers
from .models import (
    MoodScale, MoodEntry, MoodFactor, Emotion, MoodTrigger,
    MoodCorrelation, MoodInsight, MoodStats, MoodJournalLink
)


class MoodScaleSerializer(serializers.ModelSerializer):
    class Meta:
        model = MoodScale
        fields = [
            'id', 'name', 'scale_type', 'description',
            'min_value', 'max_value', 'scale_labels',
            'is_default', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class MoodFactorSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    
    class Meta:
        model = MoodFactor
        fields = [
            'id', 'category', 'category_display', 'name',
            'impact', 'rating', 'notes', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class EmotionSerializer(serializers.ModelSerializer):
    primary_emotion_display = serializers.CharField(source='get_primary_emotion_display', read_only=True)
    intensity_display = serializers.CharField(source='get_intensity_display', read_only=True)
    
    class Meta:
        model = Emotion
        fields = [
            'id', 'primary_emotion', 'primary_emotion_display',
            'specific_emotion', 'intensity', 'intensity_display',
            'is_dominant', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class MoodTriggerSerializer(serializers.ModelSerializer):
    trigger_type_display = serializers.CharField(source='get_trigger_type_display', read_only=True)
    
    class Meta:
        model = MoodTrigger
        fields = [
            'id', 'trigger_type', 'trigger_type_display',
            'description', 'is_positive',
            'related_habit', 'related_task', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class MoodEntryListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views"""
    mood_label = serializers.CharField(read_only=True)
    mood_emoji = serializers.CharField(read_only=True)
    time_of_day_display = serializers.CharField(source='get_time_of_day_display', read_only=True)
    factors_count = serializers.IntegerField(source='factors.count', read_only=True)
    emotions_count = serializers.IntegerField(source='emotions.count', read_only=True)
    has_journal_link = serializers.SerializerMethodField()
    
    class Meta:
        model = MoodEntry
        fields = [
            'id', 'mood_value', 'mood_label', 'mood_emoji',
            'time_of_day', 'time_of_day_display', 'entry_date', 'entry_time',
            'notes', 'weather', 'factors_count', 'emotions_count',
            'has_journal_link', 'created_at'
        ]
    
    def get_has_journal_link(self, obj):
        return hasattr(obj, 'journal_link')


class MoodEntryDetailSerializer(serializers.ModelSerializer):
    """Full serializer with nested relationships"""
    mood_label = serializers.CharField(read_only=True)
    mood_emoji = serializers.CharField(read_only=True)
    time_of_day_display = serializers.CharField(source='get_time_of_day_display', read_only=True)
    scale_detail = MoodScaleSerializer(source='scale', read_only=True)
    factors = MoodFactorSerializer(many=True, read_only=True)
    emotions = EmotionSerializer(many=True, read_only=True)
    triggers = MoodTriggerSerializer(many=True, read_only=True)
    journal_link_id = serializers.SerializerMethodField()
    
    class Meta:
        model = MoodEntry
        fields = [
            'id', 'scale', 'scale_detail', 'mood_value', 'mood_label', 'mood_emoji',
            'time_of_day', 'time_of_day_display', 'entry_date', 'entry_time',
            'notes', 'weather', 'location', 'factors', 'emotions', 'triggers',
            'journal_link_id', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_journal_link_id(self, obj):
        if hasattr(obj, 'journal_link'):
            return str(obj.journal_link.id)
        return None


class MoodEntryCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating mood entries with nested data"""
    factors = MoodFactorSerializer(many=True, required=False)
    emotions = EmotionSerializer(many=True, required=False)
    triggers = MoodTriggerSerializer(many=True, required=False)
    
    class Meta:
        model = MoodEntry
        fields = [
            'id', 'scale', 'mood_value', 'time_of_day',
            'entry_date', 'entry_time', 'notes', 'weather', 'location',
            'factors', 'emotions', 'triggers'
        ]
        read_only_fields = ['id']
    
    def create(self, validated_data):
        factors_data = validated_data.pop('factors', [])
        emotions_data = validated_data.pop('emotions', [])
        triggers_data = validated_data.pop('triggers', [])
        
        # Set default scale if not provided
        if not validated_data.get('scale'):
            user = self.context['request'].user
            default_scale = user.mood_scales.filter(is_default=True, is_active=True).first()
            if not default_scale:
                default_scale = user.mood_scales.filter(is_active=True).first()
            validated_data['scale'] = default_scale
        
        entry = MoodEntry.objects.create(**validated_data)
        
        # Create nested objects
        for factor_data in factors_data:
            MoodFactor.objects.create(mood_entry=entry, **factor_data)
        
        for emotion_data in emotions_data:
            Emotion.objects.create(mood_entry=entry, **emotion_data)
        
        for trigger_data in triggers_data:
            MoodTrigger.objects.create(mood_entry=entry, **trigger_data)
        
        return entry
    
    def update(self, instance, validated_data):
        factors_data = validated_data.pop('factors', None)
        emotions_data = validated_data.pop('emotions', None)
        triggers_data = validated_data.pop('triggers', None)
        
        # Update main fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update nested objects if provided
        if factors_data is not None:
            instance.factors.all().delete()
            for factor_data in factors_data:
                MoodFactor.objects.create(mood_entry=instance, **factor_data)
        
        if emotions_data is not None:
            instance.emotions.all().delete()
            for emotion_data in emotions_data:
                Emotion.objects.create(mood_entry=instance, **emotion_data)
        
        if triggers_data is not None:
            instance.triggers.all().delete()
            for trigger_data in triggers_data:
                MoodTrigger.objects.create(mood_entry=instance, **trigger_data)
        
        return instance


class MoodCorrelationSerializer(serializers.ModelSerializer):
    correlation_type_display = serializers.CharField(source='get_correlation_type_display', read_only=True)
    strength_display = serializers.CharField(source='get_strength_display', read_only=True)
    
    class Meta:
        model = MoodCorrelation
        fields = [
            'id', 'correlation_type', 'correlation_type_display',
            'coefficient', 'strength', 'strength_display',
            'start_date', 'end_date', 'data_points',
            'insights', 'computed_at'
        ]
        read_only_fields = ['id', 'computed_at']


class MoodInsightSerializer(serializers.ModelSerializer):
    insight_type_display = serializers.CharField(source='get_insight_type_display', read_only=True)
    
    class Meta:
        model = MoodInsight
        fields = [
            'id', 'insight_type', 'insight_type_display',
            'title', 'description', 'related_entry',
            'confidence', 'action_items',
            'is_dismissed', 'is_read', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class MoodStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = MoodStats
        fields = [
            'id', 'total_entries', 'current_streak', 'best_streak',
            'avg_mood_7d', 'avg_mood_30d', 'avg_mood_90d',
            'mood_distribution', 'time_of_day_averages',
            'day_of_week_averages', 'best_mood_date', 'worst_mood_date',
            'top_emotions', 'top_positive_factors', 'top_negative_factors',
            'updated_at'
        ]
        read_only_fields = ['id', 'updated_at']


class MoodJournalLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = MoodJournalLink
        fields = ['id', 'mood_entry', 'journal_entry', 'key_themes', 'sentiment_score', 'created_at']
        read_only_fields = ['id', 'created_at']


# Analytics Serializers
class MoodTimelineSerializer(serializers.Serializer):
    """Serializer for mood timeline data"""
    date = serializers.DateField()
    mood_value = serializers.FloatField()
    rolling_avg_7d = serializers.FloatField(required=False)
    rolling_avg_30d = serializers.FloatField(required=False)
    entry_count = serializers.IntegerField()


class MoodHeatmapSerializer(serializers.Serializer):
    """Serializer for mood heatmap data"""
    date = serializers.DateField()
    mood_value = serializers.FloatField()
    color = serializers.CharField(required=False)


class MoodPatternSerializer(serializers.Serializer):
    """Serializer for pattern analysis"""
    pattern_type = serializers.CharField()  # 'weekly', 'monthly', 'seasonal'
    pattern_data = serializers.DictField()
    insight = serializers.CharField()


class MoodComparisonSerializer(serializers.Serializer):
    """Serializer for Mood vs X comparisons"""
    metric_name = serializers.CharField()
    metric_data = serializers.ListField(child=serializers.DictField())
    correlation = serializers.FloatField(required=False)
    mood_data = serializers.ListField(child=serializers.DictField())


class QuickMoodSerializer(serializers.ModelSerializer):
    """Minimal serializer for quick mood logging"""
    class Meta:
        model = MoodEntry
        fields = ['id', 'mood_value', 'time_of_day', 'entry_date', 'entry_time', 'notes', 'created_at']
        read_only_fields = ['id', 'created_at']


class EmotionWheelSerializer(serializers.Serializer):
    """Serializer for emotion wheel data"""
    primary_emotion = serializers.CharField()
    label = serializers.CharField()
    color = serializers.CharField()
    related_emotions = serializers.ListField(child=serializers.CharField())

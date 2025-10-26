import random

# Simple in-memory tracker (no database needed for hackathon)
user_stats = {}

def update_mood_xp(user_id, emotion):
    """
    Updates mood XP and tracks most frequent emotion for gamification.
    """
    if user_id not in user_stats:
        user_stats[user_id] = {"xp": 0, "emotion_counts": {}, "level": 1}

    user = user_stats[user_id]
    user["xp"] += random.randint(5, 15)  # Random XP gain

    # Count emotion occurrences
    if emotion not in user["emotion_counts"]:
        user["emotion_counts"][emotion] = 1
    else:
        user["emotion_counts"][emotion] += 1

    # Level up every 100 XP
    if user["xp"] >= user["level"] * 100:
        user["level"] += 1

    # Find dominant emotion
    dominant_emotion = max(user["emotion_counts"], key=user["emotion_counts"].get)

    return {
        "user_id": user_id,
        "xp": user["xp"],
        "level": user["level"],
        "dominant_emotion": dominant_emotion,
    }

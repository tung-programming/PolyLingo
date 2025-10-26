from app.nlp.emotion_analyzer import analyze_emotion
from app.nlp.mood_tracker import update_mood_xp

print("\n🧠 PolyLingo Emotion Analyzer — Interactive Mode 🗣️")
print("Type a message and hit Enter. Type 'exit' to quit.\n")

user_id = input("Enter your user ID: ")

while True:
    text = input("\nYou: ")
    if text.lower() == "exit":
        print("\n👋 Session ended. Goodbye!")
        break

    emotion_data = analyze_emotion(text)
    updated_stats = update_mood_xp(user_id, emotion_data["emotion"])

    print(f"🤖 Detected Emotion: {emotion_data['emotion']} ({emotion_data['confidence']})")
    print(f"⭐ XP: {updated_stats['xp']} | Level: {updated_stats['level']} | Mood: {updated_stats['dominant_emotion']}")

def classify_emotion(emotion: str):
    """
    Classifies a detailed emotion into a broader category.
    """
    positive_emotions = ["joy", "love", "surprise"]
    negative_emotions = ["sadness", "anger", "fear", "disgust"]
    
    if emotion in positive_emotions:
        return "positive"
    elif emotion in negative_emotions:
        return "negative"
    else:
        return "neutral"

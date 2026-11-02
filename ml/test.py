from tensorflow.keras.models import load_model


model=load_model('model3.keras')

def predict_image(image):
    image = image.resize((128, 128))
    image = image.convert('RGB')
    import numpy as np
    image_array = np.array(image) / 255.0
    image_array = np.expand_dims(image_array, axis=0)
    predictions = model.predict(image_array)
    predicted_class = np.argmax(predictions, axis=1)[0]
    class_names = []
    return class_names[predicted_class]
import json
import os
from pathlib import Path

import mlflow
import pandas as pd
import tensorflow as tf
from sklearn.metrics import f1_score
from sklearn.model_selection import train_test_split
from tensorflow.keras import Sequential
from tensorflow.keras.layers import Conv2D, Dense, Dropout, Flatten, Input, MaxPooling2D
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.preprocessing.image import ImageDataGenerator


PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "ml" / "data"
DEFAULT_TRACKING_URI = f"sqlite:///{(PROJECT_ROOT / 'mlflow.db').as_posix()}"
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".ppm", ".tif", ".tiff"}
EPOCHS_TO_RUN = (10, 12)
BATCH_SIZE = 32
IMAGE_SIZE = (128, 128)
RANDOM_SEED = 42


def build_model(num_classes):
    model = Sequential(
        [
            Input(shape=(*IMAGE_SIZE, 3)),
            Conv2D(32, (3, 3), activation="relu"),
            MaxPooling2D(),
            Dropout(0.25),
            Conv2D(64, (3, 3), activation="relu"),
            MaxPooling2D(),
            Dropout(0.25),
            Flatten(),
            Dense(128, activation="relu"),
            Dropout(0.4),
            Dense(num_classes, activation="softmax"),
        ]
    )
    model.compile(
        optimizer=Adam(0.001),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def load_dataset_frame():
    if not DATA_DIR.is_dir():
        raise FileNotFoundError(f"Dataset directory not found: {DATA_DIR}")

    rows = [
        {"image_path": str(image_path), "item_type": class_dir.name}
        for class_dir in sorted(DATA_DIR.iterdir())
        if class_dir.is_dir()
        for image_path in sorted(class_dir.rglob("*"))
        if image_path.is_file() and image_path.suffix.lower() in IMAGE_EXTENSIONS
    ]
    if not rows:
        raise ValueError(f"No supported images found in {DATA_DIR}")

    dataset = pd.DataFrame(rows)
    class_counts = dataset["item_type"].value_counts()
    if len(class_counts) < 2 or (class_counts < 2).any():
        raise ValueError("Each class needs at least two images for a stratified split.")
    return dataset


def create_data_generators(train_df, validation_df):
    train_generator = ImageDataGenerator(rescale=1.0 / 255).flow_from_dataframe(
        train_df,
        x_col="image_path",
        y_col="item_type",
        target_size=IMAGE_SIZE,
        batch_size=BATCH_SIZE,
        class_mode="categorical",
        seed=RANDOM_SEED,
    )
    validation_generator = ImageDataGenerator(
        rescale=1.0 / 255
    ).flow_from_dataframe(
        validation_df,
        x_col="image_path",
        y_col="item_type",
        target_size=IMAGE_SIZE,
        batch_size=BATCH_SIZE,
        class_mode="categorical",
        shuffle=False,
    )
    if train_generator.class_indices != validation_generator.class_indices:
        raise ValueError("Training and validation class mappings do not match.")
    return train_generator, validation_generator


def train_experiment(train_df, validation_df, epochs):
    tf.keras.backend.clear_session()
    tf.keras.utils.set_random_seed(RANDOM_SEED)
    train_generator, validation_generator = create_data_generators(
        train_df, validation_df
    )
    model = build_model(len(train_generator.class_indices))
    run_name = f"SimpleCNN_{epochs}_Epochs"

    with mlflow.start_run(run_name=run_name) as run:
        mlflow.log_params(
            {
                "model_architecture": "SimpleCNN",
                "input_size": "128x128x3",
                "num_classes": len(train_generator.class_indices),
                "class_indices": json.dumps(
                    train_generator.class_indices, sort_keys=True
                ),
                "epochs": epochs,
                "batch_size": BATCH_SIZE,
                "learning_rate": 0.001,
                "optimizer": "Adam",
                "dataset": "ml/data",
                "train_images": train_generator.samples,
                "validation_images": validation_generator.samples,
                "random_seed": RANDOM_SEED,
            }
        )

        history = model.fit(
            train_generator,
            epochs=epochs,
            validation_data=validation_generator,
            verbose=1,
        )

        for step, values in enumerate(zip(
            history.history["accuracy"],
            history.history["loss"],
            history.history["val_accuracy"],
            history.history["val_loss"],
        ), start=1):
            train_accuracy, train_loss, val_accuracy, val_loss = values
            mlflow.log_metrics(
                {
                    "train_accuracy": float(train_accuracy),
                    "train_loss": float(train_loss),
                    "val_accuracy": float(val_accuracy),
                    "val_loss": float(val_loss),
                },
                step=step,
            )

        val_loss, val_accuracy = model.evaluate(validation_generator, verbose=0)
        probabilities = model.predict(validation_generator, verbose=0)
        predictions = probabilities.argmax(axis=1)
        f1_macro = f1_score(
            validation_generator.classes,
            predictions,
            average="macro",
            zero_division=0,
        )
        mlflow.log_metrics(
            {
                "final_val_loss": float(val_loss),
                "final_val_accuracy": float(val_accuracy),
                "f1_macro": float(f1_macro),
            }
        )
        mlflow.keras.log_model(model, artifact_path="model")

    print(
        f"[MLflow] {run_name}: run_id={run.info.run_id}, "
        f"val_accuracy={val_accuracy:.4f}, f1_macro={f1_macro:.4f}"
    )


def main():
    mlflow.set_tracking_uri(
        os.getenv("MLFLOW_TRACKING_URI", DEFAULT_TRACKING_URI)
    )
    mlflow.set_experiment("FoodLens_SimpleCNN_Experiments")

    dataset = load_dataset_frame()
    print(
        f"Loaded {len(dataset)} images across "
        f"{dataset['item_type'].nunique()} classes from {DATA_DIR}"
    )
    train_df, validation_df = train_test_split(
        dataset,
        test_size=0.2,
        stratify=dataset["item_type"],
        random_state=RANDOM_SEED,
    )

    for epochs in EPOCHS_TO_RUN:
        train_experiment(train_df, validation_df, epochs)


if __name__ == "__main__":
    main()

"""
Model Definition Module for MelodyMind
Defines Keras/TensorFlow LSTM architecture for sequential musical token prediction.
Also provides parameter calculation and architecture inspection without requiring GPU.
"""

import io
import json
import logging
from typing import Dict, Any, Optional

try:
    import tensorflow as tf
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import LSTM, Dense, Dropout, Activation, Input
    from tensorflow.keras.optimizers import Adam, RMSprop
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False

from .config import (
    DEFAULT_LSTM_LAYERS,
    DEFAULT_LSTM_UNITS,
    DEFAULT_DROPOUT,
    DEFAULT_DENSE_UNITS,
    DEFAULT_OPTIMIZER,
    DEFAULT_LEARNING_RATE
)

logger = logging.getLogger("melodymind.model")

# In-memory built model cache
current_model_metadata = {
    "architecture": "LSTM",
    "layers": [],
    "total_params": 0,
    "trainable_params": 0,
    "summary_text": "",
    "hyperparameters": {}
}


def build_lstm_model(
    sequence_length: int,
    vocab_size: int,
    params: Optional[Dict[str, Any]] = None
):
    """
    Construct the sequential LSTM deep neural network:
    Input shape: (sequence_length, 1) or (sequence_length, vocab_size)
    Stacked LSTM layers -> Dropout -> Dense -> Dropout -> Output Softmax (vocab_size)
    """
    if params is None:
        params = {}

    num_layers = int(params.get("lstm_layers", DEFAULT_LSTM_LAYERS))
    units = int(params.get("units", DEFAULT_LSTM_UNITS))
    dropout = float(params.get("dropout", DEFAULT_DROPOUT))
    dense_units = int(params.get("dense_units", DEFAULT_DENSE_UNITS))
    optimizer_name = str(params.get("optimizer", DEFAULT_OPTIMIZER)).lower()
    lr = float(params.get("learning_rate", DEFAULT_LEARNING_RATE))

    # Calculate analytical layers and parameters
    layer_specs = []
    total_params = 0

    # Input layer representation
    layer_specs.append({
        "name": "input_sequence",
        "type": "InputLayer",
        "output_shape": [None, sequence_length, 1],
        "params": 0
    })

    # LSTM Layers
    input_dim = 1
    for layer_idx in range(num_layers):
        return_seq = (layer_idx < num_layers - 1)
        # Keras LSTM param formula: 4 * ((input_dim + units) * units + units)
        lstm_params = 4 * ((input_dim + units) * units + units)
        total_params += lstm_params

        out_shape = [None, sequence_length, units] if return_seq else [None, units]
        layer_specs.append({
            "name": f"lstm_{layer_idx + 1}",
            "type": "LSTM",
            "units": units,
            "return_sequences": return_seq,
            "output_shape": out_shape,
            "params": lstm_params
        })

        if dropout > 0:
            layer_specs.append({
                "name": f"dropout_{layer_idx + 1}",
                "type": "Dropout",
                "rate": dropout,
                "output_shape": out_shape,
                "params": 0
            })
        input_dim = units

    # Intermediate Dense layer
    dense_params = (units * dense_units) + dense_units
    total_params += dense_params
    layer_specs.append({
        "name": "dense_features",
        "type": "Dense",
        "units": dense_units,
        "activation": "relu",
        "output_shape": [None, dense_units],
        "params": dense_params
    })

    # Dense Dropout
    if dropout > 0:
        layer_specs.append({
            "name": "dropout_dense",
            "type": "Dropout",
            "rate": dropout,
            "output_shape": [None, dense_units],
            "params": 0
        })

    # Final Classification Softmax Layer
    output_params = (dense_units * vocab_size) + vocab_size
    total_params += output_params
    layer_specs.append({
        "name": "output_softmax",
        "type": "Dense (Softmax)",
        "units": vocab_size,
        "activation": "softmax",
        "output_shape": [None, vocab_size],
        "params": output_params
    })

    summary_lines = [
        "Model: \"melody_mind_lstm\"",
        "_________________________________________________________________",
        f"{'Layer (type)':<28} {'Output Shape':<24} {'Param #':<10}",
        "================================================================="
    ]
    for l in layer_specs:
        shape_str = str(tuple(l["output_shape"]))
        summary_lines.append(f"{l['name'] + ' (' + l['type'] + ')':<28} {shape_str:<24} {l['params']:<10,}")
    summary_lines.extend([
        "=================================================================",
        f"Total params: {total_params:,} ({round(total_params * 4 / (1024*1024), 2)} MB)",
        f"Trainable params: {total_params:,}",
        "Non-trainable params: 0",
        "_________________________________________________________________"
    ])
    summary_text = "\n".join(summary_lines)

    # Actual TensorFlow Model if installed
    tf_model = None
    if TF_AVAILABLE:
        try:
            model = Sequential()
            for i in range(num_layers):
                return_seq = (i < num_layers - 1)
                if i == 0:
                    model.add(LSTM(units, input_shape=(sequence_length, 1), return_sequences=return_seq))
                else:
                    model.add(LSTM(units, return_sequences=return_seq))
                if dropout > 0:
                    model.add(Dropout(dropout))

            model.add(Dense(dense_units, activation="relu"))
            if dropout > 0:
                model.add(Dropout(dropout))
            model.add(Dense(vocab_size, activation="softmax"))

            opt = Adam(learning_rate=lr) if optimizer_name == "adam" else RMSprop(learning_rate=lr)
            model.compile(loss="categorical_crossentropy", optimizer=opt, metrics=["accuracy"])
            tf_model = model

            # Capture Keras summary
            stream = io.StringIO()
            model.summary(print_fn=lambda x: stream.write(x + "\n"))
            summary_text = stream.getvalue()
        except Exception as e:
            logger.warning(f"Could not build full TF model in current environment: {e}")

    metadata = {
        "architecture": "LSTM",
        "layers": layer_specs,
        "total_params": total_params,
        "trainable_params": total_params,
        "summary_text": summary_text,
        "hyperparameters": {
            "lstm_layers": num_layers,
            "units": units,
            "dropout": dropout,
            "dense_units": dense_units,
            "optimizer": optimizer_name,
            "learning_rate": lr,
            "sequence_length": sequence_length,
            "vocab_size": vocab_size
        }
    }

    current_model_metadata.clear()
    current_model_metadata.update(metadata)
    return tf_model, metadata


def get_current_model_metadata() -> Dict[str, Any]:
    """Return model structure and summary for frontend display."""
    if not current_model_metadata.get("layers"):
        # Default mock specs if user hasn't explicitly clicked build
        _, meta = build_lstm_model(100, 64)
        return meta
    return current_model_metadata

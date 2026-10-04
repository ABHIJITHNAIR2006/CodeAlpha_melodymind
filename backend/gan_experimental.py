"""
Experimental GAN (Generative Adversarial Network) Architecture for Music Generation
[EXPERIMENTAL / OPTIONAL ARCHITECTURE]
Demonstrates a 1D Convolutional / Recurrent WGAN-GP setup for musical token sequences.
"""

import logging
from typing import Dict, Any, Tuple

try:
    import tensorflow as tf
    from tensorflow.keras.models import Model
    from tensorflow.keras.layers import (
        Input, Dense, Reshape, Conv1D, UpSampling1D,
        LeakyReLU, BatchNormalization, Flatten, Bidirectional, LSTM
    )
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False

logger = logging.getLogger("melodymind.gan")


def build_music_generator(latent_dim: int = 128, seq_len: int = 100, vocab_size: int = 64):
    """
    Generator network: maps random latent noise vector z ~ N(0, I)
    to a sequence of token probability distributions (seq_len, vocab_size).
    """
    if not TF_AVAILABLE:
        return None, {
            "name": "Experimental Music Generator (GAN)",
            "status": "TensorFlow not installed in current environment",
            "latent_dim": latent_dim,
            "output_shape": [None, seq_len, vocab_size]
        }

    inputs = Input(shape=(latent_dim,))
    x = Dense(25 * 128)(inputs)
    x = LeakyReLU(0.2)(x)
    x = Reshape((25, 128))(x)

    # Upsample to seq_len
    x = UpSampling1D(size=2)(x)  # 50
    x = Conv1D(128, kernel_size=5, padding="same")(x)
    x = BatchNormalization()(x)
    x = LeakyReLU(0.2)(x)

    x = UpSampling1D(size=2)(x)  # 100
    x = Conv1D(64, kernel_size=5, padding="same")(x)
    x = BatchNormalization()(x)
    x = LeakyReLU(0.2)(x)

    # Output probabilities via Softmax over vocab
    outputs = Conv1D(vocab_size, kernel_size=3, padding="same", activation="softmax")(x)

    model = Model(inputs, outputs, name="MelodyMind_GAN_Generator")
    return model, {
        "name": "GAN Generator",
        "params": model.count_params(),
        "input_shape": [None, latent_dim],
        "output_shape": [None, seq_len, vocab_size]
    }


def build_music_discriminator(seq_len: int = 100, vocab_size: int = 64):
    """
    Discriminator (Critic) network: evaluates whether a musical sequence
    is genuine dataset composition or synthetic generator artifact.
    """
    if not TF_AVAILABLE:
        return None, {
            "name": "Experimental Music Discriminator (GAN)",
            "status": "TensorFlow not installed in current environment",
            "input_shape": [None, seq_len, vocab_size],
            "output": "Scalar Realness Score (Wasserstein distance)"
        }

    inputs = Input(shape=(seq_len, vocab_size))
    x = Conv1D(64, kernel_size=5, strides=2, padding="same")(inputs)  # 50
    x = LeakyReLU(0.2)(x)

    x = Conv1D(128, kernel_size=5, strides=2, padding="same")(x)  # 25
    x = LeakyReLU(0.2)(x)

    x = Bidirectional(LSTM(64, return_sequences=False))(x)
    x = Dense(64)(x)
    x = LeakyReLU(0.2)(x)
    outputs = Dense(1)(x)  # Linear critic score for WGAN

    model = Model(inputs, outputs, name="MelodyMind_GAN_Discriminator")
    return model, {
        "name": "GAN Discriminator",
        "params": model.count_params(),
        "input_shape": [None, seq_len, vocab_size],
        "output_shape": [None, 1]
    }


def get_gan_overview() -> Dict[str, Any]:
    """Returns overview documentation for educational demo and comparison."""
    return {
        "architecture": "WGAN-GP (Wasserstein GAN with Gradient Penalty)",
        "status": "Experimental / Research Prototype",
        "description": "While LSTMs excel at sequential token prediction with conditional dependencies, GANs learn the global structural distribution of polyphonic music in parallel.",
        "pros": [
            "Parallel sequence generation (O(1) inference vs O(N) autoregressive)",
            "Can capture polyphonic and multi-instrument textures effectively",
            "Learns continuous musical latent spaces suitable for interpolation"
        ],
        "challenges": [
            "Mode collapse: model outputs repetitive identical riffs",
            "Non-differentiable discrete token sampling (requires Gumbel-Softmax or WGAN-GP)",
            "Significantly longer training times compared to Cross-Entropy LSTMs"
        ],
        "recommendation": "Use LSTM for primary music composition and coherent melodies; explore GAN for rhythmic and ambient soundscapes."
    }

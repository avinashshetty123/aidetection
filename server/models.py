#!/usr/bin/env python3
"""
TRUVOICE AI Models
Contains model definitions for deepfake detection
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
import os
from pathlib import Path

# Define MesoNet model architecture
class Meso4(nn.Module):
    """
    Implementation of Meso4 model from the paper:
    MesoNet: a Compact Facial Video Forgery Detection Network
    """
    def __init__(self, num_classes=1):
        super(Meso4, self).__init__()
        self.num_classes = num_classes
        
        # Convolutional layers
        self.conv1 = nn.Conv2d(3, 8, 3, padding=1, bias=False)
        self.bn1 = nn.BatchNorm2d(8)
        self.conv2 = nn.Conv2d(8, 8, 5, padding=2, bias=False)
        self.bn2 = nn.BatchNorm2d(8)
        self.conv3 = nn.Conv2d(8, 16, 5, padding=2, bias=False)
        self.bn3 = nn.BatchNorm2d(16)
        self.conv4 = nn.Conv2d(16, 16, 5, padding=2, bias=False)
        self.bn4 = nn.BatchNorm2d(16)
        
        # Fully connected layers
        self.fc1 = nn.Linear(16 * 8 * 8, 16)
        self.fc2 = nn.Linear(16, num_classes)
        
    def forward(self, x):
        # Block 1
        x = F.relu(self.bn1(self.conv1(x)))
        x = F.max_pool2d(x, 2)
        
        # Block 2
        x = F.relu(self.bn2(self.conv2(x)))
        x = F.max_pool2d(x, 2)
        
        # Block 3
        x = F.relu(self.bn3(self.conv3(x)))
        x = F.max_pool2d(x, 2)
        
        # Block 4
        x = F.relu(self.bn4(self.conv4(x)))
        x = F.max_pool2d(x, 4)
        
        # Flatten
        x = x.view(x.size(0), -1)
        
        # FC layers
        x = F.dropout(x, 0.5)
        x = F.relu(self.fc1(x))
        x = F.dropout(x, 0.5)
        x = self.fc2(x)
        
        return torch.sigmoid(x)

# Simple audio classification model
class AudioClassifier(nn.Module):
    """
    Simple CNN for audio deepfake detection using mel spectrograms
    """
    def __init__(self, num_classes=1):
        super(AudioClassifier, self).__init__()
        
        # Convolutional layers
        self.conv1 = nn.Conv2d(1, 16, kernel_size=3, stride=1, padding=1)
        self.bn1 = nn.BatchNorm2d(16)
        self.conv2 = nn.Conv2d(16, 32, kernel_size=3, stride=1, padding=1)
        self.bn2 = nn.BatchNorm2d(32)
        self.conv3 = nn.Conv2d(32, 64, kernel_size=3, stride=1, padding=1)
        self.bn3 = nn.BatchNorm2d(64)
        
        # Fully connected layers
        self.fc1 = nn.Linear(64 * 16 * 20, 64)
        self.fc2 = nn.Linear(64, num_classes)
        
    def forward(self, x):
        # Block 1
        x = F.relu(self.bn1(self.conv1(x)))
        x = F.max_pool2d(x, 2)
        
        # Block 2
        x = F.relu(self.bn2(self.conv2(x)))
        x = F.max_pool2d(x, 2)
        
        # Block 3
        x = F.relu(self.bn3(self.conv3(x)))
        x = F.max_pool2d(x, 2)
        
        # Flatten
        x = x.view(x.size(0), -1)
        
        # FC layers
        x = F.dropout(x, 0.5)
        x = F.relu(self.fc1(x))
        x = F.dropout(x, 0.5)
        x = self.fc2(x)
        
        return torch.sigmoid(x)

# Function to download pretrained models if they don't exist
def download_models(models_dir):
    """
    Download pretrained models if they don't exist
    """
    os.makedirs(models_dir, exist_ok=True)
    
    # URLs for pretrained models
    model_urls = {
        'meso4.pth': 'https://github.com/DariusAf/MesoNet/raw/master/weights/Meso4_DF.h5',
        'audio_model.pth': 'https://huggingface.co/datasets/deepfake-audio/ASVspoof2019/resolve/main/model.pth'
    }
    
    # Check if models exist, if not download them
    for model_name, url in model_urls.items():
        model_path = os.path.join(models_dir, model_name)
        if not os.path.exists(model_path):
            try:
                import requests
                print(f"Downloading {model_name}...")
                response = requests.get(url)
                with open(model_path, 'wb') as f:
                    f.write(response.content)
                print(f"Downloaded {model_name}")
            except Exception as e:
                print(f"Failed to download {model_name}: {e}")
                # Create dummy model file to prevent repeated download attempts
                torch.save({'state_dict': {}}, model_path)
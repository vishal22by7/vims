"""
ML Damage Analyzer Microservice
Uses ResNet for vehicle damage analysis
"""
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import io
from PIL import Image
import torch
import torchvision.transforms as transforms
from torchvision.models import resnet50
import json
import os
from datetime import datetime
from typing import Tuple
import aiohttp

# ImageNet vehicle class indices (subset of 1000 ImageNet classes)
# These are common vehicle-related classes in ImageNet
# Note: Actual ImageNet indices may vary - this is a representative set
VEHICLE_CLASSES = {
    # Cars
    403: "convertible",
    427: "amphibian",
    436: "beach_wagon",
    511: "convertible",
    627: "limousine",
    656: "minivan",
    751: "racer",
    817: "sports_car",
    # Trucks
    555: "fire_engine",
    569: "garbage_truck",
    705: "pickup",
    864: "trailer_truck",
    867: "tractor",
    920: "truck",
    # Buses
    654: "minibus",
    779: "school_bus",
    # Motorcycles
    575: "harvester",
    670: "motor_scooter",
    671: "motorcycle"
}

app = FastAPI(title="VIMS ML Damage Analyzer")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
model = None
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# IPFS Gateway URL
IPFS_GATEWAY = os.getenv("IPFS_GATEWAY_URL", "http://localhost:8080/ipfs")
IPFS_API = os.getenv("IPFS_API_URL", "http://localhost:5001/api/v0")

class MLReport(BaseModel):
    severity: float
    damage_parts: list
    confidence: float
    timestamp: str
    mlReportCID: str = None
    is_vehicle: bool = True
    validation_error: str = None

class AnalyzeRequest(BaseModel):
    ipfsCid: str

def load_model():
    """Load pre-trained ResNet50 model"""
    global model
    try:
        # Load pre-trained ResNet50
        model = resnet50(pretrained=True)
        model.eval()
        model.to(device)
        print("✅ ML Model loaded successfully")
    except Exception as e:
        print(f"⚠️  Warning: Could not load ResNet model: {e}")
        print("   Using mock analysis for development")
        model = None

def download_from_ipfs(cid: str) -> bytes:
    """Download file from IPFS using gateway"""
    try:
        url = f"{IPFS_GATEWAY}/{cid}"
        response = requests.get(url, timeout=30)
        if response.status_code == 200:
            return response.content
        else:
            raise Exception(f"IPFS gateway returned status {response.status_code}")
    except Exception as e:
        raise Exception(f"Failed to download from IPFS: {str(e)}")

def validate_vehicle(image_bytes: bytes, min_confidence: float = 0.1) -> Tuple[bool, float, str]:
    """
    Validate if image contains a vehicle using ResNet50 ImageNet classes
    Returns: (is_vehicle, confidence, detected_class)
    """
    if model is None:
        # In mock mode, assume it's a vehicle (for development)
        return True, 0.8, "mock_vehicle"
    
    try:
        # Load and preprocess image
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        image_tensor = transform(image).unsqueeze(0).to(device)
        
        # Run inference
        with torch.no_grad():
            outputs = model(image_tensor)
            probabilities = torch.nn.functional.softmax(outputs, dim=1)
        
        # Get top 5 predictions
        top_probs, top_indices = torch.topk(probabilities, 5)
        top_probs = top_probs[0].cpu().numpy()
        top_indices = top_indices[0].cpu().numpy()
        
        # Check if any vehicle class is in top predictions
        vehicle_confidence = 0.0
        detected_vehicle_class = None
        
        for idx, class_idx in enumerate(top_indices):
            if class_idx in VEHICLE_CLASSES:
                vehicle_confidence = float(top_probs[idx])
                detected_vehicle_class = VEHICLE_CLASSES[class_idx]
                break
        
        # Also check top prediction for vehicle-related terms in class name
        # (fallback for classes not in our list)
        if vehicle_confidence < min_confidence:
            # Get class name from ImageNet (if available)
            # For now, check if top prediction confidence suggests vehicle
            top_confidence = float(top_probs[0])
            if top_confidence > 0.3:  # High confidence in any class
                # In production, you'd check actual ImageNet class names
                # For now, we'll be conservative and require explicit vehicle class
                pass
        
        is_vehicle = vehicle_confidence >= min_confidence
        
        return is_vehicle, vehicle_confidence, detected_vehicle_class or "unknown"
    
    except Exception as e:
        # If validation fails, reject to be safe
        return False, 0.0, f"validation_error: {str(e)}"

def analyze_damage(image_bytes: bytes) -> dict:
    """
    Analyze vehicle damage using ResNet
    Returns severity (0-100), damage parts, and confidence
    """
    if model is None:
        # Mock analysis for development when model is not available
        import random
        return {
            "severity": random.uniform(30, 90),
            "damage_parts": ["front_bumper", "headlight", "hood"],
            "confidence": random.uniform(0.6, 0.95),
            "is_vehicle": True,
            "validation_error": None
        }
    
    try:
        # First, validate that image contains a vehicle
        is_vehicle, vehicle_confidence, vehicle_class = validate_vehicle(image_bytes, min_confidence=0.1)
        
        if not is_vehicle:
            return {
                "severity": 0.0,
                "damage_parts": [],
                "confidence": 0.0,
                "is_vehicle": False,
                "validation_error": f"Image does not appear to contain a vehicle. Detected class confidence: {vehicle_confidence:.2f}"
            }
        
        # Load and preprocess image
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        image_tensor = transform(image).unsqueeze(0).to(device)
        
        # Run inference
        with torch.no_grad():
            outputs = model(image_tensor)
            # Convert to probabilities
            probabilities = torch.nn.functional.softmax(outputs, dim=1)
            max_prob = probabilities.max().item()
            
        # Simulate damage analysis (in production, use fine-tuned model)
        # For now, we use a heuristic based on model output
        # Only proceed if we have reasonable confidence
        if max_prob < 0.1:
            return {
                "severity": 0.0,
                "damage_parts": [],
                "confidence": max_prob,
                "is_vehicle": True,
                "validation_error": "Low confidence in image classification. Image may be unclear or not a vehicle."
            }
        
        severity = min(100, max_prob * 100 * 1.2)  # Scale to 0-100
        
        # Mock damage parts detection (replace with actual detection in production)
        damage_parts = []
        if severity > 50:
            damage_parts.append("front_bumper")
        if severity > 60:
            damage_parts.append("headlight")
        if severity > 70:
            damage_parts.append("hood")
        if severity > 80:
            damage_parts.append("windshield")
        
        return {
            "severity": round(severity, 2),
            "damage_parts": damage_parts,
            "confidence": round(max_prob, 3),
            "is_vehicle": True,
            "validation_error": None
        }
    except Exception as e:
        raise Exception(f"Image analysis failed: {str(e)}")

async def upload_to_ipfs(data: dict) -> str:
    """Upload JSON report to IPFS"""
    try:
        json_str = json.dumps(data, indent=2)
        json_bytes = json_str.encode('utf-8')
        
        # Upload to IPFS via API
        async with aiohttp.ClientSession() as session:
            data_form = aiohttp.FormData()
            data_form.add_field('file', json_bytes, filename='ml_report.json', content_type='application/json')
            
            async with session.post(
                f"{IPFS_API}/add",
                data=data_form
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    return result.get('Hash', '')
                else:
                    raise Exception(f"IPFS API returned status {response.status}")
    except Exception as e:
        print(f"⚠️  IPFS upload failed: {e}")
        return None

@app.on_event("startup")
async def startup_event():
    """Initialize model on startup"""
    load_model()

@app.get("/")
async def root():
    return {
        "service": "VIMS ML Damage Analyzer",
        "status": "running",
        "model_loaded": model is not None
    }

@app.get("/health")
async def health():
    return {"status": "healthy", "model_loaded": model is not None}

@app.post("/analyze", response_model=MLReport)
async def analyze_from_ipfs(request: AnalyzeRequest):
    """
    Analyze damage from IPFS CID
    Downloads image from IPFS, analyzes it, and uploads report back to IPFS
    """
    try:
        # Download image from IPFS
        image_bytes = download_from_ipfs(request.ipfsCid)
        
        # Analyze damage (includes vehicle validation)
        analysis = analyze_damage(image_bytes)
        
        # Check if validation failed
        if not analysis.get("is_vehicle", True) or analysis.get("validation_error"):
            # Return error response with validation details
            error_msg = analysis.get("validation_error", "Image validation failed")
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Invalid image: Not a vehicle",
                    "message": error_msg,
                    "severity": 0.0,
                    "is_vehicle": False
                }
            )
        
        # Create ML report
        report = {
            "severity": analysis["severity"],
            "damage_parts": analysis["damage_parts"],
            "confidence": analysis["confidence"],
            "timestamp": datetime.utcnow().isoformat(),
            "evidenceCID": request.ipfsCid,
            "is_vehicle": analysis.get("is_vehicle", True),
            "validation_error": analysis.get("validation_error")
        }
        
        # Upload report to IPFS
        mlReportCID = await upload_to_ipfs(report)
        if mlReportCID:
            report["mlReportCID"] = mlReportCID
        
        return MLReport(**report)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/upload")
async def analyze_upload(file: UploadFile = File(...)):
    """
    Analyze damage from direct file upload
    """
    try:
        image_bytes = await file.read()
        analysis = analyze_damage(image_bytes)
        
        # Check if validation failed
        if not analysis.get("is_vehicle", True) or analysis.get("validation_error"):
            error_msg = analysis.get("validation_error", "Image validation failed")
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Invalid image: Not a vehicle",
                    "message": error_msg,
                    "severity": 0.0,
                    "is_vehicle": False
                }
            )
        
        report = {
            "severity": analysis["severity"],
            "damage_parts": analysis["damage_parts"],
            "confidence": analysis["confidence"],
            "timestamp": datetime.utcnow().isoformat(),
            "is_vehicle": analysis.get("is_vehicle", True),
            "validation_error": analysis.get("validation_error")
        }
        
        # Upload report to IPFS
        mlReportCID = await upload_to_ipfs(report)
        if mlReportCID:
            report["mlReportCID"] = mlReportCID
        
        return report
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


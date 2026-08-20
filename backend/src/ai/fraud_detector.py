import sys
import json
import math

def check_cgpa_anomalies(records, historical_mean=7.8, historical_std=0.75):
    anomalies = []
    
    # Extract values for local statistics if we have a batch
    cgpas = []
    for r in records:
        try:
            cgpas.append(float(r.get("cgpa", 0)))
        except ValueError:
            pass
            
    # If we have a batch, compute the batch mean and std dev to detect anomalous batch entries (e.g. grade inflation)
    batch_mean = sum(cgpas) / len(cgpas) if cgpas else 0
    batch_std = 0
    if len(cgpas) > 1:
        variance = sum((x - batch_mean) ** 2 for x in cgpas) / (len(cgpas) - 1)
        batch_std = math.sqrt(variance)

    # Detect grade inflation (e.g. mean CGPA abnormally high)
    batch_anomaly = False
    if len(cgpas) >= 5:
        if batch_mean > 9.2:
            batch_anomaly = True
            
    for record in records:
        name = record.get("name", "Unknown")
        roll_no = record.get("rollNo", "N/A")
        cgpa_str = record.get("cgpa", "0")
        
        try:
            cgpa = float(cgpa_str)
        except ValueError:
            anomalies.append({
                "name": name,
                "rollNo": roll_no,
                "type": "CGPA_FORMAT_ERROR",
                "message": f"Invalid CGPA value: {cgpa_str}",
                "severity": "High"
            })
            continue

        # Rule 1: Out of bounds
        if cgpa < 0.0 or cgpa > 10.0:
            anomalies.append({
                "name": name,
                "rollNo": roll_no,
                "type": "OUT_OF_BOUNDS",
                "message": f"CGPA {cgpa} is outside valid 0-10 scale",
                "severity": "High"
            })
            continue

        # Rule 2: Anomaly relative to historical distribution (Z-score)
        z_score = (cgpa - historical_mean) / historical_std if historical_std > 0 else 0
        if z_score > 2.5:
            anomalies.append({
                "name": name,
                "rollNo": roll_no,
                "type": "HISTORICAL_OUTLIER",
                "message": f"CGPA {cgpa} is abnormally high compared to department average (Z-score: {z_score:.2f})",
                "severity": "Medium"
            })
        elif cgpa == 10.0 and z_score > 2.0:
            anomalies.append({
                "name": name,
                "rollNo": roll_no,
                "type": "PERFECT_SCORE_WARNING",
                "message": "Perfect 10.0 CGPA flagged for audit",
                "severity": "Low"
            })
            
    return anomalies, batch_anomaly, batch_mean

def check_university_anomalies(records):
    anomalies = []
    # Generic public domains that shouldn't be used for academic credentials
    generic_domains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "mailinator.com", "tempmail.com"]

    for record in records:
        name = record.get("name", "Unknown")
        roll_no = record.get("rollNo", "N/A")
        email = record.get("email", "").strip().lower()

        if not email:
            anomalies.append({
                "name": name,
                "rollNo": roll_no,
                "type": "MISSING_EMAIL",
                "message": "Student email is missing",
                "severity": "Low"
            })
            continue

        if "@" not in email:
            anomalies.append({
                "name": name,
                "rollNo": roll_no,
                "type": "INVALID_EMAIL_FORMAT",
                "message": f"Invalid email format: {email}",
                "severity": "High"
            })
            continue

        domain = email.split("@")[-1]

        # Check if the domain is a generic public email provider
        if domain in generic_domains:
            anomalies.append({
                "name": name,
                "rollNo": roll_no,
                "type": "GENERIC_EMAIL_ISSUER",
                "message": f"Academic email uses a generic domain: @{domain}. Official edu domain expected.",
                "severity": "Medium"
            })
            
    return anomalies

def main():
    try:
        # Read input JSON from stdin
        input_data = sys.stdin.read()
        if not input_data:
            print(json.dumps({"error": "No input provided"}), file=sys.stderr)
            sys.exit(1)
            
        data = json.loads(input_data)
        records = data.get("records", [])
        
        # Default historical statistics (can be passed in request)
        hist_mean = data.get("historical_mean", 7.8)
        hist_std = data.get("historical_std", 0.75)

        cgpa_anomalies, batch_anomaly, batch_mean = check_cgpa_anomalies(records, hist_mean, hist_std)
        uni_anomalies = check_university_anomalies(records)

        result = {
            "success": True,
            "cgpa_anomalies": cgpa_anomalies,
            "email_anomalies": uni_anomalies,
            "batch_stats": {
                "batch_anomaly": batch_anomaly,
                "batch_mean": batch_mean,
                "message": "Batch mean CGPA exceeds 9.2, indicating potential grade inflation or tampering" if batch_anomaly else "Batch looks normal"
            }
        }
        
        print(json.dumps(result, indent=2))

    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()

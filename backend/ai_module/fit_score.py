import math
# ---------------------------------
# Haversine Distance Function
# ---------------------------------
def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate distance (in km) between two GPS coordinates.
    """
    R = 6371  # Earth's radius (km)
    lat1 = math.radians(lat1)
    lon1 = math.radians(lon1)
    lat2 = math.radians(lat2)
    lon2 = math.radians(lon2)
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1)
        * math.cos(lat2)
        * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c
# ---------------------------------
# Volunteer-Task Fit Score
# ---------------------------------
def calculate_fit_score(volunteer: dict, task: dict) -> float:
    if not volunteer.get("available", False):
        return 0.0
    if volunteer["skill"].lower() == task["required_skill"].lower():
        skill_score = 100
    else:
        skill_score = 40
    distance = haversine_distance(
        volunteer["latitude"],
        volunteer["longitude"],
        task["latitude"],
        task["longitude"]
    )
    distance_score = max(0, 100 - distance * 2)
    urgency_score = task["urgency_score"]
    fit_score = (
        0.50 * skill_score +
        0.30 * distance_score +
        0.20 * urgency_score
    )
    return round(fit_score, 2)
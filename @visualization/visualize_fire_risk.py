import json
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from pathlib import Path

def load_buildings_data(filepath):
    """Load building data from JSON file."""
    with open(filepath, 'r') as f:
        return json.load(f)

def get_color_mapping(score):
    """Map risk scores to a color gradient from green to yellow to red."""
    if score < 33:
        return '#10B981'  # Green for low risk
    elif score < 66:
        return '#F59E0B'  # Yellow/Orange for medium risk
    else:
        return '#EF4444'  # Red for high risk

def create_risk_score_chart(buildings_data, output_file='risk_scores_chart.png'):
    """Create a bar chart of building risk scores."""
    # Extract building names and risk scores
    building_names = [b['building_name'] for b in buildings_data]
    risk_scores = [b['fire_risk_score'] for b in buildings_data]
    
    # Sort buildings by risk score for better visualization
    sorted_indices = np.argsort(risk_scores)[::-1]  # Sort in descending order
    building_names = [building_names[i] for i in sorted_indices]
    risk_scores = [risk_scores[i] for i in sorted_indices]
    
    # Create colors based on risk scores
    bar_colors = [get_color_mapping(score) for score in risk_scores]
    
    # Create figure with appropriate size based on number of buildings
    plt.figure(figsize=(max(12, len(building_names) * 0.5), 8))
    
    # Create bar chart
    bars = plt.bar(range(len(building_names)), risk_scores, color=bar_colors)
    
    # Set x-axis ticks and labels
    plt.xticks(range(len(building_names)), building_names, rotation=45, ha='right')
    
    # Add labels and title
    plt.xlabel('Building Name')
    plt.ylabel('Fire Risk Score')
    plt.title('UC Davis Buildings Fire Risk Assessment', fontsize=16, fontweight='bold')
    
    # Add a horizontal line at risk levels
    plt.axhline(y=33, color='#10B981', linestyle='--', alpha=0.5)
    plt.axhline(y=66, color='#EF4444', linestyle='--', alpha=0.5)
    
    # Add risk level labels
    plt.text(len(building_names)-1, 20, 'Low Risk', fontsize=10, ha='right', color='#10B981')
    plt.text(len(building_names)-1, 50, 'Medium Risk', fontsize=10, ha='right', color='#F59E0B')
    plt.text(len(building_names)-1, 85, 'High Risk', fontsize=10, ha='right', color='#EF4444')
    
    # Add annotations for highest risk buildings
    for i, (name, score) in enumerate(zip(building_names[:3], risk_scores[:3])):
        plt.annotate(f"{score}", xy=(i, score), xytext=(0, 5),
                    textcoords="offset points", ha='center', va='bottom', fontweight='bold')
    
    # Adjust layout
    plt.tight_layout()
    plt.grid(axis='y', linestyle='--', alpha=0.7)
    
    # Save the figure
    plt.savefig(output_file, dpi=300, bbox_inches='tight')
    print(f"Chart saved as {output_file}")
    
    return plt

def create_building_type_chart(buildings_data, output_file='risk_scores_by_type_chart.png'):
    """Create a grouped bar chart of building risk scores by building type."""
    # Check if building_type exists in the data
    if 'building_type' not in buildings_data[0]:
        print("Building type information not available. Skipping grouped chart.")
        return None
    
    # Convert to pandas DataFrame for easier grouping
    df = pd.DataFrame(buildings_data)
    
    # Group by building type
    building_types = df['building_type'].unique()
    
    # Set up the figure
    plt.figure(figsize=(max(14, len(building_types) * 4), 10))
    
    # Set width of bars
    bar_width = 0.8 / len(building_types)
    
    # Set up color palette for building types
    colors = sns.color_palette("husl", len(building_types))
    
    # Plot grouped bars
    for i, (building_type, color) in enumerate(zip(building_types, colors)):
        type_data = df[df['building_type'] == building_type]
        indices = np.arange(len(type_data))
        plt.bar(indices + i * bar_width, type_data['fire_risk_score'], 
                width=bar_width, label=building_type, color=color)
        
        # Add building names as x-tick labels
        plt.xticks(indices + bar_width * (len(building_types) - 1) / 2, 
                  type_data['building_name'], rotation=45, ha='right')
    
    # Add labels and title
    plt.xlabel('Building Name')
    plt.ylabel('Fire Risk Score')
    plt.title('UC Davis Buildings Fire Risk Assessment by Building Type', fontsize=16, fontweight='bold')
    plt.legend(title="Building Type")
    
    # Add risk level lines
    plt.axhline(y=33, color='#10B981', linestyle='--', alpha=0.5)
    plt.axhline(y=66, color='#EF4444', linestyle='--', alpha=0.5)
    
    # Adjust layout
    plt.tight_layout()
    plt.grid(axis='y', linestyle='--', alpha=0.7)
    
    # Save the figure
    plt.savefig(output_file, dpi=300, bbox_inches='tight')
    print(f"Grouped chart saved as {output_file}")
    
    return plt

def main():
    """Main function to run the visualization."""
    # Define input and output file paths
    buildings_file = 'buildings.json'
    
    # Check if sample data file exists, otherwise create a sample
    if not Path(buildings_file).exists():
        print(f"Sample data file not found. Creating {buildings_file}")
        sample_data = [
            {
                "building_name": "Tercero Residence Halls",
                "fire_risk_score": 72,
                "address": "Tercero Residence Halls, Davis, CA 95616",
                "latitude": 38.5362,
                "longitude": -121.7656,
                "building_type": "Residential",
                "fire_safety": {
                    "sprinkler": {"full": False, "partial": True},
                    "alarm": {
                        "smoke": True,
                        "duct": False,
                        "manual_pull": True,
                        "evac_device": False
                    },
                    "fire_separation": {"corridor": True, "room": False}
                },
                "num_fire_drills": 1,
                "electricity": 620000,
                "steam": 1200,
                "chilled_water": 800,
                "domestic_water": 950
            },
            {
                "building_name": "Segundo Residence Halls",
                "fire_risk_score": 65,
                "address": "Segundo Residence Halls, Davis, CA 95616",
                "latitude": 38.5396,
                "longitude": -121.7587,
                "building_type": "Residential",
                "fire_safety": {
                    "sprinkler": {"full": True, "partial": False},
                    "alarm": {
                        "smoke": True,
                        "duct": True,
                        "manual_pull": True,
                        "evac_device": False
                    },
                    "fire_separation": {"corridor": True, "room": True}
                },
                "num_fire_drills": 2,
                "electricity": 580000,
                "steam": 1100,
                "chilled_water": 700,
                "domestic_water": 900
            },
            {
                "building_name": "Sciences Laboratory Building",
                "fire_risk_score": 45,
                "address": "Sciences Laboratory Building, Davis, CA 95616",
                "latitude": 38.5376,
                "longitude": -121.7499,
                "building_type": "Academic",
                "fire_safety": {
                    "sprinkler": {"full": True, "partial": False},
                    "alarm": {
                        "smoke": True,
                        "duct": True,
                        "manual_pull": True,
                        "evac_device": True
                    },
                    "fire_separation": {"corridor": True, "room": True}
                },
                "num_fire_drills": 2,
                "electricity": 480000,
                "steam": 900,
                "chilled_water": 600,
                "domestic_water": 750
            },
            {
                "building_name": "Memorial Union",
                "fire_risk_score": 31,
                "address": "Memorial Union, Davis, CA 95616",
                "latitude": 38.5421,
                "longitude": -121.7490,
                "building_type": "Administrative",
                "fire_safety": {
                    "sprinkler": {"full": True, "partial": False},
                    "alarm": {
                        "smoke": True,
                        "duct": True,
                        "manual_pull": True,
                        "evac_device": True
                    },
                    "fire_separation": {"corridor": True, "room": True}
                },
                "num_fire_drills": 2,
                "electricity": 320000,
                "steam": 600,
                "chilled_water": 400,
                "domestic_water": 500
            },
            {
                "building_name": "Shields Library",
                "fire_risk_score": 28,
                "address": "Shields Library, Davis, CA 95616",
                "latitude": 38.5404,
                "longitude": -121.7490,
                "building_type": "Academic",
                "fire_safety": {
                    "sprinkler": {"full": True, "partial": False},
                    "alarm": {
                        "smoke": True,
                        "duct": True,
                        "manual_pull": True,
                        "evac_device": True
                    },
                    "fire_separation": {"corridor": True, "room": True}
                },
                "num_fire_drills": 2,
                "electricity": 290000,
                "steam": 550,
                "chilled_water": 380,
                "domestic_water": 450
            },
            {
                "building_name": "Meyer Hall",
                "fire_risk_score": 52,
                "address": "Meyer Hall, Davis, CA 95616",
                "latitude": 38.5342,
                "longitude": -121.7575,
                "building_type": "Research",
                "fire_safety": {
                    "sprinkler": {"full": False, "partial": True},
                    "alarm": {
                        "smoke": True,
                        "duct": False,
                        "manual_pull": True,
                        "evac_device": False
                    },
                    "fire_separation": {"corridor": True, "room": False}
                },
                "num_fire_drills": 1,
                "electricity": 510000,
                "steam": 950,
                "chilled_water": 650,
                "domestic_water": 800
            }
        ]
        with open(buildings_file, 'w') as f:
            json.dump(sample_data, f, indent=2)
    
    # Load data
    buildings_data = load_buildings_data(buildings_file)
    
    # Create visualization
    create_risk_score_chart(buildings_data)
    
    # Try to create grouped chart by building type
    try:
        create_building_type_chart(buildings_data)
    except Exception as e:
        print(f"Couldn't create grouped chart: {e}")
        
    print("Visualization complete!")
    print("The following files were generated:")
    print("- risk_scores_chart.png")
    print("- risk_scores_by_type_chart.png")

if __name__ == "__main__":
    main()

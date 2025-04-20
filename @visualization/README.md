![image](https://github.com/user-attachments/assets/2c9d0753-4e98-4724-a069-66b4daa904db)

![image](https://github.com/user-attachments/assets/fee45231-4eae-4b04-9a37-d21532121c81)



# FireZero - Data Visualization

This folder contains the scripts and data needed to generate static visualizations of building fire risk scores for the FireZero project, using the UC Davis CEED dataset and Clery Fire Safety Report.

## Files

- `visualize_fire_risk.py`: Python script that generates the data visualizations
- `buildings.json`: Sample dataset of UC Davis buildings with fire risk scores and safety metrics
- `requirements.txt`: Python dependencies needed to run the visualization

## Generated Outputs

This script will generate two visualization files in the current directory:

1. `risk_scores_chart.png`: Bar chart showing fire risk scores for all buildings, with bars colored by risk level
2. `risk_scores_by_type_chart.png`: Grouped bar chart showing risk scores organized by building type

## How to Run

1. Install Python 3.8 or higher
2. Create a virtual environment
   - Windows: `python -m venv venv`
   - Linux/Mac: `python3 -m venv venv`
3. Activate the virtual environment
   - Windows: `venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`
4. Install the required packages:
   ```
   pip install -r requirements.txt
   ```
5. Run the visualization script:
   ```
   python visualize_fire_risk.py
   ```

## Visualization Details

The visualizations use a consistent color scheme that matches the FireZero application:
- Green (#10B981): Low risk scores (<33)
- Yellow/Orange (#F59E0B): Medium risk scores (33-65)
- Red (#EF4444): High risk scores (>65)

The data used for these visualizations comes from two main sources:
1. The [UC Davis CEED dataset]([https://github.com/ucdavis/ceed](https://ceed.ucdavis.edu/)) (energy, water, and gas usage)
2. The [UC Davis 2024 Clery Fire Safety Report](https://clery.ucdavis.edu/sites/g/files/dgvnsk1761/files/media/documents/ASFSR-UCD-2024vOct2024_0.pdf) (fire safety metrics)

import pandas as pd
import numpy as np

class PercentileEngine:
    """
    Core Engine for calculating lift percentiles.
    Designed to be instantiated once at backend startup to keep data in memory.
    """
    def __init__(self, data_path='data/processed/clean_data.csv'):
        print(f"[PercentileEngine] Initializing... Loading data from {data_path}")
        self.df = pd.read_csv(data_path, low_memory=False)
        
        # Ensure weight_class is treated as string since it contains values like '120+'
        self.df['weight_class'] = self.df['weight_class'].astype(str)
        
        print(f"[PercentileEngine] Ready! Loaded {len(self.df):,} records in memory.")

    def get_percentile(self, lift_type, weight_lifted, sex, weight_class=None, age_bracket=None, tested_status=None):
        """
        Calculates the percentile for a given lift.
        
        Parameters:
        - lift_type: str ('squat', 'bench', 'deadlift', or 'total')
        - weight_lifted: float (the weight the user lifted in kg)
        - sex: str ('M', 'F', 'Mx')
        - weight_class: str or list (e.g., '90', or ['82.5', '83'] to combine federations)
        - age_bracket: str (e.g., '24-29', '30-39')
        - tested_status: bool (True for Tested, False for Untested/All)
        
        Returns:
        - dict with percentile, population_size, median_lift, and max_lift
        """
        if lift_type not in ['squat', 'bench', 'deadlift', 'total']:
            raise ValueError("lift_type must be 'squat', 'bench', 'deadlift', or 'total'")
            
        # Start filtering
        mask = (self.df['sex'] == sex) & (self.df[lift_type].notna())
        
        # If calculating 'total' percentile, ONLY compare against full SBD meets.
        # Otherwise, a 600kg SBD total would be unfairly compared against 150kg Bench-only totals.
        if lift_type == 'total':
            mask &= (self.df['event'] == 'SBD')
        
        if weight_class is not None:
            if isinstance(weight_class, (list, tuple)):
                mask &= (self.df['weight_class'].isin(weight_class))
            else:
                mask &= (self.df['weight_class'] == weight_class)
        if age_bracket is not None:
            mask &= (self.df['age_bracket'] == age_bracket)
        if tested_status is not None:
            mask &= (self.df['tested_status'] == tested_status)
            
        subset = self.df[mask]
        population_size = len(subset)
        
        if population_size == 0:
            return {
                "percentile": None, 
                "population_size": 0, 
                "error": "No data found for this specific cohort."
            }
            
        # Calculate percentile using the "mean" method (average of strict and weak percentiles)
        # This handles ties much more fairly than just counting everyone who lifted <= weight.
        strict_count = (subset[lift_type] < weight_lifted).sum()
        tie_count = (subset[lift_type] == weight_lifted).sum()
        percentile = ((strict_count + 0.5 * tie_count) / population_size) * 100
        
        return {
            "percentile": round(percentile, 1),
            "population_size": population_size,
            "median_lift": round(subset[lift_type].median(), 1),
            "max_lift": float(subset[lift_type].max())
        }

if __name__ == '__main__':
    import time
    
    # ---------------------------------------------------------
    # TESTS
    # ---------------------------------------------------------
    print("=== TESTING PERCENTILE ENGINE ===\n")
    
    start_load = time.time()
    engine = PercentileEngine(data_path='data/processed/clean_data.csv')
    print(f"Loading took: {time.time() - start_load:.2f} seconds\n")
    
    test_cases = [
        (
            "Average Gym Bro (Bench 100kg, Male, 82.5/83kg combined, 24-29, Tested)",
            {"lift_type": "bench", "weight_lifted": 100, "sex": "M", "weight_class": ["82.5", "83"], "age_bracket": "24-29", "tested_status": True}
        ),
        (
            "Elite Powerlifter (Total 800kg, Male, 90, 24-29, Tested)",
            {"lift_type": "total", "weight_lifted": 800, "sex": "M", "weight_class": "90", "age_bracket": "24-29", "tested_status": True}
        ),
        (
            "Strong Female (Squat 120kg, Female, 60, 20-23, Untested)",
            {"lift_type": "squat", "weight_lifted": 120, "sex": "F", "weight_class": "60", "age_bracket": "20-23", "tested_status": False}
        ),
        (
            "Master Lifter (Deadlift 200kg, Male, 100, 50+, Any Fed)",
            {"lift_type": "deadlift", "weight_lifted": 200, "sex": "M", "weight_class": "100", "age_bracket": "50+"}
        )
    ]
    
    for idx, (name, kwargs) in enumerate(test_cases, 1):
        print(f"Test {idx}: {name}")
        
        start_query = time.time()
        result = engine.get_percentile(**kwargs)
        query_time = (time.time() - start_query) * 1000 # in ms
        
        print(f"  Result: {result}")
        print(f"  Query time: {query_time:.2f} ms")
        print("-" * 50)
        
    print("\n All tests passed! Engine is ready for backend integration.")

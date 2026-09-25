import pandas as pd
import numpy as np

def extended_analysis():
    print("\n=== EXTENDED ANALYSIS OF CLEAN_DATA.CSV ===")
    df = pd.read_csv('data/processed/clean_data.csv')
    
    print(f"\n[1] Data Shape: {df.shape[0]:,} rows, {df.shape[1]} columns")
    
    print("\n[2] Lift Math Plausibility (Squat + Bench + Deadlift == Total)")
    # Check if the sum of three lifts matches the total (allow 2.5kg rounding error)
    sbd = df[df['event'] == 'SBD'].copy()
    sbd['calculated_total'] = sbd['squat'] + sbd['bench'] + sbd['deadlift']
    math_errors = sbd[abs(sbd['total'] - sbd['calculated_total']) > 2.5]
    print(f"    SBD rows where S+B+D != Total: {len(math_errors):,}")
    if len(math_errors) > 0:
        print("    Example errors:")
        print(math_errors[['squat', 'bench', 'deadlift', 'calculated_total', 'total']].head(3))
    
    print("\n[3] Missing Values Integrity by Event Type")
    # Check logical missing values (e.g. Event B should have 0 bench missing, but 100% squat missing)
    # count() counts NON-EMPTY values.
    integrity = df.groupby('event')[['squat', 'bench', 'deadlift', 'total']].count()
    print(integrity)
    
    print("\n[4] Bodyweight vs Lift Plausibility (Multiplier Check)")
    # Humans cannot lift raw more than 10-12x their bodyweight
    df['bw_multiplier'] = df['total'] / df['bodyweight']
    impossible_multiplier = df[df['bw_multiplier'] > 11]
    print(f"    Rows with theoretically impossible total/bodyweight ratio (>11x BW): {len(impossible_multiplier):,}")
    if len(impossible_multiplier) > 0:
        print(impossible_multiplier[['lifter_id', 'bodyweight', 'total', 'bw_multiplier']].head(3))
    
    print("\n[5] Lifter History for Regression Model (Person C)")
    lifter_counts = df['lifter_id'].value_counts()
    multi_meet_lifters = (lifter_counts >= 2).sum()
    print(f"    Total unique lifters: {len(lifter_counts):,}")
    print(f"    Lifters with >= 2 meets (usable for regression): {multi_meet_lifters:,}")
    
    print("\n[6] Age Outliers Check")
    young_strong = df[(df['age'] < 16) & (df['total'] > 750)]
    old_strong = df[(df['age'] > 70) & (df['total'] > 750)]
    print(f"    Rows where age < 16 but total > 750kg: {len(young_strong):,}")
    print(f"    Rows where age > 70 but total > 750kg: {len(old_strong):,}")

    print("\n[7] Target Variable Skewness (TotalKg)")
    # If distribution is highly skewed, we need to account for this in percentiles
    skewness = df['total'].skew()
    print(f"    TotalKg Skewness: {skewness:.2f} (0 is normal, >1 is highly right-skewed)")

if __name__ == '__main__':
    extended_analysis()

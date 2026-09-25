import pandas as pd
import numpy as np
import time

def extract_mean_age(age_class):
    if pd.isna(age_class):
        return np.nan
    try:
        if '-' in str(age_class):
            parts = str(age_class).split('-')
            return (float(parts[0]) + float(parts[1])) / 2
        return np.nan
    except:
        return np.nan

def main():
    start_time = time.time()
    
    RAW_DATA_PATH = 'data/raw/dataset/openpowerlifting-2026-09-19-ed07773f.csv'
    OUTPUT_PATH = 'data/processed/clean_data.csv'

    # 1. Load Data
    print(f"Loading data from {RAW_DATA_PATH}...")
    df = pd.read_csv(RAW_DATA_PATH, low_memory=False)
    print(f"Initial rows: {len(df):,}")

    # 2. Basic Filtering
    print("Filtering by Equipment, Event, and Place...")
    df_clean = df[df['Equipment'] == 'Raw'].copy()
    
    valid_events = ['SBD', 'S', 'B', 'D']
    df_clean = df_clean[df_clean['Event'].isin(valid_events)]
    
    invalid_places = ['DQ', 'DD', 'NS', 'G']
    df_clean = df_clean[~df_clean['Place'].isin(invalid_places)]
    
    # 3. Column Mapping and Formatting
    print("Formatting columns and parsing negative weights...")
    cols_to_keep = {
        'Name': 'lifter_id',
        'Sex': 'sex',
        'Age': 'age',
        'AgeClass': 'raw_age_class',
        'BodyweightKg': 'bodyweight',
        'WeightClassKg': 'weight_class',
        'Best3SquatKg': 'squat',
        'Best3BenchKg': 'bench',
        'Best3DeadliftKg': 'deadlift',
        'TotalKg': 'total',
        'Wilks': 'wilks_score',
        'Dots': 'dots_score',
        'Tested': 'tested_status',
        'Date': 'date',
        'Event': 'event'
    }
    df_clean = df_clean[list(cols_to_keep.keys())].rename(columns=cols_to_keep)

    for col in ['squat', 'bench', 'deadlift', 'total']:
        df_clean[col] = df_clean[col].apply(lambda x: np.nan if x < 0 else x)

    df_clean = df_clean.dropna(subset=['bodyweight'])

    # 4. Age Imputation and Bucketing
    print("Imputing age and creating age brackets...")
    missing_age_mask = df_clean['age'].isna()
    df_clean.loc[missing_age_mask, 'age'] = df_clean.loc[missing_age_mask, 'raw_age_class'].apply(extract_mean_age)

    df_clean = df_clean.dropna(subset=['age'])
    df_clean = df_clean[(df_clean['age'] >= 14) & (df_clean['age'] <= 80)]

    bins = [13, 19, 23, 29, 39, 49, 80]
    labels = ['14-19', '20-23', '24-29', '30-39', '40-49', '50+']
    df_clean['age_bracket'] = pd.cut(df_clean['age'], bins=bins, labels=labels)

    # 5. Anomaly Filtering
    print("Filtering anomalies (incomplete SBDs and unrealistic totals)...")
    # Drop rows where Event is SBD but one of the lifts is missing
    incomplete_sbd_mask = (df_clean['event'] == 'SBD') & (df_clean[['squat', 'bench', 'deadlift']].isna().any(axis=1))
    df_clean = df_clean[~incomplete_sbd_mask]
    
    # Drop rows with impossible raw totals (World Record is ~1152.5kg)
    df_clean = df_clean[df_clean['total'] <= 1200]

    # 6. Final Cleanup
    print("Final cleanup...")
    df_clean['tested_status'] = df_clean['tested_status'] == 'Yes'
    df_clean = df_clean.drop(columns=['raw_age_class'])

    expected_cols = ['lifter_id', 'sex', 'age', 'age_bracket', 'bodyweight', 'weight_class', 'squat', 'bench', 'deadlift', 'total', 'wilks_score', 'dots_score', 'tested_status', 'date', 'event']
    df_clean = df_clean[expected_cols]

    print(f"Final rows to save: {len(df_clean):,}")

    # 6. Save
    print(f"Saving to {OUTPUT_PATH}...")
    df_clean.to_csv(OUTPUT_PATH, index=False)
    
    elapsed = time.time() - start_time
    print(f"Preprocessing completed in {elapsed:.1f} seconds.")

if __name__ == '__main__':
    main()

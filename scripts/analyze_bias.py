import pandas as pd
import numpy as np

print("Loading data...")
df = pd.read_csv('data/processed/clean_data.csv', low_memory=False)
print("Data loaded! Calculating biases...")

print("\n--- 1. GENDER BIAS ---")
gender_counts = df['sex'].value_counts(normalize=True) * 100
print(f"Overall Gender Split:\n{gender_counts.round(1)}")
recent_df = df[pd.to_datetime(df['date']).dt.year >= 2018]
recent_gender = recent_df['sex'].value_counts(normalize=True) * 100
print(f"\nRecent (2018+) Gender Split:\n{recent_gender.round(1)}")

print("\n--- 2. AGE BIAS ---")
age_brackets = df['age_bracket'].value_counts(normalize=True) * 100
print(f"Age Bracket Distribution:\n{age_brackets.round(1)}")
print(f"Median Age: {df['age'].median()}")

print("\n--- 3. TIME (RECENCY) BIAS ---")
df['year'] = pd.to_datetime(df['date']).dt.year
post_2015 = (df['year'] >= 2015).mean() * 100
print(f"Percentage of records from 2015 or later: {post_2015:.1f}%")

print("\n--- 4. DRUG TESTING BIAS ---")
tested_counts = df['tested_status'].value_counts(normalize=True) * 100
print(f"Tested vs Untested Split:\n{tested_counts.round(1)}")

print("\n--- 5. RETENTION (SURVIVORSHIP) BIAS ---")
lifter_counts = df['lifter_id'].value_counts()
one_meet_wonders = (lifter_counts == 1).mean() * 100
print(f"Percentage of lifters who only ever competed ONCE: {one_meet_wonders:.1f}%")
print(f"Percentage of lifters with 5+ meets: {(lifter_counts >= 5).mean() * 100:.1f}%")

print("\n--- 6. WEIGHT CLASS BIAS (MEN) ---")
men_df = df[df['sex'] == 'M']
top_3_wc = men_df['weight_class'].value_counts(normalize=True).head(3).sum() * 100
print(f"Percentage of men concentrated in the Top 3 most popular weight classes: {top_3_wc:.1f}%")
print("Done!")
